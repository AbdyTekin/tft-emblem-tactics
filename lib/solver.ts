import { Champion } from '@/types/tft';
import { TRAIT_RULES, TraitRule } from '@/lib/trait-rules';

export interface TeamComp {
    champions: Champion[];
    score: number;
    activeSynergies: string[];
}

export type SolverStrategy = 'Standard' | 'RegionRyze' | 'BronzeLife';

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

            // Base Score: +1 per active synergy level (level 1 = 1pt, level 2 = 2pts, etc)
            // Or use the user requirements: +1 per active synergy?
            // "Base Score: +1 per active synergy (use TRAIT_RULES[t].breakpoints)"
            // Let's interpret "per active synergy" as a flat bonus or scaled by level.
            // Giving points based on the breakpoint index is standard.
            let traitScore = 1 * (activeBreakpointIndex + 1);

            // Emblem Bonus: "If activeEmblems[t] > 0, give HUGE score if that trait hits a higher breakpoint"
            if ((activeEmblems[trait] || 0) > 0) {
                // Check if the emblem actually HELPED reach a new breakpoint
                // count without emblem = count - activeEmblems[trait]
                // But the prompt implies: "Give HUGE score if that trait hits a higher breakpoint"
                // effectively rewarding using the emblem.
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
    strategy: SolverStrategy = 'Standard'
): TeamComp[] {
    const emblemTraits = Object.keys(activeEmblems);

    // 1. FILTER POOL
    // "Pick high-cost units + units that match activeEmblems first to reduce search space"
    // Target pool size: ~15-20 to keep combinations manageable.
    // Combinations(20, 8) = 125,970 -> Manageable.
    // Combinations(25, 9) = 2,042,975 -> A bit slow but okay if scoring is fast.

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

    // 2. GENERATE COMBINATIONS
    // We used a custom recursive function, but for 18C8 it is 43k iterations. Fast.

    const combinations: Champion[][] = [];

    // Iterative combination generator or recursive? Recursive is fine for < 100k
    // Actually, let's allow a slightly larger pool if level is small, but 18 is safe.
    getCombinations(pool, level, 0, [], combinations);

    // 3. SCORE TEAMS
    const scoredTeams = combinations.map(team => {
        const { score, synergies } = calculateScore(team, activeEmblems, strategy);
        return { champions: team, score, activeSynergies: synergies };
    });

    // 4. SORT AND RETURN TOP 5
    scoredTeams.sort((a, b) => b.score - a.score);

    // Deduplicate? They are unique combinations by definition of our generator.
    // But we might want unique SYNERGIES? Prompt says "Top 5 unique teams", which usually means unique champions.

    return scoredTeams.slice(0, 5);
}
