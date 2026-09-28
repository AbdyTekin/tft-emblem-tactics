import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHAMPIONS } from '@/lib/game/data';
import { solveTeamComp, type TeamComp } from '@/lib/solver';
import { getChampionSlots, getEffectiveMaxSlots, isLux } from '@/lib/tft-rules';
import type { Champion } from '@/types/tft';

const champions = CHAMPIONS as Champion[];

function champ(name: string): Champion {
    const found = champions.find(c => c.name === name);
    assert.ok(found, `unknown champion ${name}`);
    return found;
}

const slotsUsed = (team: Champion[]) => team.reduce((sum, c) => sum + getChampionSlots(c), 0);

let blossomLevel8: TeamComp[] | undefined;
const solveBlossomLevel8 = () => (blossomLevel8 ??= solveTeamComp(champions, ['Blossom'], 8, 'Vertical', []));

describe('board size', () => {
    it('fills a level 8 board with exactly 8 slots', () => {
        const teams = solveBlossomLevel8();
        assert.ok(teams.length > 0);
        for (const team of teams) assert.equal(slotsUsed(team.champions), 8);
    });

    it('counts Elder Dragon as two slots', () => {
        const [team] = solveTeamComp(champions, [], 8, 'Vertical', [champ('Elder Dragon')]);
        assert.ok(team);
        assert.equal(slotsUsed(team.champions), 8);
        assert.equal(team.champions.length, 7);
    });

    it('adds two team slots at 10 Riftbeast only', () => {
        assert.equal(getEffectiveMaxSlots(10, { Riftbeast: 9 }), 10);
        assert.equal(getEffectiveMaxSlots(10, { Riftbeast: 10 }), 12);
        assert.equal(getEffectiveMaxSlots(10, { Riftbeast: 11 }), 12);
    });
});

describe('Lux', () => {
    it('allows at most one Lux variant per board', () => {
        for (const team of solveBlossomLevel8()) {
            assert.ok(team.champions.filter(isLux).length <= 1);
        }
    });

    it('counts her regional trait twice', () => {
        const [team] = solveTeamComp(champions, [], 2, 'Vertical', [champ('Lux (Elderwood)'), champ('Ornn')]);
        assert.ok(team);
        assert.ok(team.activeSynergies.includes('Elderwood (3)'), team.activeSynergies.join(', '));
    });
});
