import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignEmblems } from '@/lib/game/emblems';
import { team } from './helpers';

const holderNames = (units: ReturnType<typeof team>, holders: (number | null)[]) =>
    holders.map(h => (h === null ? null : units[h].name));

describe('emblem holders (R4)', () => {
    it('never gives an emblem to a unit that already has the trait', () => {
        const units = team('Ahri', 'Sett', 'Karma');
        assert.deepEqual(assignEmblems(units, ['Blossom']), [null]);
    });

    it('needs a different holder for each copy of the same emblem', () => {
        const units = team('Ahri', 'Sett', 'Soraka');
        assert.deepEqual(holderNames(units, assignEmblems(units, ['Blossom', 'Blossom', 'Blossom'])), ['Soraka', null, null]);
    });

    it('lets one unit hold several different emblems, up to three items', () => {
        const units = team('Leona');
        assert.deepEqual(
            holderNames(units, assignEmblems(units, ['Blossom', 'Coven', 'Fae', 'Hunter'])),
            ['Leona', 'Leona', 'Leona', null],
        );
    });

    it('reroutes earlier emblems to fit later ones', () => {
        // Tristana already has Fae, Sprykin and Hunter, so only Leona can hold those three;
        // Blossom must move to Tristana to make room.
        const units = team('Leona', 'Tristana');
        assert.deepEqual(
            holderNames(units, assignEmblems(units, ['Blossom', 'Fae', 'Sprykin', 'Hunter'])),
            ['Tristana', 'Leona', 'Leona', 'Leona'],
        );
    });
});
