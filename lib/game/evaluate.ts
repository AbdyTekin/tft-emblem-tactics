import { getTrait } from '@/lib/game/data';
import { assignEmblems } from '@/lib/game/emblems';
import { emblemContribution, isTraitSuppressed, teamSizeFor, traitContribution, unitSlots, type BoardSize } from '@/lib/game/rules';
import { activeTier, nextBreakpoint, STYLE_RANK } from '@/lib/game/traits';
import type { Champion, TierStyle, TraitKind } from '@/lib/game/types';

export interface TeamOptions extends BoardSize {
    /** One entry per emblem owned, highest priority first. */
    emblems?: readonly string[];
}

export interface TraitState {
    trait: string;
    kind: TraitKind;
    /** Units plus emblems that have a holder (K/DA counts 2 per unit/emblem for 2-star boards). */
    count: number;
    /** Number of held emblem items contributing to `count`. */
    emblems: number;
    tierIndex: number;
    /** Null when inactive. */
    style: TierStyle | null;
    /** Next breakpoint above `count`, or null at the top tier. */
    next: number | null;
    /** Active by count but switched off by a rule outside breakpoints. */
    suppressed: boolean;
}

export interface EmblemHolder {
    trait: string;
    /** Null when no unit on the board can hold it. */
    holder: Champion | null;
}

export interface TeamEvaluation {
    slotsUsed: number;
    teamSize: number;
    /** Fits the board and has at most one unit per unitId. */
    valid: boolean;
    /** Every trait with a count, active ones first (prismatic > gold > silver > bronze > unique), then by count. */
    traits: TraitState[];
    emblemHolders: EmblemHolder[];
}

export function evaluateTeam(team: readonly Champion[], options: TeamOptions): TeamEvaluation {
    const emblems = options.emblems ?? [];
    const holders = assignEmblems(team, emblems);

    const counts = new Map<string, { count: number; emblems: number }>();
    const add = (trait: string, count: number, emblem: number) => {
        const entry = counts.get(trait) ?? { count: 0, emblems: 0 };
        entry.count += count;
        entry.emblems += emblem;
        counts.set(trait, entry);
    };
    for (const champion of team) {
        for (const trait of champion.traits) add(trait, traitContribution(champion, trait), 0);
    }
    const emblemCounts = new Map<string, number>();
    emblems.forEach((trait, i) => {
        if (holders[i] === null) return;
        const contribution = emblemContribution(trait);
        add(trait, contribution, 1);
        emblemCounts.set(trait, (emblemCounts.get(trait) ?? 0) + contribution);
    });

    const traits: TraitState[] = [];
    for (const [key, { count, emblems: fromEmblems }] of counts) {
        const trait = getTrait(key);
        if (!trait) continue;
        const suppressed = isTraitSuppressed();
        const active = suppressed ? null : activeTier(trait, count);
        traits.push({
            trait: key,
            kind: trait.kind,
            count,
            emblems: fromEmblems,
            tierIndex: active?.index ?? -1,
            style: active?.tier.style ?? null,
            next: nextBreakpoint(trait, count),
            suppressed,
        });
    }
    traits.sort((a, b) =>
        Number(b.style !== null) - Number(a.style !== null) ||
        (b.style ? STYLE_RANK[b.style] : 0) - (a.style ? STYLE_RANK[a.style] : 0) ||
        b.count - a.count ||
        a.trait.localeCompare(b.trait));

    const slotsUsed = team.reduce((sum, c) => sum + unitSlots(c), 0);
    const teamSize = teamSizeFor(team, options, emblemCounts);
    const oneOfEach = new Set(team.map(c => c.unitId)).size === team.length;

    return {
        slotsUsed,
        teamSize,
        valid: oneOfEach && slotsUsed <= teamSize,
        traits,
        emblemHolders: emblems.map((trait, i) => ({ trait, holder: holders[i] === null ? null : team[holders[i]!] })),
    };
}
