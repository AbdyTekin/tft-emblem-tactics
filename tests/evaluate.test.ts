import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTeam, type TeamEvaluation } from '@/lib/game/evaluate';
import { team } from './helpers';

const traitOf = (evaluation: TeamEvaluation, trait: string) => evaluation.traits.find(t => t.trait === trait);

describe('evaluateTeam', () => {
    it("doesn't count an emblem nobody can hold", () => {
        const board = team('Gnar', 'Karthus', 'Kayle', 'Mordekaiser', 'Olaf', 'Viego', 'Yorick');
        const result = evaluateTeam(board, { level: 7, emblems: ['Pentakill'] });
        assert.equal(traitOf(result, 'Pentakill')?.count, 7);
        assert.equal(result.emblemHolders[0].holder, null);
    });

    it('caps stacked emblems by eligible holders', () => {
        const board = team('Gnar', 'Karthus', 'Kayle', 'Mordekaiser', 'Olaf', 'Viego', 'Yorick', 'Sett');
        const pk = traitOf(evaluateTeam(board, { level: 8, emblems: ['Pentakill', 'Pentakill', 'Pentakill'] }), 'Pentakill');
        assert.equal(pk?.count, 8);
        assert.equal(pk?.emblems, 1);
        assert.equal(pk?.style, 'gold');
    });

    it('counts K/DA as 2 star levels per unit and per held emblem', () => {
        const board = team('Ahri', 'Lillia', 'Sett');
        const result = evaluateTeam(board, { level: 3, emblems: ['K/DA'] });
        const kda = traitOf(result, 'K/DA');
        assert.equal(kda?.count, 6);
        assert.equal(kda?.emblems, 1);
        assert.equal(kda?.style, 'silver');
        assert.equal(result.emblemHolders[0].holder?.name, 'Sett');
    });

    it('sorts active traits by tier, then count', () => {
        const board = team('Gnar', 'Karthus', 'Kayle', 'Olaf', 'Viego', 'Yorick', 'Annie', 'Zoe');
        const result = evaluateTeam(board, { level: 8, emblems: ['Pentakill', 'Arcanist'] });
        const active = result.traits.filter(t => t.style).map(t => `${t.trait} ${t.count} ${t.style}`);
        assert.equal(active[0], 'Pentakill 7 gold');
        assert.ok(active.includes('Arcanist 4 silver'));
        assert.equal(result.traits.at(-1)?.style, null, 'inactive traits last');
    });

    it('checks board validity: Baron Nashor two slots and one unit per unitId', () => {
        assert.equal(evaluateTeam(team('Akali (K/DA)', 'Akali (True Damage)'), { level: 8 }).valid, false);
        assert.equal(evaluateTeam(team('Ahri', 'Sett', 'Taric'), { level: 2 }).valid, false);
        assert.equal(evaluateTeam(team('Baron Nashor', 'Ahri'), { level: 3 }).valid, true);
        assert.equal(evaluateTeam(team('Baron Nashor', 'Ahri'), { level: 2 }).valid, false);
    });
});
