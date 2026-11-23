import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GOLD_ICON, championImage, emblemImage, traitIcon } from '@/lib/assets';
import { CHAMPIONS, EMBLEM_TRAITS, SET_META, TRAITS, getTrait } from '@/lib/game/data';
import { champ } from './helpers';

const VALID_COSTS = new Set([1, 2, 3, 4, 5, 7]);

describe('generated Set 19 data', () => {
    it('is Set 19', () => {
        assert.equal(SET_META.set, 19);
        assert.equal(SET_META.mutator, 'TFTSet19');
    });

    it('has every champion once, with defined traits, valid costs and a planner code', () => {
        assert.equal(CHAMPIONS.length, 94);
        assert.equal(new Set(CHAMPIONS.map(c => c.apiName)).size, CHAMPIONS.length);
        for (const c of CHAMPIONS) {
            assert.ok(VALID_COSTS.has(c.cost), `${c.name} cost ${c.cost}`);
            assert.ok(c.plannerCode > 0, `${c.name} planner code`);
            for (const t of c.traits) assert.ok(getTrait(t), `${c.name}: unknown trait ${t}`);
        }
    });

    it('marks all 32 unlockable champions with difficulty and EN/TR conditions', () => {
        const unlockables = CHAMPIONS.filter(c => c.unlock);
        assert.equal(unlockables.length, 32);
        for (const c of unlockables) {
            assert.ok(c.unlock!.difficulty >= 1 && c.unlock!.difficulty <= 4, `${c.name} difficulty`);
            assert.ok(c.unlock!.condition.en.trim().length > 0, `${c.name} EN unlock`);
            assert.ok(c.unlock!.condition.tr.trim().length > 0, `${c.name} TR unlock`);
        }
    });

    it('gives K/DA Akali and True Damage Akali a shared unitId so they cannot share a board', () => {
        const kda = champ('Akali (K/DA)');
        const td = champ('Akali (True Damage)');
        assert.equal(kda.unitId, td.unitId);
        assert.notEqual(kda.apiName, td.apiName);
    });

    it('lists exactly the 22 Set 19 emblems', () => {
        assert.deepEqual([...EMBLEM_TRAITS], [
            'Arcanist', 'Beach Pop', 'Bodyguard', 'Choreographer', 'Classical', 'Frontman', 'Heartsteel',
            'Hitmaker', 'Hyperpop', 'Illbeats', 'Ionic Spark', 'Jazz', 'Juggernaut', 'K/DA', 'Manager',
            'Pentakill', 'Prodigy', 'Renegade', 'Rock', 'Slayer', 'Swiftstriker', 'True Damage',
        ]);
        for (const none of ['Collab', 'EDM', 'Encore', 'Gu Feng', 'R&B', 'Trickshot', 'Producer', 'One Monster Band']) {
            assert.equal(getTrait(none)?.emblem, null, `${none} has no emblem`);
        }
        const elusive = TRAITS.filter(t => t.emblem && !t.emblem.recipe).map(t => t.key).sort();
        assert.deepEqual(elusive, ['Choreographer', 'Hyperpop', 'Jazz', 'Juggernaut', 'Manager', 'True Damage']);
    });

    it('keeps asset paths to plain lowercase png files', () => {
        const paths = [
            ...TRAITS.flatMap(t => [t.icon, t.emblem?.icon]),
            ...CHAMPIONS.flatMap(c => [c.squareIcon, c.tileIcon]),
        ].filter((p): p is string => p !== undefined);
        for (const p of paths) assert.match(p, /^[a-z0-9_./-]+\.png$/);
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
        assert.equal(champ('Nunu & Willump').names.tr, 'Nunu ve Willump');
        assert.equal(getTrait('Beach Pop')?.names.tr, 'Plaj Popu');
    });
});
