import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTeamCode } from '@/lib/game/team-code';
import { REGULAR_RIFTBEASTS, team } from './helpers';

describe('team planner code (R11)', () => {
    it('encodes ten 3-digit hex slots between the version prefix and the set id', () => {
        const code = generateTeamCode(team('Ahri', 'Sett'));
        assert.match(code, /^02([0-9a-f]{3}){10}TFTSet18$/);
        assert.ok(code.endsWith('000'.repeat(8) + 'TFTSet18'), 'unused slots are zero-padded');
    });

    it('uses the live planner codes (Ivern 1028, every Lux 1029)', () => {
        assert.equal(generateTeamCode(team('Ivern')).slice(2, 5), (1028).toString(16));
        for (const lux of ['Lux (Fae)', 'Lux (Blossom)', 'Lux (Solar)']) {
            assert.equal(generateTeamCode(team(lux)).slice(2, 5), (1029).toString(16), lux);
        }
    });

    it('keeps the first 10 units of bigger boards', () => {
        const board = team('Elder Dragon', ...REGULAR_RIFTBEASTS, 'Ahri');
        const code = generateTeamCode(board);
        assert.equal(code.length, 2 + 30 + 'TFTSet18'.length);
        assert.equal(code, generateTeamCode(board.slice(0, 10)));
    });
});
