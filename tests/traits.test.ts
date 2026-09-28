import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTrait } from '@/lib/game/data';
import { breakpoints, nextBreakpoint, tierStyle } from '@/lib/game/traits';

describe('trait tiers', () => {
    it('take their colors from the game data (R1)', () => {
        const cases: [string, number, string | null][] = [
            ['Hunter', 4, 'silver'],
            ['Invoker', 4, 'silver'],
            ['Coven', 5, 'silver'],
            ['Coven', 7, 'gold'],
            ['Elderwood', 7, 'gold'],
            ['Blossom', 7, 'gold'],
            ['Blossom', 11, 'prismatic'],
            ['Inferno', 5, 'gold'],
            ['Riftbeast', 7, 'gold'],
            ['Riftbeast', 10, 'gold'],
            ['Bounty Seeker', 1, 'unique'],
        ];
        for (const [trait, count, style] of cases) assert.equal(tierStyle(trait, count), style, `${trait} ${count}`);
    });

    it('mark every count inside a bronze tier as bronze, and nothing else (R2)', () => {
        const bronze: [string, number][] = [
            ['Juggernaut', 2], ['Juggernaut', 3], ['Blossom', 3], ['Blossom', 4], ['Riftbeast', 4], ['Sprykin', 4],
            ['Fae', 3], ['Primal', 3], ['Flora Fatalis', 1], ['Summoner', 2], ['Rival', 1],
        ];
        for (const [trait, count] of bronze) assert.equal(tierStyle(trait, count), 'bronze', `${trait} ${count}`);

        assert.equal(tierStyle('Solar', 3), 'gold', "Solar's only tier is gold");
        assert.equal(tierStyle('Solar', 2), null);
        assert.equal(tierStyle('Juggernaut', 4), 'silver');
        assert.equal(tierStyle('Flora Fatalis', 2), 'gold');
    });

    it('resolve overlapping Rival ranges to the most specific tier', () => {
        assert.equal(tierStyle('Rival', 1), 'bronze');
        assert.equal(tierStyle('Rival', 2), 'gold');
        assert.deepEqual(breakpoints(getTrait('Rival')!), [1, 2]);
    });

    it('report the next breakpoint', () => {
        const blossom = getTrait('Blossom')!;
        assert.equal(nextBreakpoint(blossom, 4), 5);
        assert.equal(nextBreakpoint(blossom, 9), 11);
        assert.equal(nextBreakpoint(blossom, 11), null);
    });
});
