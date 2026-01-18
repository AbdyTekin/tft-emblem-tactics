import { Champion } from '@/types/tft';
import { TRAIT_RULES, TraitRule } from '@/lib/trait-rules';

export interface TeamComp {
    champions: Champion[];
    score: number;
    activeSynergies: string[];
}

export type SolverStrategy = 'RegionRyze' | 'BronzeLife';

/**
 * Calculates the score of a team based on active traits and strategy.
 */
function calculateScore(
    champions: Champion[],
    activeEmblems: Record<string, number>,
    strategy: SolverStrategy
): { score: number; synergies: string[] } {
    const traitCounts: Record<string, number> = { ...activeEmblems };

    // Count traits from champions
    for (const champ of champions) {
        for (const trait of champ.traits) {
            traitCounts[trait] = (traitCounts[trait] || 0) + 1;
        }
    }

    let score = 0;
    const activeSynergies: string[] = [];
    let bronzeLifeCount = 0;

    for (const [trait, count] of Object.entries(traitCounts)) {
        if (count === 0) continue;

        const rule = TRAIT_RULES[trait];
        if (!rule) continue;

        // Find the highest active breakpoint
        let activeBreakpointIndex = -1;
        for (let i = 0; i < rule.breakpoints.length; i++) {
            if (count >= rule.breakpoints[i]) {
                activeBreakpointIndex = i;
            } else {
                break;
            }
        }

        if (activeBreakpointIndex !== -1) {
            const level = activeBreakpointIndex + 1;
            activeSynergies.push(`${trait} (${count})`);

            let traitScore = 1 * (activeBreakpointIndex + 1);

            if ((activeEmblems[trait] || 0) > 0) {
                traitScore += 50 * (activeBreakpointIndex + 1);
            }

            // Strategy: RegionRyze
            if (strategy === 'RegionRyze' && rule.type === 'Region') {
                traitScore *= 2;
            }

            // Strategy: BronzeLife (Count lowest breakpoint)
            if (activeBreakpointIndex === 0) {
                bronzeLifeCount++;
            }

            score += traitScore;
        }
    }

    if (strategy === 'BronzeLife') {
        // "Maximize this count." -> Add heavy weight to the count
        score += bronzeLifeCount * 100;
    }

    return { score, synergies: activeSynergies.sort() };
}

/**
 * Recursive function to generate combinations.
 */
function getCombinations(
    pool: Champion[],
    k: number,
    start: number = 0,
    current: Champion[] = [],
    results: Champion[][] = []
): Champion[][] {
    if (current.length === k) {
        results.push([...current]);
        return results;
    }

    for (let i = start; i < pool.length; i++) {
        // Optimization: Stop if we don't have enough elements left to fill k
        if (pool.length - i < k - current.length) break;

        current.push(pool[i]);
        getCombinations(pool, k, i + 1, current, results);
        current.pop();
    }
    return results;
}

/**
 * Solves for the best team compositions.
 */
export function solveTeamComp(
    activeChampions: Champion[],
    activeEmblems: Record<string, number>,
    level: number,
    strategy: SolverStrategy = 'RegionRyze'
): TeamComp[] {
    const emblemTraits = Object.keys(activeEmblems);

    // 1. FILTER POOL

    // Score champions for POOL INCLUSION only
    const poolCandidates = activeChampions.map(champ => {
        let poolScore = 0;
        // High cost
        poolScore += champ.cost * 2;

        // Matches active emblem
        champ.traits.forEach(t => {
            if (activeEmblems[t]) {
                poolScore += 10;
            }
        });

        return { champ, poolScore };
    });

    // Sort and take top N
    poolCandidates.sort((a, b) => b.poolScore - a.poolScore);
    const POOL_SIZE = 18; // Keep it tight for performance in browser
    const pool = poolCandidates.slice(0, POOL_SIZE).map(c => c.champ);

    if (pool.length < level) {
        return []; // Not enough champs
    }

    const combinations: Champion[][] = [];

    getCombinations(pool, level, 0, [], combinations);

    // 3. SCORE TEAMS
    const scoredTeams = combinations.map(team => {
        const { score, synergies } = calculateScore(team, activeEmblems, strategy);
        return { champions: team, score, activeSynergies: synergies };
    });

    // 4. SORT AND RETURN TOP 5
    scoredTeams.sort((a, b) => b.score - a.score);

    return scoredTeams.slice(0, 5);
}
