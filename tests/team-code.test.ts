import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sonaVariants } from '@/lib/game/rules';
import { generateTeamCode } from '@/lib/game/team-code';
import { champ, team } from './helpers';

describe('team planner code', () => {
    it('encodes ten 3-digit hex slots between the version prefix and TFTSet19', () => {
        const code = generateTeamCode(team('Ahri', 'Sett'));
        assert.match(code, /^02([0-9a-f]{3}){10}TFTSet19$/);
        assert.ok(code.endsWith('000'.repeat(8) + 'TFTSet19'), 'unused slots are zero-padded');
    });

    it('uses Set 19 planner codes and shares Sona code across Producer variants', () => {
        assert.equal(generateTeamCode(team('Ahri')).slice(2, 5), (1001).toString(16));
        const sona = champ('Sona');
        for (const variant of [sona, ...sonaVariants(sona)]) {
            assert.equal(generateTeamCode([variant]).slice(2, 5), sona.plannerCode.toString(16), variant.name);
        }
    });

    it('keeps the first 10 units of bigger boards', () => {
        const board = team('Ahri', 'Sett', 'Taric', 'Zoe', 'Gnar', 'Kayn', 'Kennen', 'Lillia', 'Neeko', 'Olaf', 'Varus');
        const code = generateTeamCode(board);
        assert.equal(code.length, 2 + 30 + 'TFTSet19'.length);
        assert.equal(code, generateTeamCode(board.slice(0, 10)));
    });
});
