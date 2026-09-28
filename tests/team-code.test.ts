import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import championData from '@/lib/set18-champions.json';
import { generateTeamCode } from '@/lib/team-code';
import type { Champion } from '@/types/tft';

const champions = championData as Champion[];

describe('team planner code', () => {
    it('encodes 10 three-digit hex slots between the version prefix and the set id', () => {
        const code = generateTeamCode(champions.slice(0, 8));
        assert.match(code, /^02([0-9a-f]{3}){10}TFTSet18$/);
        assert.ok(code.endsWith('000000TFTSet18'), 'unused slots are zero-padded');
    });
});
