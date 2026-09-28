import setData from '@/lib/data/set18.json';
import type { Champion, SetData, TraitData } from '@/lib/game/types';

const data = setData as SetData;

export const SET_META = data.meta;
export const TFT_SET_ID = data.meta.mutator;

export const TRAITS: readonly TraitData[] = data.traits;
export const CHAMPIONS: readonly Champion[] = data.champions;

const traitsByKey = new Map(TRAITS.map(t => [t.key, t]));
const championsByApiName = new Map(CHAMPIONS.map(c => [c.apiName, c]));

export function getTrait(key: string): TraitData | undefined {
    return traitsByKey.get(key);
}

export function getChampion(apiName: string): Champion | undefined {
    return championsByApiName.get(apiName);
}

/** Traits that have an emblem item this set, alphabetically. */
export const EMBLEM_TRAITS: readonly string[] = TRAITS.filter(t => t.emblem).map(t => t.key).sort();
