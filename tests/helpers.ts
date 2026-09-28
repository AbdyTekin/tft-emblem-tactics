import assert from 'node:assert/strict';
import { CHAMPIONS } from '@/lib/game/data';
import type { Champion } from '@/lib/game/types';

/** Looks up a Set 18 champion by English name, failing the test when it's missing. */
export function champ(name: string): Champion {
    const found = CHAMPIONS.find(c => c.name === name);
    assert.ok(found, `unknown champion ${name}`);
    return found;
}

export const team = (...names: string[]): Champion[] => names.map(champ);

/** The nine regular Riftbeasts (Elder Dragon excluded). */
export const REGULAR_RIFTBEASTS = ['Cinderling', 'Pebbles', 'Gromp', 'Murkwolf', 'Scuttlecrab', 'Krug', 'Mama Beak', 'Brambleback', 'Sentinel'];
