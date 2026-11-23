import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTrait } from '@/lib/game/data';
import { breakpoints, nextBreakpoint, tierStyle } from '@/lib/game/traits';

describe('Set 19 trait tiers', () => {
    it('uses game-accurate tier colors', () => {
        const cases: [string, number, string | null][] = [
            ['Beach Pop', 3, 'bronze'],
            ['Beach Pop', 5, 'silver'],
            ['Beach Pop', 7, 'gold'],
            ['Pentakill', 3, 'bronze'],
            ['Pentakill', 5, 'silver'],
            ['Pentakill', 7, 'gold'],
            ['Heartsteel', 1, 'bronze'],
            ['Heartsteel', 3, 'silver'],
            ['Heartsteel', 5, 'silver'],
            ['Heartsteel', 7, 'gold'],
            ['True Damage', 3, 'bronze'],
            ['True Damage', 5, 'gold'],
            ['Ionic Spark', 7, 'gold'],
            ['Ionic Spark', 10, 'prismatic'],
            ['K/DA', 3, 'bronze'],
            ['K/DA', 5, 'silver'],
            ['K/DA', 15, 'gold'],
            ['K/DA', 21, 'prismatic'],
            ['Manager', 2, 'bronze'],
            ['Manager', 3, 'gold'],
            ['Manager', 4, 'gold'],
            ['One Monster Band', 1, 'unique'],
        ];
        for (const [trait, count, style] of cases) assert.equal(tierStyle(trait, count), style, `${trait} ${count}`);
    });

    it('marks every count inside a bronze tier as bronze, and non-bronze tiers accurately', () => {
        const bronze: [string, number][] = [
            ['Arcanist', 2], ['Arcanist', 3], ['Juggernaut', 2], ['Juggernaut', 3],
            ['Beach Pop', 3], ['Beach Pop', 4], ['Heartsteel', 1], ['Heartsteel', 2],
            ['R&B', 1], ['K/DA', 3], ['K/DA', 4], ['Rock', 3],
        ];
        for (const [trait, count] of bronze) assert.equal(tierStyle(trait, count), 'bronze', `${trait} ${count}`);

        assert.equal(tierStyle('EDM', 2), 'gold', "EDM's only tier is gold");
        assert.equal(tierStyle('EDM', 1), null);
        assert.equal(tierStyle('R&B', 2), 'gold');
        assert.equal(tierStyle('Juggernaut', 4), 'silver');
    });

    it('reports distinct breakpoints and next breakpoint', () => {
        const ionic = getTrait('Ionic Spark')!;
        assert.deepEqual(breakpoints(ionic), [3, 5, 7, 10]);
        assert.equal(nextBreakpoint(ionic, 4), 5);
        assert.equal(nextBreakpoint(ionic, 7), 10);
        assert.equal(nextBreakpoint(ionic, 10), null);
    });
});
