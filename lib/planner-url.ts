// The planner's settings live in the URL query, so any setup can be shared as a link.
// Everything read from the URL is validated against the game data; anything unknown is dropped.
import { CHAMPIONS, EMBLEM_TRAITS } from '@/lib/game/data';
import type { Champion } from '@/lib/game/types';
import { candidatePool } from '@/lib/game/rules';
import type { Strategy } from '@/lib/solver/types';

export interface PlannerState {
    /** In pick order: the first emblem is the vertical trait. */
    emblems: string[];
    level: number;
    bonusTeamSize: number;
    strategy: Strategy;
    locked: Champion[];
    rivalsAugment: boolean;
    evolvedKhazix: boolean;
}

export const DEFAULT_STATE: PlannerState = {
    emblems: [],
    level: 8,
    bonusTeamSize: 0,
    strategy: 'BronzeLife',
    locked: [],
    rivalsAugment: false,
    evolvedKhazix: false,
};

export const LEVEL_RANGE = { min: 4, max: 10 } as const;
export const MAX_BONUS_TEAM_SIZE = 3;
/** Generous caps so a hand-edited link can't ask for absurd work. */
const MAX_EMBLEMS = 20;
const MAX_LOCKED = 12;

const STRATEGY_CODES: Record<Strategy, string> = { Vertical: 'v', BronzeLife: 'b' };

function intInRange(value: string | null, min: number, max: number, fallback: number): number {
    if (value === null || !/^\d{1,2}$/.test(value)) return fallback;
    const n = Number(value);
    return n >= min && n <= max ? n : fallback;
}

export function parsePlannerState(search: string): PlannerState {
    const params = new URLSearchParams(search);
    const list = (key: string) => (params.get(key) ?? '').split(',').map(s => s.trim()).filter(Boolean);

    const evolvedKhazix = params.get('k') === '1';
    const pool = new Map(candidatePool({ evolvedKhazix }, CHAMPIONS).map(c => [c.id, c]));
    const locked: Champion[] = [];
    for (const id of list('lock').slice(0, MAX_LOCKED)) {
        const champion = pool.get(id);
        if (champion && !locked.some(c => c.unitId === champion.unitId)) locked.push(champion);
    }

    const strategyCode = params.get('s');
    return {
        emblems: list('e').filter(e => EMBLEM_TRAITS.includes(e)).slice(0, MAX_EMBLEMS),
        level: intInRange(params.get('l'), LEVEL_RANGE.min, LEVEL_RANGE.max, DEFAULT_STATE.level),
        bonusTeamSize: intInRange(params.get('b'), 0, MAX_BONUS_TEAM_SIZE, DEFAULT_STATE.bonusTeamSize),
        strategy: (Object.keys(STRATEGY_CODES) as Strategy[]).find(s => STRATEGY_CODES[s] === strategyCode) ?? DEFAULT_STATE.strategy,
        locked,
        rivalsAugment: params.get('r') === '1',
        evolvedKhazix,
    };
}

/** Query string for a state (without "?"), leaving out defaults so plain links stay short. */
export function serializePlannerState(state: PlannerState): string {
    const params = new URLSearchParams();
    if (state.emblems.length) params.set('e', state.emblems.join(','));
    if (state.level !== DEFAULT_STATE.level) params.set('l', String(state.level));
    if (state.bonusTeamSize !== DEFAULT_STATE.bonusTeamSize) params.set('b', String(state.bonusTeamSize));
    if (state.strategy !== DEFAULT_STATE.strategy) params.set('s', STRATEGY_CODES[state.strategy]);
    if (state.locked.length) params.set('lock', state.locked.map(c => c.id).join(','));
    if (state.rivalsAugment) params.set('r', '1');
    if (state.evolvedKhazix) params.set('k', '1');
    // Commas are fine in a query string and keep shared links readable
    return params.toString().replace(/%2C/gi, ',');
}
