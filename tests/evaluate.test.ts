import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTeam, type TeamEvaluation } from '@/lib/game/evaluate';
import { REGULAR_RIFTBEASTS, team } from './helpers';

const traitOf = (evaluation: TeamEvaluation, trait: string) => evaluation.traits.find(t => t.trait === trait);

describe('evaluateTeam', () => {
    it("doesn't count an emblem nobody can hold (the old solver showed Blossom 10)", () => {
        const board = team('Ashe', 'Lux (Blossom)', 'Ahri', 'Sett', 'Master Yi', 'Yunara', 'Karma', 'Yorick');
        const result = evaluateTeam(board, { level: 8, emblems: ['Blossom'] });
        assert.equal(traitOf(result, 'Blossom')?.count, 9);
        assert.equal(result.emblemHolders[0].holder, null);
    });

    it('caps stacked emblems by eligible holders (the old solver showed Blossom 11 prismatic)', () => {
        const board = team('Ashe', 'Lux (Blossom)', 'Ahri', 'Sett', 'Master Yi', 'Yunara', 'Karma', 'Soraka');
        const blossom = traitOf(evaluateTeam(board, { level: 8, emblems: ['Blossom', 'Blossom', 'Blossom'] }), 'Blossom');
        assert.equal(blossom?.count, 9);
        assert.equal(blossom?.emblems, 1);
        assert.equal(blossom?.style, 'gold');
    });

    it('turns Rival off with both Rivals unless the augment is taken', () => {
        const board = team("Kha'Zix", 'Rengar');
        const without = traitOf(evaluateTeam(board, { level: 2 }), 'Rival');
        assert.equal(without?.suppressed, true);
        assert.equal(without?.style, null);
        assert.equal(traitOf(evaluateTeam(board, { level: 2, rivalsAugment: true }), 'Rival')?.style, 'gold');
        assert.equal(traitOf(evaluateTeam(team('Rengar'), { level: 1 }), 'Rival')?.style, 'bronze');
    });

    it('sorts active traits by tier, then count', () => {
        const board = team('Lux (Coven)', 'Morgana', 'Cassiopeia', 'Caitlyn', 'Elise', 'Ashe', 'Sivir', 'Tristana');
        const result = evaluateTeam(board, { level: 8, emblems: ['Coven', 'Hunter'] });
        const active = result.traits.filter(t => t.style).map(t => `${t.trait} ${t.count} ${t.style}`);
        assert.deepEqual(active.slice(0, 2), ['Coven 7 gold', 'Hunter 5 gold']);
        assert.equal(result.traits.at(-1)?.style, null, 'inactive traits last');
    });

    it('checks board validity: slots and one unit per unit id', () => {
        assert.equal(evaluateTeam(team('Lux (Fae)', 'Lux (Coven)'), { level: 8 }).valid, false);
        assert.equal(evaluateTeam(team('Ahri', 'Sett', 'Karma'), { level: 2 }).valid, false);
        const riftbeast10 = team('Elder Dragon', ...REGULAR_RIFTBEASTS, 'Ahri');
        assert.equal(evaluateTeam(riftbeast10, { level: 10 }).valid, true, '12 slots at level 10 with Riftbeast 11');
        assert.equal(evaluateTeam(riftbeast10, { level: 9 }).valid, false);
    });
});
