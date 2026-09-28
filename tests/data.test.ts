import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GOLD_ICON, championImage, emblemImage, traitIcon } from '@/lib/assets';
import { CHAMPIONS, EMBLEM_TRAITS, SET_META, TRAITS, getTrait } from '@/lib/game/data';
import { champ } from './helpers';

describe('generated Set 18 data', () => {
    it('is Set 18', () => {
        assert.equal(SET_META.set, 18);
        assert.equal(SET_META.mutator, 'TFTSet18');
    });

    it('has every champion once, with defined traits and a planner code', () => {
        assert.equal(CHAMPIONS.length, 73);
        assert.equal(new Set(CHAMPIONS.map(c => c.apiName)).size, CHAMPIONS.length);
        for (const c of CHAMPIONS) {
            assert.ok(c.cost >= 1 && c.cost <= 5, `${c.name} cost ${c.cost}`);
            assert.ok(c.plannerCode > 0, `${c.name} planner code`);
            for (const t of c.traits) assert.ok(getTrait(t), `${c.name}: unknown trait ${t}`);
        }
    });

    it('leaves out base Lux, which never reaches a board', () => {
        assert.equal(CHAMPIONS.find(c => c.apiName === 'DA_Lux18_Base'), undefined);
        const variants = CHAMPIONS.filter(c => c.traits.includes('Avatar'));
        assert.equal(variants.length, 9);
        assert.equal(new Set(variants.map(c => c.unitId)).size, 1, 'Lux variants share one unit id');
    });

    it('lists exactly the 20 Set 18 emblems (R3)', () => {
        assert.deepEqual([...EMBLEM_TRAITS], [
            'Blackthorn', 'Blossom', 'Brawler', 'Coven', 'Defender', 'Elderwood', 'Executioner', 'Fae', 'Flora Fatalis',
            'Hunter', 'Inferno', 'Invoker', 'Juggernaut', 'Lunar', 'Primal', 'Rapidfire', 'Ravager', 'Spellweaver',
            'Sprykin', 'Vanguard',
        ]);
        for (const none of ['Riftbeast', 'Solar', 'Summoner', 'Adaptor', 'Rival', 'Avatar']) {
            assert.equal(getTrait(none)?.emblem, null, `${none} has no emblem`);
        }
        const noRecipe = TRAITS.filter(t => t.emblem && !t.emblem.recipe).map(t => t.key).sort();
        assert.deepEqual(noRecipe, ['Coven', 'Defender', 'Flora Fatalis', 'Juggernaut']);
    });

    it('reads the Riftbeast team-size bonus from the game data', () => {
        assert.deepEqual(getTrait('Riftbeast')?.teamSize, { min: 10, bonus: 2 });
        assert.equal(TRAITS.filter(t => t.teamSize).length, 1);
    });

    it('keeps asset paths to plain lowercase png files', () => {
        const paths = [
            ...TRAITS.flatMap(t => [t.icon, t.emblem?.icon]),
            ...CHAMPIONS.flatMap(c => [c.squareIcon, c.tileIcon]),
        ].filter((p): p is string => p !== undefined);
        for (const p of paths) assert.match(p, /^assets\/[a-z0-9_./-]+\.png$/);
    });

    it('has a self-hosted image for every champion, trait and emblem (npm run assets:update)', () => {
        const exists = (url: string) => fs.existsSync(path.join(process.cwd(), 'public', url));
        for (const c of CHAMPIONS) assert.ok(exists(championImage(c)), c.name);
        for (const t of TRAITS) {
            assert.ok(exists(traitIcon(t.key)), `${t.key} icon`);
            if (t.emblem) assert.ok(exists(emblemImage(t.key)), `${t.key} emblem`);
        }
        assert.ok(exists(GOLD_ICON));
    });

    it('has Turkish names from the game', () => {
        assert.equal(champ('Mama Beak').names.tr, 'Anne Gaga');
        assert.equal(getTrait('Riftbeast')?.names.tr, 'Vadi Canavarı');
    });
});
