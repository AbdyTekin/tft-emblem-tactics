import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    UNLOCK_LEVEL_PENALTY,
    candidatePool,
    emblemContribution,
    sonaVariants,
    teamSizeFor,
    traitContribution,
    unitSlots,
    unlockDifficultyFor,
} from '@/lib/game/rules';
import { champ, team } from './helpers';

describe('Set 19 unit rules', () => {
    it('Baron Nashor takes two slots', () => {
        const baron = champ('Baron Nashor');
        assert.equal(unitSlots(baron), 2);
        assert.equal(traitContribution(baron, 'One Monster Band'), 1);
        assert.equal(unitSlots(champ('Ahri')), 1);
        assert.equal(unitSlots(champ('Rakan')), 1);
    });

    it('K/DA counts 2 per champion and 2 per held emblem (2-star assumption)', () => {
        const ahri = champ('Ahri');
        assert.equal(traitContribution(ahri, 'K/DA'), 2);
        assert.equal(traitContribution(ahri, 'Choreographer'), 1);
        assert.equal(traitContribution(ahri, 'Pentakill'), 0);
        assert.equal(emblemContribution('K/DA'), 2);
        assert.equal(emblemContribution('Pentakill'), 1);
    });

    it('Sona (Producer) gains one of the five band traits while staying the same unit', () => {
        const sona = champ('Sona');
        const variants = sonaVariants(sona);
        assert.deepEqual(variants.map(v => v.traits), [
            ['Producer', 'Collab', 'Heartsteel'],
            ['Producer', 'Collab', 'Ionic Spark'],
            ['Producer', 'Collab', 'K/DA'],
            ['Producer', 'Collab', 'Pentakill'],
            ['Producer', 'Collab', 'True Damage'],
        ]);
        for (const v of variants) {
            assert.equal(v.unitId, sona.unitId);
            assert.equal(v.plannerCode, sona.plannerCode);
            assert.deepEqual(v.unlock, sona.unlock);
        }
        const kdaSona = variants.find(v => v.traits.includes('K/DA'))!;
        assert.equal(traitContribution(kdaSona, 'K/DA'), 2);
        assert.equal(candidatePool({ sonaProducer: false }).some(c => c.apiName.includes(':')), false);
        assert.equal(candidatePool({ sonaProducer: true }).filter(c => c.unitId === sona.unitId).length, 6);
    });

    it('scores unlock hardness and penalizes level-gated unlocks below their required level', () => {
        assert.equal(unlockDifficultyFor(champ('Ahri'), 8), 0);
        assert.equal(unlockDifficultyFor(champ('Ashe'), 6), 1);
        assert.equal(unlockDifficultyFor(champ('Mordekaiser'), 8), 2);
        assert.equal(unlockDifficultyFor(champ('Baron Nashor'), 8), 4);
        // Smeech requires Level 9; Sona requires Level 10
        assert.equal(unlockDifficultyFor(champ('Smeech'), 9), 3);
        assert.equal(unlockDifficultyFor(champ('Smeech'), 8), 3 + UNLOCK_LEVEL_PENALTY);
        assert.equal(unlockDifficultyFor(champ('Sona'), 10), 4);
        assert.equal(unlockDifficultyFor(champ('Sona'), 8), 4 + UNLOCK_LEVEL_PENALTY);
    });
});

describe('team size', () => {
    it('is the level plus any item or augment bonuses', () => {
        assert.equal(teamSizeFor(team('Ahri', 'Sett'), { level: 8 }), 8);
        assert.equal(teamSizeFor(team('Ahri'), { level: 8, bonusTeamSize: 1 }), 9);
        assert.equal(teamSizeFor(team('Ahri'), { level: 10, bonusTeamSize: 2 }), 12);
    });
});
