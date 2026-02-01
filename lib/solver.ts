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

// Global safety counter to prevent infinite loops/browser crashes
let RECURSION_COUNT = 0;
const MAX_RECURSION_LIMIT = 50000;

/**
 * Calculates the number of slots a champion takes.
 * - Galio: 0 slots
 * - Baron Nashor: 2 slots
 * - Others: 1 slot
 */
function getUnitSlots(champion: Champion): number {
    if (champion.name === "Galio") return 0;
    if (champion.name === "Baron Nashor") return 2;
    return 1;
}

/**
 * Calculates the total slots used by a list of champions.
 */
function calculateUsedSlots(team: Champion[]): number {
    return team.reduce((acc, champ) => acc + getUnitSlots(champ), 0);
}

/**
 * Helper to calculate current trait counts for a team + emblems.
 * Handles Baron Nashor's special rule (+2 to Void).
 */
function calculateTraitCounts(
    champions: Champion[],
    activeEmblems: Record<string, number>
): Record<string, number> {
    const counts: Record<string, number> = { ...activeEmblems };

    for (const champ of champions) {
        for (const trait of champ.traits) {
            let increment = 1;
            // distinct logic for Baron Nashor on Void trait
            if (trait === 'Void' && champ.name === 'Baron Nashor') {
                increment = 2;
            }
            counts[trait] = (counts[trait] || 0) + increment;
        }
    }
    return counts;
}

/**
 * Determines candidates for the next slot based on the strategy and current team state.
 */
function getCandidates(
    currentTeam: Champion[],
    activeEmblems: Record<string, number>,
    allChampions: Champion[],
    strategy: SolverStrategy
): Champion[] {
    const traitCounts = calculateTraitCounts(currentTeam, activeEmblems);

    // Filter out champions already in the team (assuming unique units, though TFT allows duplicates usually we solve for unique)
    // The prompt implies "pick unit", usually implies unique roster for solver.
    const currentNames = new Set(currentTeam.map(c => c.name));

    // Special Rule: Never pick Galio or Baron Nashor as CANDIDATE.
    // They are only included if already selected/filtered.
    const availablePool = allChampions.filter(c =>
        !currentNames.has(c.name) &&
        c.name !== "Galio" &&
        c.name !== "Baron Nashor"
    );

    if (availablePool.length === 0) return [];

    // --- STRATEGY LOGIC ---

    // 1. Identify "Active but Not Opened" Traits
    // "Active" here means count > 0. "Opened" means count >= next breakpoint?
    // User phrasing: "active we have but not opened for example 1 piltover(first breakpoint at 2)"
    // This implies: Count > 0 AND Count < Min_Breakpoint. OR Count is between breakpoints.
    // Let's interpret "not opened" as: The current count does NOT hit a breakpoint, but IS > 0.
    // OR: The user might mean "we have the trait (count>0), but we haven't hit the NEXT desired breakpoint".
    // Given the example "1 piltover (first breakpoint at 2)", it strongly implies "Count > 0 but currently no bonus active".
    // However, "1 noxus(first breakpoint at 3)" is also given.
    // So logic: Find traits where logic: `count > 0` AND `!isAtBreakpoint(count)`.

    const unbalancedTraits: string[] = [];
    for (const [trait, count] of Object.entries(traitCounts)) {
        if (count <= 0) continue;
        const rule = TRAIT_RULES[trait];
        if (!rule) continue;

        // Exclude Targon from the "Region/Class" logic if specifically requested?
        // User said: "(don't include 'targon' region trait)" for Bronze Life active check.
        // But for Region Ryze? "active we have but not opened" - doesn't exclude Targon explicitly there.
        // But "if these 2 condition are don't met and we don't have 'Targon' trait" implies Targon is handled later.
        // Let's follow strict rule:
        // Region Ryze P1: "all champions that has region trait we have but not opened"
        // Bronze Life P1: "all champions that has region or class trait we have but not opened"

        let shouldCheck = false;
        if (strategy === 'RegionRyze' && rule.type === 'Region') shouldCheck = true;
        if (strategy === 'BronzeLife' && (rule.type === 'Region' || rule.type === 'Class')) {
            if (trait !== 'Targon') shouldCheck = true;
        }

        if (shouldCheck) {
            // Check if "Opened" (At a breakpoint)
            let isOpened = false;
            // Iterate breakpoints descending or check if exact match? 
            // Usually "Opened" means count >= breakpoint[0].
            // But the text says "1 piltover (first breakpoint at 2)".
            // This implies "Not Opened" = "Count < First Breakpoint" OR "Count is strictly between breakpoints"?
            // "if all of our traits are active" -> This usually means consistent/at breakpoint.
            // So "Not Opened" = Not at a breakpoint.
            // We want to fix traits that are "dangling".
            // e.g. Have 1/3 Noxus. We want Noxus units.
            // e.g. Have 4/5 Bilgewater. We want Bilgewater.
            // e.g. Have 3/3 Noxus. We do NOT need Noxus (it is Actve/Opened).

            // Check if current count hits any breakpoint exactly or exceeds max?
            // Actually, usually > breakpoint is fine.
            // Let's assume "Opened" means "Is currently providing a bonus".
            // i.e. count >= breakpoints[0].
            // BUT "1 piltover (BP 2)" -> Active=0.
            // What if we have 2/3 Noxus? BP is 3. Active=0.
            // Only non-active?
            // "if all of our traits are active" (Condition 2) implies Condition 1 is for inactive traits.
            // So: Traits where `count > 0` but `activeTier == -1`.

            let activeTier = -1;
            for (let i = 0; i < rule.breakpoints.length; i++) {
                if (count >= rule.breakpoints[i]) activeTier = i;
            }

            // If activeTier is -1, it is DEFINITELY "not opened".
            // What if we have 4/6 Noxus? ActiveTier = 0 (3-5).
            // Is that "Active"? User says "if all of our traits are active".
            // I will interpret "Active" as "At a breakpoint".
            // But usually intermediate states (4/6) are considered "Active" (Tier 1).
            // The prompt "1 piltover(first breakpoint at 2)" is the key.
            // This is a case where Tier is NONE.

            // Let's stick to: Priority is to activate traits that are currently providing NOTHING (Tier -1).
            // Or does proper "Solver" logic want to reach NEXT breakpoint?
            // "1 piltover" -> Needs +1.
            // user: "all champions that has region trait we have but not opened"
            // I will strictly prioritize traits with `count > 0` but `activeTier === -1`.

            if (activeTier === -1) {
                unbalancedTraits.push(trait);
            }
        }
    }

    // PRIORITY 1: Fix unbalanced/unopened traits
    if (unbalancedTraits.length > 0) {
        // Pick all champions that have at least one of these traits
        const p1Candidates = availablePool.filter(c =>
            c.traits.some(t => unbalancedTraits.includes(t))
        );
        if (p1Candidates.length > 0) return p1Candidates;
    }

    // PRIORITY 2: Expand with new distinct traits
    // Condition: "if all of our traits are active" (implied by reaching here if P1 found nothing).
    // "select all champions which has X distinct [type] traits we dont have"

    const ourTraits = new Set(Object.keys(traitCounts).filter(t => traitCounts[t] > 0));
    const p2Candidates = availablePool.filter(c => {
        let distinctCount = 0;
        for (const t of c.traits) {
            if (ourTraits.has(t)) continue; // Already have this trait
            const rule = TRAIT_RULES[t];
            if (!rule) continue;

            if (strategy === 'RegionRyze') {
                if (rule.type === 'Region') distinctCount++;
            } else if (strategy === 'BronzeLife') {
                if (rule.type === 'Region' || rule.type === 'Class') {
                    if (t !== 'Targon') distinctCount++;
                }
            }
        }

        const threshold = strategy === 'RegionRyze' ? 2 : 3;
        return distinctCount >= threshold;
    });

    if (p2Candidates.length > 0) return p2Candidates;

    // PRIORITY 3: Targon Check
    // "if these 2 condition are don't met and we don't have 'Targon' trait we will pick all targon characters"
    if (!traitCounts['Targon'] || traitCounts['Targon'] === 0) {
        const targonCandidates = availablePool.filter(c => c.traits.includes('Targon'));
        // Note: Strategy BronzeLife P2 excludes Targon from counting, but P3 explicitly checks Targon presence.
        if (targonCandidates.length > 0) return targonCandidates;
    }

    // PRIORITY 4: Completely New/Disjoint Units
    // "pick all champions which don't have any of our active traits"
    const p4Candidates = availablePool.filter(c => {
        // Check if champion has ANY trait that we ALREADY have active
        const hasOverlap = c.traits.some(t => ourTraits.has(t));
        return !hasOverlap;
    });

    return p4Candidates;
}


/**
 * Core recursive solver function.
 */
function buildTeamRecursively(
    currentTeam: Champion[],
    activeEmblems: Record<string, number>,
    allChampions: Champion[],
    strategy: SolverStrategy,
    maxSlots: number,
    results: TeamComp[]
): void {
    RECURSION_COUNT++;
    if (RECURSION_COUNT > MAX_RECURSION_LIMIT) return;

    const usedSlots = calculateUsedSlots(currentTeam);

    // BASE CASE: Team is full or over capacity
    // Note: If we are slightly over capacity due to a big unit (e.g. Baron adding 2 when we had 1 slot left),
    // we should strictly check. 
    // Usually solving for exactly N or <= N? 
    // "every selected champion will reduce team size by 1... exceptions..."
    // We want to fill the team.
    if (usedSlots >= maxSlots) {
        // If we exactly hit maxSlots (or exceeded it meaningfully? UI usually prevents adding if slots full,
        // but solver should probably just stop when >= maxSlots).
        // Calculate score and add to results.
        const comp = createTeamComp(currentTeam, activeEmblems, strategy);
        results.push(comp);
        return;
    }

    // RECURSIVE STEP
    const candidates = getCandidates(currentTeam, activeEmblems, allChampions, strategy);

    // If no candidates found (Search exhausted or logic stuck), just return result as is?
    // Or is it a dead end? 
    // We should probably save what we have if it's "plausible" but maybe not if it's too small?
    // Let's assume we try to fill. If we can't fill (candidates empty), we stop.
    if (candidates.length === 0) {
        // Maybe add "partial" team? For now, let's only add full teams if possible.
        // But if we can't find candidates, we basically stuck.
        // Let's not add partial teams to the specific result list unless it's close?
        // Actually, "never pick... Galio... as candidate".
        // If we have slots but no candidates match criteria, strictly speaking we have no valid next move.
        return;
    }

    // Iterate through candidates.
    // Optimization: If there are MANY candidates (e.g. Priority 4 might return 20 units),
    // we might need to prune or branch carefully.
    // DFS.

    // Sort candidates to try "best" ones first?
    // Cost is usually a good heuristic for "good" units.
    const sortedCandidates = candidates.sort((a, b) => b.cost - a.cost);

    for (const candidate of sortedCandidates) {
        // Pruning: Do not add if it exceeds slot limit excessively?
        // (e.g. 8/9 slots, add Baron (+2) -> 10/9. Is this allowed? In TFT usually no unless specific augment.)
        // We will assume hard cap.
        if (usedSlots + getUnitSlots(candidate) > maxSlots) continue;

        currentTeam.push(candidate);
        buildTeamRecursively(currentTeam, activeEmblems, allChampions, strategy, maxSlots, results);
        currentTeam.pop();

        if (RECURSION_COUNT > MAX_RECURSION_LIMIT) break;
    }
}

function createTeamComp(
    champions: Champion[],
    activeEmblems: Record<string, number>,
    strategy: SolverStrategy
): TeamComp {
    const traitCounts = calculateTraitCounts(champions, activeEmblems);
    const activeSynergies: string[] = [];
    let difficulty = 0;

    // Scoring Logic
    let regionCount = 0;
    let bronzeCount = 0;
    let totalCost = champions.reduce((sum, c) => sum + c.cost, 0);

    // Base difficulty = cost (higher cost units -> harder/better)
    difficulty += totalCost;

    for (const [trait, count] of Object.entries(traitCounts)) {
        if (count <= 0) continue;
        const rule = TRAIT_RULES[trait];
        if (!rule) continue;

        let activeTier = -1;
        for (let i = 0; i < rule.breakpoints.length; i++) {
            if (count >= rule.breakpoints[i]) activeTier = i;
        }

        if (activeTier >= 0) {
            activeSynergies.push(`${trait} (${count})`);
            difficulty += (activeTier + 1) * 10; // Bonus for active traits

            // Strategy Metrics
            if (strategy === 'RegionRyze' && rule.type === 'Region') {
                regionCount++;
            }
            if (strategy === 'BronzeLife' && (rule.type === 'Region' || rule.type === 'Class')) {
                if (trait !== 'Targon') bronzeCount++;
                // Wait, "active bronze trait"? 
                // "if all of our traits are active check... 3 distinct... dont have"
                // The strategy metric for sorting should probably reflect the *Goal*.
                // RegionRyze Goal: Maximize Region traits? 
                // No, the goal was "Region Ryze strategy" logic for building.
                // The *result* should be judged by how well it fits.
                // Assuming we want to maximize the "Strategy Value".
                // RegionRyze Value = # of Active Region Traits?
                // BronzeLife Value = # of Active Bronze (Tier 1+) Traits?
            }
        }
    }

    let strategyValue = 0;
    let strategyName = '';

    if (strategy === 'RegionRyze') {
        strategyValue = regionCount;
        strategyName = 'Active Regions';
        difficulty += regionCount * 500;
    } else {
        strategyValue = bronzeCount;
        strategyName = 'Active Class/Regions';
        difficulty += bronzeCount * 500;
    }

    // Penalize empty slots?
    // The recursive solver stops when full, so assumed full.

    return {
        champions: [...champions],
        difficulty,
        activeSynergies: activeSynergies.sort(),
        strategyValue,
        strategyName
    };
}


export function solveTeamComp(
    activeChampions: Champion[], // Full filtered pool (all available)
    activeEmblems: Record<string, number>,
    maxSlots: number, // "team size"
    strategy: SolverStrategy = 'RegionRyze',
    initialTeam: Champion[] = [] // "selected/filtered champions"
): TeamComp[] {
    RECURSION_COUNT = 0;
    const results: TeamComp[] = [];

    // Filter `activeChampions` to remove Galio/Baron from 'candidates' pool?
    // No, logic inside getCandidates handles exclusion.
    // But we need to ensure `activeChampions` doesn't strictly exclude them if we want to support them 
    // if the user *manually* selected them (passed in initialTeam).
    // The prompt says: "never pick... Galio... as candidate... they will only be included when we have them on selected/filtered champions".
    // This implies `initialTeam` contains them.

    // 1. Validate Initial Team
    const usedSlots = calculateUsedSlots(initialTeam);
    if (usedSlots > maxSlots) {
        // Already overfilled
        return [createTeamComp(initialTeam, activeEmblems, strategy)];
    }

    // 2. Start Recursive Build
    // We clone current team to avoid mutating passed array
    buildTeamRecursively(
        [...initialTeam],
        activeEmblems,
        activeChampions,
        strategy,
        maxSlots,
        results
    );

    // 3. Sort & Return Top Results
    // Sort by difficulty desc
    results.sort((a, b) => b.difficulty - a.difficulty);

    // Prune duplicates (same comp, different order of selection)?
    // Recursive candidates check `!currentNames.has`, so we avoid duplicates of same champion.
    // But [A, B] vs [B, A] is possible if we aren't careful with set order?
    // `getCandidates` picks from `allChampions` minus `currentTeam`.
    // DFS: 
    // 1. Pick A. Pool = {B,C}. Recurse -> Pick B. Team {A,B}.
    // 2. Pick B. Pool = {A,C}. Recurse -> Pick A. Team {B,A}.
    // This creates permutations. We want combinations.
    // Fix: Enforce order?
    // `sortedCandidates` helps, but we need to ensure we only pick "forward".
    // Or just Map-deduplicate results at end.
    // De-duping by sorted unique names is safer/easier than enforcing index logic with dynamic candidate lists.

    const uniqueResults: TeamComp[] = [];
    const seenHashes = new Set<string>();

    for (const res of results) {
        const hash = res.champions.map(c => c.name).sort().join('|');
        if (!seenHashes.has(hash)) {
            seenHashes.add(hash);
            uniqueResults.push(res);
        }
    }

    return uniqueResults.slice(0, 20);
}
