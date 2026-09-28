// Beam search over sets of units (never orderings). Each step scores every "board + one unit" child
// incrementally from its parent, keeps the best `beamWidth` distinct sets, and only then builds them.
// Emblems count through the holder rule, min(copies, units lacking the trait); the exact assignment
// with the 3-item cap is applied to the final candidates in index.ts.
import { TRAITS } from '@/lib/game/data';
import { RIVAL, traitContribution, unitSlots } from '@/lib/game/rules';
import { activeTier, breakpoints } from '@/lib/game/traits';
import type { Champion } from '@/lib/game/types';
import type { Strategy } from '@/lib/solver/types';
import { compareScores } from '@/lib/solver/score';

/** Tier tables cover trait counts up to this value; Set 18 boards stay far below it. */
const MAX_COUNT = 30;

// Per-trait summary contributions, packed 6 bits per field so a board's totals are plain sums
// (each field stays below 64: a board has at most ~35 traits).
const ACTIVE = 1;
const GOLD_PLUS = 1 << 6;
const BRONZE = 1 << 12;
const field = (packed: number, unit: number) => Math.floor(packed / unit) & 63;

/** Radix for folding the beam ordering into one number (every component stays below it). */
const RADIX = 64;
/** Weight of partial progress toward activating more traits, relative to one active trait. */
const PROGRESS_WEIGHT = 0.5;
/** Set ids are two 26-bit XOR halves combined into one exact double. */
const HALF = 2 ** 26;

export interface SearchSpec {
    /** Candidates, excluding locked units. */
    pool: readonly Champion[];
    locked: readonly Champion[];
    emblems: readonly string[];
    strategy: Strategy;
    baseSlots: number;
    rivalsAugment: boolean;
    beamWidth: number;
    /** How many of the best finished boards get a 1-swap polish. */
    polishCount: number;
}

interface Unit {
    champion: Champion;
    slots: number;
    cost: number;
    unitKey: number;
    traits: number[];
    contributions: number[];
    hashHi: number;
    hashLo: number;
}

export interface State {
    /** Sorted unit indices; locked units are 0..lockedCount-1. */
    members: number[];
    /** Order-independent set id (Zobrist hash halves). */
    idHi: number;
    idLo: number;
    counts: Int8Array;
    /** Members that have each trait (they can't hold its emblem). */
    holders: Int8Array;
    usedUnits: Uint8Array;
    size: number;
    slots: number;
    cost: number;
    /** Sum of packed per-trait summaries at the current effective counts. */
    summary: number;
    /** Sum of progressAt at the current effective counts. */
    progress: number;
}

export interface Scored {
    state: State;
    score: number[];
}

export const stateId = (s: State) => s.idHi * HALF + s.idLo;

export class Search {
    readonly units: Unit[];
    readonly lockedCount: number;
    private readonly unitKeyCount: number;
    private readonly T = TRAITS.length;
    private readonly tierAt: Int8Array[];
    private readonly summaryAt: Float64Array[];
    /** Partial progress of an inactive origin/class trait toward its first breakpoint (count / breakpoint). */
    private readonly progressAt: Float64Array[];
    private readonly bps: number[][];
    private readonly emblemCopies: Int8Array;
    /** Distinct emblem traits in pick order. */
    private readonly emblemOrder: number[];
    /** Units with each emblem trait, biggest contribution first. */
    private readonly emblemUnits: number[][];
    private readonly sizeTrait: number;
    private readonly sizeMin: number;
    private readonly sizeBonus: number;
    /** Scratch buffers: counts of the traits touched by the last childSummary call. */
    private readonly stamp: Int32Array;
    private readonly scratchCount: Int16Array;
    private stampValue = 0;
    /** Progress of the child last passed to childSummary. */
    private childProgress = 0;

    constructor(private readonly spec: SearchSpec) {
        const traitIndex = new Map(TRAITS.map((t, i) => [t.key, i]));
        const rival = traitIndex.get(RIVAL) ?? -1;
        const suppressed = (t: number, n: number) => t === rival && n > 1 && !spec.rivalsAugment;

        this.bps = TRAITS.map(t => breakpoints(t));
        this.tierAt = TRAITS.map((t, i) => Int8Array.from({ length: MAX_COUNT + 1 }, (_, n) =>
            suppressed(i, n) ? -1 : activeTier(t, n)?.index ?? -1));
        this.summaryAt = TRAITS.map((t, i) => Float64Array.from({ length: MAX_COUNT + 1 }, (_, n) => {
            const tier = n === 0 || suppressed(i, n) ? null : activeTier(t, n);
            if (!tier) return 0;
            const style = tier.tier.style;
            let packed = style === 'bronze' ? BRONZE : 0;
            if (t.kind !== 'unique') packed += ACTIVE + (style === 'gold' || style === 'prismatic' ? GOLD_PLUS : 0);
            return packed;
        }));
        this.progressAt = TRAITS.map((t, i) => Float64Array.from({ length: MAX_COUNT + 1 }, (_, n) => {
            if (n === 0 || t.kind === 'unique') return 0;
            if (activeTier(t, n) && !suppressed(i, n)) return 0;
            // Bronze For Life only cares about traits whose first tier is bronze
            const firstIsBronze = activeTier(t, this.bps[i][0])?.tier.style === 'bronze';
            return spec.strategy === 'BronzeLife' && !firstIsBronze ? 0 : n / this.bps[i][0];
        }));
        this.sizeTrait = TRAITS.findIndex(t => t.teamSize);
        this.sizeMin = this.sizeTrait >= 0 ? TRAITS[this.sizeTrait].teamSize!.min : Infinity;
        this.sizeBonus = this.sizeTrait >= 0 ? TRAITS[this.sizeTrait].teamSize!.bonus : 0;

        const random = mulberry32(0x5eed18);
        const unitKeys = new Map<string, number>();
        this.units = [...spec.locked, ...spec.pool].map(champion => {
            const known = champion.traits.filter(t => traitIndex.has(t));
            if (!unitKeys.has(champion.unitId)) unitKeys.set(champion.unitId, unitKeys.size);
            return {
                champion,
                slots: unitSlots(champion),
                cost: champion.cost,
                unitKey: unitKeys.get(champion.unitId)!,
                traits: known.map(t => traitIndex.get(t)!),
                contributions: known.map(t => traitContribution(champion, t)),
                hashHi: Math.floor(random() * HALF),
                hashLo: Math.floor(random() * HALF),
            };
        });
        this.lockedCount = spec.locked.length;
        this.unitKeyCount = unitKeys.size;

        this.emblemCopies = new Int8Array(this.T);
        this.emblemOrder = [];
        for (const emblem of spec.emblems) {
            const t = traitIndex.get(emblem);
            if (t === undefined) continue;
            if (this.emblemCopies[t]++ === 0) this.emblemOrder.push(t);
        }
        this.emblemUnits = this.emblemOrder.map(t => this.units
            .map((u, i) => ({ i, amount: this.contribution(u, t) }))
            .filter(x => x.amount > 0 && x.i >= this.lockedCount)
            .sort((a, b) => b.amount - a.amount)
            .map(x => x.i));
        this.stamp = new Int32Array(this.T);
        this.scratchCount = new Int16Array(this.T);
    }

    private contribution(unit: Unit, t: number): number {
        const k = unit.traits.indexOf(t);
        return k < 0 ? 0 : unit.contributions[k];
    }

    /** Builds a state from scratch (the locked start, and the base of each swap). */
    build(members: number[]): State {
        const state: State = {
            members: [...members].sort((a, b) => a - b),
            idHi: 0,
            idLo: 0,
            counts: new Int8Array(this.T),
            holders: new Int8Array(this.T),
            usedUnits: new Uint8Array(this.unitKeyCount),
            size: 0,
            slots: 0,
            cost: 0,
            summary: 0,
            progress: 0,
        };
        for (const i of state.members) {
            const unit = this.units[i];
            for (let k = 0; k < unit.traits.length; k++) {
                state.counts[unit.traits[k]] += unit.contributions[k];
                state.holders[unit.traits[k]] += 1;
            }
            state.usedUnits[unit.unitKey] = 1;
            state.size += 1;
            state.slots += unit.slots;
            state.cost += unit.cost;
            state.idHi ^= unit.hashHi;
            state.idLo ^= unit.hashLo;
        }
        for (let t = 0; t < this.T; t++) {
            const n = Math.min(this.effective(state, t), MAX_COUNT);
            state.summary += this.summaryAt[t][n];
            state.progress += this.progressAt[t][n];
        }
        return state;
    }

    private materialize(parent: State, i: number): State {
        const unit = this.units[i];
        const summary = this.childSummary(parent, i);
        const state: State = {
            progress: this.childProgress,
            members: insertSorted(parent.members, i),
            idHi: parent.idHi ^ unit.hashHi,
            idLo: parent.idLo ^ unit.hashLo,
            counts: parent.counts.slice(),
            holders: parent.holders.slice(),
            usedUnits: parent.usedUnits.slice(),
            size: parent.size + 1,
            slots: parent.slots + unit.slots,
            cost: parent.cost + unit.cost,
            summary,
        };
        for (let k = 0; k < unit.traits.length; k++) {
            state.counts[unit.traits[k]] += unit.contributions[k];
            state.holders[unit.traits[k]] += 1;
        }
        state.usedUnits[unit.unitKey] = 1;
        return state;
    }

    private effective(state: State, t: number): number {
        const copies = this.emblemCopies[t];
        return copies ? state.counts[t] + Math.min(copies, state.size - state.holders[t]) : state.counts[t];
    }

    /**
     * Summary of `parent` + unit `i`. Only the unit's traits and the emblem traits (whose holder count moves
     * with board size) change; their new counts are left in scratchCount for this stampValue.
     */
    private childSummary(parent: State, i: number): number {
        const unit = this.units[i];
        const stamp = ++this.stampValue;
        let summary = parent.summary;
        this.childProgress = parent.progress;
        for (let k = 0; k < unit.traits.length; k++) summary += this.touch(parent, unit.traits[k], unit.contributions[k], 1, stamp);
        for (let e = 0; e < this.emblemOrder.length; e++) {
            const t = this.emblemOrder[e];
            if (this.stamp[t] !== stamp) summary += this.touch(parent, t, 0, 0, stamp);
        }
        return summary;
    }

    /** Summary delta for trait `t` when a unit adding `add` (and `holder` holders) joins `parent`. */
    private touch(parent: State, t: number, add: number, holder: number, stamp: number): number {
        const copies = this.emblemCopies[t];
        const before = copies ? parent.counts[t] + Math.min(copies, parent.size - parent.holders[t]) : parent.counts[t];
        const next = copies
            ? parent.counts[t] + add + Math.min(copies, parent.size + 1 - parent.holders[t] - holder)
            : parent.counts[t] + add;
        this.stamp[t] = stamp;
        this.scratchCount[t] = next;
        const n = next > MAX_COUNT ? MAX_COUNT : next;
        const b = before > MAX_COUNT ? MAX_COUNT : before;
        this.childProgress += this.progressAt[t][n] - this.progressAt[t][b];
        return this.summaryAt[t][n] - this.summaryAt[t][b];
    }

    /** Count of trait `t` in the child last passed to childSummary. */
    private childCount(parent: State, t: number): number {
        return this.stamp[t] === this.stampValue ? this.scratchCount[t] : this.effective(parent, t);
    }

    /** Board slots for this set: the trait bonus counts only if its units fit before it applies. */
    capacity(state: State): number {
        const base = this.spec.baseSlots;
        const t = this.sizeTrait;
        if (t < 0 || this.effective(state, t) < this.sizeMin) return base;
        const target = Math.max(0, this.sizeMin - (this.effective(state, t) - state.counts[t]));
        const best = new Array<number>(target + 1).fill(Infinity);
        best[0] = 0;
        for (const i of state.members) {
            const unit = this.units[i];
            const amount = this.contribution(unit, t);
            if (amount === 0) continue;
            for (let a = target; a >= 0; a--) {
                if (best[a] === Infinity) continue;
                const next = Math.min(target, a + amount);
                best[next] = Math.min(best[next], best[a] + unit.slots);
            }
        }
        return best[target] <= base ? base + this.sizeBonus : base;
    }

    isValid(state: State): boolean {
        return state.slots <= this.capacity(state);
    }

    /** Whether `parent` + unit `i` is a valid board; only boards past the base slots need the full check. */
    private childFits(parent: State, i: number): boolean {
        const slots = parent.slots + this.units[i].slots;
        if (slots <= this.spec.baseSlots) return true;
        if (slots > this.spec.baseSlots + this.sizeBonus) return false;
        return this.isValid(this.materialize(parent, i));
    }

    /** Same key as score.ts#teamScore, from the fast counts. */
    score(state: State): number[] {
        return this.scoreFrom(state.summary, state.cost, t => this.effective(state, t));
    }

    private scoreFrom(summary: number, cost: number, countOf: (t: number) => number): number[] {
        const active = field(summary, ACTIVE);
        if (this.spec.strategy === 'Vertical') {
            const tiers = this.emblemOrder.map(t => this.tierAt[t][Math.min(countOf(t), MAX_COUNT)] + 1);
            return [...tiers, active, field(summary, GOLD_PLUS), cost];
        }
        const emblemActive = this.emblemOrder.filter(t => this.tierAt[t][Math.min(countOf(t), MAX_COUNT)] >= 0).length;
        return [emblemActive, field(summary, BRONZE), active, cost];
    }

    /** A finished board's score folded like beamValue (cost scaled into the last digit). */
    private foldScore(score: number[]): number {
        let folded = 0;
        for (let k = 0; k < score.length - 1; k++) folded = folded * RADIX + score[k];
        return folded * RADIX + score[score.length - 1] / 100;
    }

    /** Most a trait can still grow from `slotsLeft` more units (best contributions among unused units). */
    private maxGain(parent: State, e: number, slotsLeft: number, extraKey: number): number {
        let gain = 0;
        let taken = 0;
        const t = this.emblemOrder[e];
        const list = this.emblemUnits[e];
        for (let j = 0; j < list.length && taken < slotsLeft; j++) {
            const unit = this.units[list[j]];
            if (parent.usedUnits[unit.unitKey] || unit.unitKey === extraKey) continue;
            gain += this.contribution(unit, t);
            taken++;
        }
        return gain;
    }

    /**
     * Beam ordering for `parent` + unit `i`, folded into one number: progress of each emblem trait toward a
     * breakpoint it can still reach, then secondary traits, then cost. Finished boards use their real score.
     */
    private beamValue(parent: State, i: number): number {
        const unit = this.units[i];
        const summary = this.childSummary(parent, i);
        const size = parent.size + 1;
        const cost = parent.cost + unit.cost;
        const slotsLeft = Math.max(0, this.spec.baseSlots - parent.slots - unit.slots);
        const vertical = this.spec.strategy === 'Vertical';

        let emblemPart = 0;
        for (let e = 0; e < this.emblemOrder.length; e++) {
            const t = this.emblemOrder[e];
            const count = this.childCount(parent, t);
            const tier = this.tierAt[t][Math.min(count, MAX_COUNT)];
            let progress = tier + 1;
            const next = this.bps[t][tier + 1];
            if (next !== undefined && slotsLeft > 0) {
                const unitAdds = this.contribution(unit, t);
                const held = count - parent.counts[t] - unitAdds;
                const lacking = size + slotsLeft - parent.holders[t] - (unitAdds > 0 ? 1 : 0);
                const unheld = Math.max(0, Math.min(this.emblemCopies[t], lacking) - held);
                if (count + this.maxGain(parent, e, slotsLeft, unit.unitKey) + Math.min(unheld, slotsLeft) >= next) {
                    const prev = tier >= 0 ? this.bps[t][tier] : 0;
                    progress += Math.min(0.99, Math.max(0, (count - prev) / (next - prev)));
                }
            }
            // Vertical: each emblem trait is its own digit (pick order = priority). Bronze For Life: a total.
            emblemPart = vertical ? emblemPart * RADIX + progress : emblemPart + Math.min(1, progress);
        }

        if (slotsLeft === 0) return this.foldScore(this.scoreFrom(summary, cost, t => this.childCount(parent, t)));
        const progress = PROGRESS_WEIGHT * this.childProgress;
        const active = field(summary, ACTIVE);
        if (vertical) return ((emblemPart * RADIX + active + progress) * RADIX + field(summary, GOLD_PLUS)) * RADIX;
        return ((emblemPart * RADIX + field(summary, BRONZE) + progress) * RADIX + active) * RADIX;
    }

    /** Runs the beam search from the locked units; returns every finished board it kept, best first. */
    run(): Scored[] {
        const start = this.build(Array.from({ length: this.lockedCount }, (_, i) => i));
        const finished = new Map<number, State>();
        let beam = [start];

        while (beam.length) {
            const parents: number[] = [];
            const unitsAdded: number[] = [];
            const ids: number[] = [];
            const orders: number[] = [];
            for (let p = 0; p < beam.length; p++) {
                const parent = beam[p];
                let produced = 0;
                for (let i = this.lockedCount; i < this.units.length; i++) {
                    const unit = this.units[i];
                    if (parent.usedUnits[unit.unitKey] || !this.childFits(parent, i)) continue;
                    produced++;
                    parents.push(p);
                    unitsAdded.push(i);
                    ids.push((parent.idHi ^ unit.hashHi) * HALF + (parent.idLo ^ unit.hashLo));
                    orders.push(this.beamValue(parent, i));
                }
                if (produced === 0) finished.set(stateId(parent), parent);
            }
            if (!parents.length) break;
            beam = selectTop(orders, ids, this.spec.beamWidth).map(k => this.materialize(beam[parents[k]], unitsAdded[k]));
        }

        const ranked = rank([...finished.values()].map(state => ({ state, score: this.score(state) })));
        for (const polished of ranked.slice(0, this.spec.polishCount).map(x => this.polish(x))) {
            const id = stateId(polished.state);
            if (!finished.has(id)) {
                finished.set(id, polished.state);
                ranked.push(polished);
            }
        }
        return rank(ranked);
    }

    /** 1-swap hill climbing on a finished board (locked units stay; the board must stay full). */
    private polish(start: Scored): Scored {
        let best = start;
        for (let improved = true; improved;) {
            improved = false;
            for (const out of best.state.members) {
                if (out < this.lockedCount) continue;
                const without = this.build(best.state.members.filter(m => m !== out));
                for (let i = this.lockedCount; i < this.units.length; i++) {
                    const unit = this.units[i];
                    if (i === out || without.usedUnits[unit.unitKey] || without.slots + unit.slots !== best.state.slots) continue;
                    const summary = this.childSummary(without, i);
                    const score = this.scoreFrom(summary, without.cost + unit.cost, t => this.childCount(without, t));
                    if (compareScores(score, best.score) >= 0) continue;
                    const candidate = this.materialize(without, i);
                    if (candidate.slots !== this.capacity(candidate)) continue;
                    best = { state: candidate, score };
                    improved = true;
                    break;
                }
                if (improved) break;
            }
        }
        return best;
    }
}

/**
 * Indices of the `k` best distinct children: highest order first, ties by id (deterministic).
 * A child reachable from several parents appears several times with the same id and order.
 */
function selectTop(orders: number[], ids: number[], k: number): number[] {
    const n = orders.length;
    const byOrder = (a: number, b: number) => orders[b] - orders[a] || ids[a] - ids[b];
    const pick = (candidates: number[]) => {
        candidates.sort(byOrder);
        const seen = new Set<number>();
        const out: number[] = [];
        for (const c of candidates) {
            if (out.length === k) break;
            if (seen.has(ids[c])) continue;
            seen.add(ids[c]);
            out.push(c);
        }
        return out;
    };

    // Only sort the children at or above the order of the (4k)th best; fall back to all of them when
    // duplicates leave fewer than k distinct sets in that slice.
    const cut = Math.min(n, 4 * k);
    if (cut < n) {
        const threshold = kthLargest(Float64Array.from(orders), cut - 1);
        const candidates: number[] = [];
        for (let c = 0; c < n; c++) if (orders[c] >= threshold) candidates.push(c);
        const out = pick(candidates);
        if (out.length === k) return out;
    }
    return pick(Array.from({ length: n }, (_, c) => c));
}

/** Value that would sit at index `k` if `values` were sorted descending (quickselect, reorders `values`). */
function kthLargest(values: Float64Array, k: number): number {
    let lo = 0;
    let hi = values.length - 1;
    while (lo < hi) {
        const pivot = values[(lo + hi) >> 1];
        let i = lo;
        let j = hi;
        while (i <= j) {
            while (values[i] > pivot) i++;
            while (values[j] < pivot) j--;
            if (i <= j) {
                const tmp = values[i];
                values[i] = values[j];
                values[j] = tmp;
                i++;
                j--;
            }
        }
        if (k <= j) hi = j;
        else if (k >= i) lo = i;
        else break;
    }
    return values[k];
}

function insertSorted(sorted: number[], value: number): number[] {
    const out = new Array<number>(sorted.length + 1);
    let j = 0;
    let inserted = false;
    for (const v of sorted) {
        if (!inserted && value < v) {
            out[j++] = value;
            inserted = true;
        }
        out[j++] = v;
    }
    if (!inserted) out[j] = value;
    return out;
}

function rank(items: Scored[]): Scored[] {
    return items.sort((a, b) => compareScores(a.score, b.score) || stateId(a.state) - stateId(b.state));
}

/** Small seeded PRNG so set ids (and tie-breaks) are identical across runs. */
function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
