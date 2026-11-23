import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignEmblems } from '@/lib/game/emblems';
import { team } from './helpers';

const holderNames = (units: ReturnType<typeof team>, holders: (number | null)[]) =>
    holders.map(h => (h === null ? null : units[h].name));

describe('emblem holders', () => {
    it('never gives an emblem to a unit that already has the trait', () => {
        const units = team('Ahri', 'Lillia', 'Neeko');
        assert.deepEqual(assignEmblems(units, ['K/DA']), [null]);
    });

    it('needs a different holder for each copy of the same emblem', () => {
        const units = team('Ahri', 'Lillia', 'Sett');
        assert.deepEqual(holderNames(units, assignEmblems(units, ['K/DA', 'K/DA', 'K/DA'])), ['Sett', null, null]);
    });

    it('lets one unit hold several different emblems, up to three items', () => {
        const units = team('Sett');
        assert.deepEqual(
            holderNames(units, assignEmblems(units, ['K/DA', 'Pentakill', 'Rock', 'Slayer'])),
            ['Sett', 'Sett', 'Sett', null],
        );
    });

    it('reroutes earlier emblems to fit later ones', () => {
        // Ziggs already has Hyperpop, Arcanist, and Swiftstriker, so only Taric can hold those three;
        // K/DA must move to Ziggs to make room.
        const units = team('Taric', 'Ziggs');
        assert.deepEqual(
            holderNames(units, assignEmblems(units, ['K/DA', 'Hyperpop', 'Arcanist', 'Swiftstriker'])),
            ['Ziggs', 'Taric', 'Taric', 'Taric'],
        );
    });
});
