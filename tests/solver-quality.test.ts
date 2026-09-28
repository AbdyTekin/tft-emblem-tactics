import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHAMPIONS, EMBLEM_TRAITS } from '@/lib/game/data';
import { solveTeams } from '@/lib/solver';
import { Search, type SearchSpec } from '@/lib/solver/search';
import { compareScores } from '@/lib/solver/score';
import type { Strategy } from '@/lib/solver/types';

/** Seeded PRNG so the sampled instances never change. */
function random(seed: number): () => number {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Best score over every full, valid board from the pool (brute force). */
function exhaustiveBest(spec: SearchSpec): number[] {
    const search = new Search(spec);
    const maxSlots = spec.baseSlots + 2;
    let best: number[] | null = null;
    const members: number[] = [];
    const visit = (from: number, slots: number) => {
        const state = search.build(members);
        if (search.isValid(state) && state.slots === search.capacity(state)) {
            const score = search.score(state);
            if (!best || compareScores(score, best) < 0) best = score;
        }
        for (let i = from; i < search.units.length; i++) {
            const unit = search.units[i];
            if (slots + unit.slots > maxSlots || members.some(m => search.units[m].unitKey === unit.unitKey)) continue;
            members.push(i);
            visit(i + 1, slots + unit.slots);
            members.pop();
        }
    };
    visit(0, 0);
    return best!;
}

describe('solver quality', () => {
    it('finds the exhaustive optimum on random 20-unit pools', () => {
        const next = random(18);
        let optimal = 0;
        const trials = 24;
        for (let trial = 0; trial < trials; trial++) {
            const strategy: Strategy = trial % 2 ? 'BronzeLife' : 'Vertical';
            const pool = [...CHAMPIONS].sort(() => next() - 0.5).slice(0, 20);
            const traits = [...new Set(pool.flatMap(c => c.traits))].filter(t => EMBLEM_TRAITS.includes(t));
            const emblems = [traits[Math.floor(next() * traits.length)]];
            if (next() < 0.5) emblems.push(traits[Math.floor(next() * traits.length)]);
            const level = 5 + (trial % 2);
            const spec: SearchSpec = { pool, locked: [], emblems, strategy, baseSlots: level, rivalsAugment: false, beamWidth: 250, polishCount: 12 };

            const best = exhaustiveBest(spec);
            const result = solveTeams({ pool, emblems, strategy, level, limit: 1 });
            assert.equal(result.status, 'ok');
            const score = result.status === 'ok' ? result.teams[0].score : [];
            assert.ok(compareScores(score, best) >= 0, 'never beats the brute-force optimum');
            if (compareScores(score, best) === 0) optimal++;
        }
        assert.ok(optimal >= trials - 1, `optimal on ${optimal}/${trials}`);
    });
});
