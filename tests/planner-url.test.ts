import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, parsePlannerState, serializePlannerState, type PlannerState } from '@/lib/planner-url';
import { champ } from './helpers';

const ids = (state: PlannerState) => ({ ...state, locked: state.locked.map(c => c.id) });

describe('shareable planner links', () => {
    it('round-trips every setting', () => {
        const state: PlannerState = {
            emblems: ['Blossom', 'Blossom', 'Flora Fatalis'],
            level: 9,
            bonusTeamSize: 1,
            strategy: 'Vertical',
            locked: [champ('Ahri'), champ('Lux (Fae)')],
            rivalsAugment: true,
            evolvedKhazix: true,
        };
        assert.deepEqual(ids(parsePlannerState(`?${serializePlannerState(state)}`)), ids(state));
    });

    it('keeps plain links short and reads them as the defaults', () => {
        assert.equal(serializePlannerState(DEFAULT_STATE), '');
        assert.deepEqual(ids(parsePlannerState('')), ids(DEFAULT_STATE));
    });

    it('keeps evolved Kha\'Zix locks only when the option is on', () => {
        const on = parsePlannerState('?k=1&lock=da_18_khazix-executioner');
        assert.deepEqual(on.locked.map(c => c.name), ["Kha'Zix (Executioner)"]);
        assert.deepEqual(parsePlannerState('?lock=da_18_khazix-executioner').locked, []);
    });

    it('drops anything that is not valid game data', () => {
        const state = parsePlannerState(
            '?e=Blossom,Riftbeast,NotATrait,%3Cscript%3E&l=99&b=-1&s=x&r=yes' +
            '&lock=unknown,da_18_ahri,da_18_ahri,da_18_lux_fae,da_lux18_blossom',
        );
        assert.deepEqual(state.emblems, ['Blossom'], 'Riftbeast has no emblem');
        assert.equal(state.level, DEFAULT_STATE.level);
        assert.equal(state.bonusTeamSize, DEFAULT_STATE.bonusTeamSize);
        assert.equal(state.strategy, DEFAULT_STATE.strategy);
        assert.equal(state.rivalsAugment, false);
        assert.deepEqual(state.locked.map(c => c.name), ['Ahri', 'Lux (Fae)'], 'no duplicates, one Lux');
    });
});
