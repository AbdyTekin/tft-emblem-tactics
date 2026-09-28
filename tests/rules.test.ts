import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTraitSuppressed, khazixVariants, teamSizeFor, traitContribution, unitSlots } from '@/lib/game/rules';
import { REGULAR_RIFTBEASTS, champ, team } from './helpers';

describe('unit rules', () => {
    it('Elder Dragon takes two slots and adds two Riftbeast (R6)', () => {
        const dragon = champ('Elder Dragon');
        assert.equal(unitSlots(dragon), 2);
        assert.equal(traitContribution(dragon, 'Riftbeast'), 2);
        assert.equal(traitContribution(dragon, 'Apex Predator'), 1);
        assert.equal(unitSlots(champ('Ahri')), 1);
    });

    it('Lux counts her regional trait twice and Avatar once (R5)', () => {
        const lux = champ('Lux (Blossom)');
        assert.equal(traitContribution(lux, 'Blossom'), 2);
        assert.equal(traitContribution(lux, 'Avatar'), 1);
        assert.equal(traitContribution(lux, 'Coven'), 0);
    });

    it('Rival is off with two Rivals unless the Rivals augment is taken (R9)', () => {
        assert.equal(isTraitSuppressed('Rival', 1), false);
        assert.equal(isTraitSuppressed('Rival', 2), true);
        assert.equal(isTraitSuppressed('Rival', 2, { rivalsAugment: true }), false);
        assert.equal(isTraitSuppressed('Coven', 7), false);
    });

    it('evolved Kha\'Zix gains one extra trait and stays the same unit (R10)', () => {
        const khazix = champ("Kha'Zix");
        const variants = khazixVariants(khazix);
        assert.deepEqual(variants.map(v => v.traits), [
            ['Rival', 'Executioner'], ['Rival', 'Rapidfire'], ['Rival', 'Ravager'], ['Rival', 'Spellweaver'],
        ]);
        for (const v of variants) {
            assert.equal(v.unitId, khazix.unitId);
            assert.equal(v.plannerCode, khazix.plannerCode);
        }
    });
});

describe('team size (R7, R8)', () => {
    const dragonPlus = (regulars: number, ...extra: string[]) =>
        team('Elder Dragon', ...REGULAR_RIFTBEASTS.slice(0, regulars), ...extra);

    it('is the level when no bonus applies', () => {
        assert.equal(teamSizeFor(team('Ahri', 'Sett'), { level: 8 }), 8);
        assert.equal(teamSizeFor(dragonPlus(7), { level: 10 }), 10, '9 Riftbeast: no bonus');
    });

    it('adds item and augment bonuses to the level', () => {
        assert.equal(teamSizeFor(team('Ahri'), { level: 8, bonusTeamSize: 1 }), 9);
    });

    it('grows by two once Riftbeast 10 fits on the board before the bonus', () => {
        assert.equal(teamSizeFor(dragonPlus(8), { level: 10 }), 12);
        assert.equal(teamSizeFor(dragonPlus(9, 'Ahri'), { level: 10 }), 12, 'Riftbeast 11 + one more unit');
        assert.equal(teamSizeFor(dragonPlus(8), { level: 9, bonusTeamSize: 1 }), 12, "level 9 + Tactician's item");
    });

    it("doesn't let Elder Dragon use the slots it unlocks", () => {
        // Level 9: Elder Dragon + 8 regulars needs 10 slots before the bonus applies.
        assert.equal(teamSizeFor(dragonPlus(8), { level: 9 }), 9);
    });
});
