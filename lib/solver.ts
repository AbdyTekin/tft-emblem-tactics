import { Champion } from '@/types/tft';
import { TRAIT_RULES, TraitRule } from '@/lib/trait-rules';

export interface TeamComp {
    champions: Champion[];
    difficulty: number;
    activeSynergies: string[];
    strategyValue: number;
    strategyName: string;
}

export type SolverStrategy = 'RegionRyze' | 'BronzeLife';

/**
 * Calculates the difficulty (formerly score) of a team based on active traits and strategy.
 * Returns a 'difficulty' metric and the specific strategy value.
 */
function calculateDifficulty(
    champions: Champion[],
    activeEmblems: Record<string, number>,
    strategy: SolverStrategy
): { difficulty: number; synergies: string[], strategyValue: number, strategyName: string } {
    const traitCounts: Record<string, number> = { ...activeEmblems };

    let totalCost = 0;

    for (const champ of champions) {
        for (const trait of champ.traits) {
            traitCounts[trait] = (traitCounts[trait] || 0) + 1;
        }
        totalCost += champ.cost;
    }

    const activeSynergies: string[] = [];
    let bronzeLifeCount = 0;
    let regionTraitCount = 0;

    // Base difficulty can be derived from team cost + active synergies complexity
    let difficulty = totalCost;

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
            activeSynergies.push(`${trait} (${count})`);

            // General difficulty bump for active traits
            difficulty += (activeBreakpointIndex + 1) * 5;

            // Strategy: Region Ryze (Count active Regions)
            if (rule.type === 'Region') {
                regionTraitCount++;
            }

            // Strategy: Bronze for Life
            // We need to open bronze breakpoint of traits.
            // Bronze traits are "region" and "class" type traits's first breakpoint.
            // Exception: "Targon" which is always active (gold/unique behavior in this context, or simply excluded).
            // Logic: Is it EXACTLY at the first breakpoint?
            // Actually, usually "Bronze" means "At least Bronze". 
            // The user said: "maximum number of bronze trait is better".
            // And "bronze traits are ... first breakpoint".
            // If I have 4 Bruisers (Silver), do I have the Bronze trait? Yes.
            // But usually "Bronze for Life" implies wide, shallow traits.
            // Let's count if activeBreakpointIndex >= 0.
            // User constraint: "only exception is 'Targon'".
            if (trait !== 'Targon' && (rule.type === 'Region' || rule.type === 'Class')) {
                // If it is active at least at the first level.
                if (activeBreakpointIndex >= 0) {
                    bronzeLifeCount++;
                }
            }
        }
    }

    let strategyValue = 0;
    let strategyName = '';

    if (strategy === 'RegionRyze') {
        strategyValue = regionTraitCount;
        strategyName = 'active_region_traits';
        // Massive boost to difficulty metric for the target strategy to ensure sorting prioritizes it
        difficulty += regionTraitCount * 1000;
    } else if (strategy === 'BronzeLife') {
        strategyValue = bronzeLifeCount;
        strategyName = 'active_bronze_traits';
        difficulty += bronzeLifeCount * 1000;
    }

    return { difficulty, synergies: activeSynergies.sort(), strategyValue, strategyName };
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
    if (results.length > 50000) return results; // Hard cap to prevent freezing

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

    // 1. FILTER POOL - Smart Selection
    const poolCandidates = activeChampions.map(champ => {
        let poolScore = 0;

        // Base value for high cost units (generally stronger)
        poolScore += champ.cost * 1.5;

        // Smart Weighting based on Strategy
        if (strategy === 'RegionRyze') {
            // Prioritize units with Region traits
            const hasRegion = champ.traits.some(t => TRAIT_RULES[t]?.type === 'Region');
            if (hasRegion) poolScore += 20;

            // Super prioritize units that activate regions we already have emblems for
            const matchesEmblemRegion = champ.traits.some(t =>
                activeEmblems[t] && TRAIT_RULES[t]?.type === 'Region'
            );
            if (matchesEmblemRegion) poolScore += 30;

        } else if (strategy === 'BronzeLife') {
            // Prioritize units with MANY traits (e.g. 3 traits) to activate more bronzes
            poolScore += champ.traits.length * 10;

            // Prioritize units that help activate emblems
            const matchesEmblem = champ.traits.some(t => activeEmblems[t]);
            if (matchesEmblem) poolScore += 20;
        }

        // Generic Emblem Synergy (always good)
        champ.traits.forEach(t => {
            if (activeEmblems[t]) {
                poolScore += 10;
            }
        });

        return { champ, poolScore };
    });

    // Sort by pool score and take top N
    poolCandidates.sort((a, b) => b.poolScore - a.poolScore);

    // Slight increase in pool size for better results, effectively "smarter" search
    // due to the weighted sorting above ensuring the *best* 22 are checked.
    const POOL_SIZE = 20;
    const pool = poolCandidates.slice(0, POOL_SIZE).map(c => c.champ);

    if (pool.length < level) {
        return []; // Not enough champs
    }

    const combinations: Champion[][] = [];

    // Use a slightly customized recursive step or just standard combination
    // Standard combination on 20 choose 9 is still 167k, which is heavy for JS main thread.
    // We need to limit complexity.
    // Let's try to limit the recursion results or reduce pool for higher levels.

    // Dynamic Pool Sizing based on Level to keep iterations executing < 200ms
    // C(n, k) calculations:
    // 20 C 9 = 167,960 (Too high)
    // 18 C 9 = 48,620 (Acceptable)
    // 18 C 10 = 43,000 (Acceptable)
    // So for levels > 8, we restrict pool to 18.
    // For levels <= 8, we can afford 22 (22 C 8 = 319k - maybe too high).

    // Safe heuristic:
    const safePoolSize = level >= 8 ? 18 : 20;
    const searchPool = pool.slice(0, safePoolSize);

    getCombinations(searchPool, level, 0, [], combinations);

    // 3. SCORE TEAMS
    const scoredTeams = combinations.map(team => {
        const { difficulty, synergies, strategyValue, strategyName } = calculateDifficulty(team, activeEmblems, strategy);
        return { champions: team, difficulty, activeSynergies: synergies, strategyValue, strategyName };
    });

    // 4. SORT AND RETURN TOP 20
    // Sort primarily by Strategy Value, secondarily by Difficulty (general strength)
    scoredTeams.sort((a, b) => {
        if (b.difficulty !== a.difficulty) {
            return b.difficulty - a.difficulty;
            // Since we added strategyValue * 1000 to difficulty, this sorts by strategy first.
        }
        return 0;
    });

    return scoredTeams.slice(0, 20);
}
