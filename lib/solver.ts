import { Champion } from '@/types/tft';
import { TRAIT_RULES } from '@/lib/trait-rules';

/**
 * Interface representing a generated team composition.
 * Includes the list of champions, a difficulty score, active synergies, and strategy-specific metrics.
 */
export interface TeamComp {
    champions: Champion[];
    difficulty: number;
    activeSynergies: string[];
    strategyValue: number;
    strategyName: string;
}

/**
 * Available solver strategies:
 * - 'RegionRyze': Prioritizes activating as many Region traits as possible.
 * - 'BronzeLife': Prioritizes activating as many "Bronze" (first tier) traits as possible.
 */
export type SolverStrategy = 'RegionRyze' | 'BronzeLife';

/**
 * Calculates the difficulty (score) of a specific team composition based on active traits and the selected strategy.
 * 
 * Logic Overview:
 * 1. Counts all traits provided by the champions + active emblems.
 * 2. Iterates through trait counts to determine active synergies (breakpoints).
 * 3. Base 'difficulty' is the total cost of champions.
 * 4. Adds points to 'difficulty' for every active synergy level.
 * 5. Applies Strategy-specific boosts:
 *    - RegionRyze: Counts active Region traits. Adds massive score boost per Region.
 *    - BronzeLife: Counts active Bronze-tier traits (excluding Targon). Adds massive score boost per Bronze trait.
 * 
 * @param champions The list of champions in the team
 * @param activeEmblems Map of active emblems (Trait Name -> Count)
 * @param strategy The current solving strategy
 * @returns Object containing the total difficulty, list of active synergies, and strategy metrics.
 */
function calculateDifficulty(
    champions: Champion[],
    activeEmblems: Record<string, number>,
    strategy: SolverStrategy
): { difficulty: number; synergies: string[], strategyValue: number, strategyName: string } {
    const traitCounts: Record<string, number> = { ...activeEmblems };

    let totalCost = 0;

    // Sum up trait counts and total team cost
    for (const champ of champions) {
        for (const trait of champ.traits) {
            traitCounts[trait] = (traitCounts[trait] || 0) + 1;
        }
        totalCost += champ.cost;
    }

    const activeSynergies: string[] = [];
    let bronzeLifeCount = 0;
    let regionTraitCount = 0;

    // Base difficulty derived from total team cost (higher cost = generally better/harder to hit)
    let difficulty = totalCost;

    for (const [trait, count] of Object.entries(traitCounts)) {
        if (count === 0) continue;

        const rule = TRAIT_RULES[trait];
        if (!rule) continue;

        // Determine if the trait is active and at which breakpoint
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

            // General difficulty bump for any active trait (avoids empty trait synergies)
            difficulty += (activeBreakpointIndex + 1) * 5;

            // --- STRATEGY SPECIFIC LOGIC ---

            // Strategy: Region Ryze 
            // Goal: Maximize the number of distinct Region-type traits active.
            if (rule.type === 'Region') {
                regionTraitCount++;
            }

            // Strategy: Bronze for Life
            // Goal: Maximize the number of traits that are exactly/at least at their first ("Bronze") breakpoint.
            // "Bronze" usually refers to the lowest tier of a trait (often 1 or 2 units).
            // Logic: Filter for Region or Class traits (Origins often unique).
            // Targon is excluded per specific user rule (often effectively a unique/gold trait).
            if (trait !== 'Targon' && (rule.type === 'Region' || rule.type === 'Class')) {
                if (activeBreakpointIndex >= 0) {
                    bronzeLifeCount++;
                }
            }
        }
    }

    let strategyValue = 0;
    let strategyName = '';

    // Apply massive weight to the prioritized metric to ensure it dominates sorting.
    // e.g., A team with 5 Regions (Score 5000+) will always beat a team with 4 Regions (Score 4000+),
    // regardless of the secondary 'difficulty' score.
    if (strategy === 'RegionRyze') {
        strategyValue = regionTraitCount;
        strategyName = 'active_region_traits';
        difficulty += regionTraitCount * 1000;
    } else if (strategy === 'BronzeLife') {
        strategyValue = bronzeLifeCount;
        strategyName = 'active_bronze_traits';
        difficulty += bronzeLifeCount * 1000;
    }

    return { difficulty, synergies: activeSynergies.sort(), strategyValue, strategyName };
}

/**
 * Recursive Depth-First Search to generate combinations of champions.
 * 
 * @param pool The filtered list of candidate champions.
 * @param k The target team size (e.g., Level 8 = 8 champions).
 * @param start Current index in the pool to avoid duplicates/permutations (combinations only).
 * @param current Current array of selected champions.
 * @param results Accumulator for valid full teams.
 * @returns Array of champion arrays.
 */
function getCombinations(
    pool: Champion[],
    k: number,
    start: number = 0,
    current: Champion[] = [],
    results: Champion[][] = []
): Champion[][] {
    // Safety Break: Prevent browser freeze if combinations explode. 
    // 50k is selected as a safe upper bound for main-thread JS execution (~50-100ms).
    if (results.length > 50000) return results;

    if (current.length === k) {
        results.push([...current]);
        return results;
    }

    for (let i = start; i < pool.length; i++) {
        // Optimization: Pruning.
        // If the remaining champs in pool are fewer than what we need to fill 'k', stop.
        if (pool.length - i < k - current.length) break;

        current.push(pool[i]);
        getCombinations(pool, k, i + 1, current, results);
        current.pop();
    }
    return results;
}

/**
 * Main Solver Function.
 * Generates optimal team compositions based on active champions (filtering), emblems, level, and strategy.
 * 
 * Process:
 * 1. Filter & Sort Pool: Selects the top ~20 most relevant champions from the total set (60+).
 *    Relevance is determined by cost and strategy alignment (e.g. has Region trait).
 * 2. Generate Combinations: Creates all valid teams of size 'level' from the reduced pool.
 * 3. Score Teams: Calculates difficulty/score for every generated team.
 * 4. Sort & Return: Returns the top 20 teams.
 * 
 * @param activeChampions The entire list of available champions in the set.
 * @param activeEmblems Map of currently selected emblems.
 * @param level User's player level (determines team size).
 * @param strategy The selected solving strategy.
 */
export function solveTeamComp(
    activeChampions: Champion[],
    activeEmblems: Record<string, number>,
    level: number,
    strategy: SolverStrategy = 'RegionRyze'
): TeamComp[] {
    const emblemTraits = Object.keys(activeEmblems);

    // --- STEP 1: POOL SELECTION ---
    // Instead of checking all C(60, 9) combinations (impossible), we select the "Best 20" champions
    // that are most likely to form a good team for the requested strategy.
    const poolCandidates = activeChampions.map(champ => {
        let poolScore = 0;

        // Heuristic 1: High cost units are generally better
        poolScore += champ.cost * 1.5;

        // Heuristic 2: Strategy Alignment
        if (strategy === 'RegionRyze') {
            // Priority: Units with Region traits
            const hasRegion = champ.traits.some(t => TRAIT_RULES[t]?.type === 'Region');
            if (hasRegion) poolScore += 20;

            // High Priority: Units that activate a Region we have an emblem for
            const matchesEmblemRegion = champ.traits.some(t =>
                activeEmblems[t] && TRAIT_RULES[t]?.type === 'Region'
            );
            if (matchesEmblemRegion) poolScore += 30;

        } else if (strategy === 'BronzeLife') {
            // Priority: Units with MANY traits (flexible activation)
            poolScore += champ.traits.length * 10;

            // Priority: Units matching our emblems
            const matchesEmblem = champ.traits.some(t => activeEmblems[t]);
            if (matchesEmblem) poolScore += 20;
        }

        // Heuristic 3: Generic Synergy
        // Always good to pick units that match our emblems
        champ.traits.forEach(t => {
            if (activeEmblems[t]) {
                poolScore += 10;
            }
        });

        return { champ, poolScore };
    });

    // Sort by heuristic score
    poolCandidates.sort((a, b) => b.poolScore - a.poolScore);

    // Select Top N candidates.
    // This is the most critical performance parameter.
    // 20 candidates = ~160k combs for Choose 9 (High load) or ~180k for Choose 8.
    // To ensure UI responsiveness, we reduce this pool size as Level increases.
    const POOL_SIZE = 20;
    const pool = poolCandidates.slice(0, POOL_SIZE).map(c => c.champ);

    if (pool.length < level) {
        return []; // Not enough champs to form a team
    }

    const combinations: Champion[][] = [];

    // --- STEP 2: DYNAMIC POOL SIZING ---
    // Adjust pool size based on combinations complexity to keep execution under ~200ms.
    // Combinations grow factorially.
    // Level 9 with 20 pool = 167,960 checks (Heavy).
    // Level 9 with 18 pool = 48,620 checks (Fast).
    const safePoolSize = level >= 8 ? 18 : 20;
    const searchPool = pool.slice(0, safePoolSize);

    // Generate all valid teams
    getCombinations(searchPool, level, 0, [], combinations);

    // --- STEP 3: SCORING ---
    const scoredTeams = combinations.map(team => {
        const { difficulty, synergies, strategyValue, strategyName } = calculateDifficulty(team, activeEmblems, strategy);
        return { champions: team, difficulty, activeSynergies: synergies, strategyValue, strategyName };
    });

    // --- STEP 4: FINAL RANKING ---
    // Sort primarily by Strategy Value (e.g., number of Region traits),
    // secondarily by general Difficulty (team value/synergy strength).
    scoredTeams.sort((a, b) => {
        if (b.difficulty !== a.difficulty) {
            return b.difficulty - a.difficulty;
            // Note: Difficulty includes (strategyValue * 1000), so this effectively sorts by strategy first.
        }
        return 0;
    });

    // Return tope 20 results for the UI
    return scoredTeams.slice(0, 20);
}
