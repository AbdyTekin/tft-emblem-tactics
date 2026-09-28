import { TFT_SET_ID } from '@/lib/game/data';
import { PLANNER_MAX_UNITS } from '@/lib/game/rules';
import type { Champion } from '@/lib/game/types';

/**
 * Team planner import code: "02", then ten 3-digit hex `team_planner_code`s ("000" = empty slot),
 * then the set id. Codes come from CommunityDragon's tftchampions-teamplanner.json (see update-data).
 * The planner holds 10 units, so bigger boards (Riftbeast 10) keep their first 10.
 */
export function generateTeamCode(team: readonly Pick<Champion, 'plannerCode'>[]): string {
    const slots = team.slice(0, PLANNER_MAX_UNITS).map(c => c.plannerCode.toString(16).padStart(3, '0'));
    while (slots.length < PLANNER_MAX_UNITS) slots.push('000');
    return `02${slots.join('')}${TFT_SET_ID}`;
}
