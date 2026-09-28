import { CHAMPIONS } from '@/lib/game/data';
import { evaluateTeam } from '@/lib/game/evaluate';
import { KHAZIX, baseTeamSize, khazixVariants } from '@/lib/game/rules';
import type { Champion } from '@/lib/game/types';
import { Search } from '@/lib/solver/search';
import { compareScores, teamMetrics, teamScore } from '@/lib/solver/score';
import type { SolveRequest, SolveResult, TeamResult } from '@/lib/solver/types';

export type { SolveRequest, SolveResult, Strategy, TeamMetrics, TeamResult } from '@/lib/solver/types';

const DEFAULT_LIMIT = 20;
/** Partial boards kept per step. Tuned against exhaustive search (tests/solver-quality.test.ts). */
const BEAM_WIDTH = 250;
/** Best finished boards that get a 1-swap polish. */
const POLISH_COUNT = 12;
/** Finished boards re-scored with the exact emblem assignment before picking the results. */
const EXACT_CANDIDATES = 300;
/** Two results must differ by at least this many units, while enough such teams exist. */
const MIN_DIFFERENCE = 2;

/** Every unit the solver may use; evolved Kha'Zix variants are added on request. */
export function candidatePool(options: { evolvedKhazix?: boolean }, pool: readonly Champion[] = CHAMPIONS): Champion[] {
    const khazix = options.evolvedKhazix ? pool.find(c => c.apiName === KHAZIX) : undefined;
    return khazix ? [...pool, ...khazixVariants(khazix)] : [...pool];
}

export function solveTeams(request: SolveRequest): SolveResult {
    const pool = candidatePool(request, request.pool ?? CHAMPIONS);
    const byApiName = new Map(pool.map(c => [c.apiName, c]));
    const locked = (request.locked ?? []).map(a => byApiName.get(a)).filter((c): c is Champion => c !== undefined);
    const lockedUnits = new Set(locked.map(c => c.unitId));
    if (lockedUnits.size !== locked.length) return { status: 'invalid-lock', reason: 'duplicate-unit' };

    const search = new Search({
        pool: pool.filter(c => !lockedUnits.has(c.unitId)),
        locked,
        emblems: request.emblems,
        strategy: request.strategy,
        baseSlots: baseTeamSize(request),
        rivalsAugment: request.rivalsAugment ?? false,
        beamWidth: BEAM_WIDTH,
        polishCount: POLISH_COUNT,
    });
    if (!search.isValid(search.build(locked.map((_, i) => i)))) return { status: 'invalid-lock', reason: 'too-many-slots' };

    const options = {
        level: request.level,
        bonusTeamSize: request.bonusTeamSize,
        emblems: request.emblems,
        rivalsAugment: request.rivalsAugment,
    };
    const results: TeamResult[] = search.run().slice(0, EXACT_CANDIDATES).map(({ state }) => {
        const champions = displayOrder(state.members.map(i => search.units[i].champion), locked);
        const evaluation = evaluateTeam(champions, options);
        const metrics = teamMetrics(evaluation, champions, request.emblems);
        return { champions, evaluation, metrics, score: teamScore(request.strategy, metrics, evaluation, request.emblems) };
    });
    // Stable: ties keep the search's order
    results.sort((a, b) => compareScores(a.score, b.score));

    return { status: 'ok', teams: pickDiverse(results, request.limit ?? DEFAULT_LIMIT) };
}

/** Locked units first (in lock order), then the highest cost first. */
function displayOrder(team: Champion[], locked: readonly Champion[]): Champion[] {
    const lockedIds = new Set(locked.map(c => c.apiName));
    const rest = team.filter(c => !lockedIds.has(c.apiName)).sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
    return [...locked, ...rest];
}

/**
 * Best teams first, skipping near-copies of teams already picked. When there aren't enough distinct
 * alternatives, the closest variants fill the list after them.
 */
function pickDiverse(ranked: TeamResult[], limit: number): TeamResult[] {
    const picked: TeamResult[] = [];
    const pickedSets: Set<string>[] = [];
    const difference = (a: Set<string>, b: Set<string>) =>
        Math.max([...a].filter(x => !b.has(x)).length, [...b].filter(x => !a.has(x)).length);

    for (const team of ranked) {
        if (picked.length === limit) break;
        const ids = new Set(team.champions.map(c => c.apiName));
        if (pickedSets.every(other => difference(other, ids) >= MIN_DIFFERENCE)) {
            picked.push(team);
            pickedSets.push(ids);
        }
    }
    for (const team of ranked) {
        if (picked.length === limit) break;
        if (!picked.includes(team)) picked.push(team);
    }
    return picked;
}
