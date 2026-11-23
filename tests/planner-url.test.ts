import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, parsePlannerState, serializePlannerState, type PlannerState } from '@/lib/planner-url';
import { champ } from './helpers';

const ids = (state: PlannerState) => ({ ...state, locked: state.locked.map(c => c.id) });

describe('shareable planner links', () => {
    it('round-trips every setting', () => {
        const state: PlannerState = {
            emblems: ['K/DA', 'K/DA', 'Beach Pop'],
            level: 9,
            bonusTeamSize: 1,
            strategy: 'Vertical',
            locked: [champ('Ahri'), champ('Akali (K/DA)')],
            sonaProducer: true,
        };
        assert.deepEqual(ids(parsePlannerState(`?${serializePlannerState(state)}`)), ids(state));
    });

    it('keeps plain links short and reads them as the defaults', () => {
        assert.equal(serializePlannerState(DEFAULT_STATE), '');
        assert.deepEqual(ids(parsePlannerState('')), ids(DEFAULT_STATE));
    });

    it('keeps Sona Producer variant locks only when the option is on', () => {
        const on = parsePlannerState('?p=1&lock=da_sona19-heartsteel');
        assert.deepEqual(on.locked.map(c => c.name), ['Sona (Heartsteel)']);
        assert.deepEqual(parsePlannerState('?lock=da_sona19-heartsteel').locked, []);
    });

    it('drops anything that is not valid game data', () => {
        const state = parsePlannerState(
            '?e=K/DA,EDM,NotATrait,%3Cscript%3E&l=99&b=-1&s=x&p=yes' +
            '&lock=unknown,da_19_ahri,da_19_ahri,da_akalikda19,da_akali_truedamage19',
        );
        assert.deepEqual(state.emblems, ['K/DA'], 'EDM has no emblem');
        assert.equal(state.level, DEFAULT_STATE.level);
        assert.equal(state.bonusTeamSize, DEFAULT_STATE.bonusTeamSize);
        assert.equal(state.strategy, DEFAULT_STATE.strategy);
        assert.equal(state.sonaProducer, false);
        assert.deepEqual(state.locked.map(c => c.name), ['Ahri', 'Akali (K/DA)'], 'no duplicates, one Akali');
    });
});
