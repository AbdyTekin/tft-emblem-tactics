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

let RECURSION_COUNT = 0;
const MAX_RECURSION_LIMIT = 100000;

function getUnitSlots(champion: Champion): number {
    if (champion.name === "Galio") return 0;
    if (champion.name === "Baron Nashor") return 2;
    return 1;
}

function calculateUsedSlots(team: Champion[]): number {
    return team.reduce((acc, champ) => acc + getUnitSlots(champ), 0);
}

function calculateTraitCounts(
    champions: Champion[],
    activeEmblems: Record<string, number>
): Record<string, number> {
    const counts: Record<string, number> = { ...activeEmblems };

    for (const champ of champions) {
        for (const trait of champ.traits) {
            let increment = 1;
            if (trait === 'Void' && champ.name === 'Baron Nashor') {
                increment = 2;
            }
            counts[trait] = (counts[trait] || 0) + increment;
        }
    }
    return counts;
}

function getCandidates(
    currentTeam: Champion[],
    activeEmblems: Record<string, number>,
    allChampions: Champion[],
    strategy: SolverStrategy
): Champion[] {
    const traitCounts = calculateTraitCounts(currentTeam, activeEmblems);

    const currentNames = new Set(currentTeam.map(c => c.name));
    const availablePool = allChampions.filter(c =>
        !currentNames.has(c.name) &&
        c.name !== "Galio" &&
        c.name !== "Baron Nashor"
    );

    if (availablePool.length === 0) return [];

    const openableTraits: Record<string, number> = {};
    const openedTraits: Record<string, number> = {};
    for (const [trait, count] of Object.entries(traitCounts)) {
        if (count <= 0) continue;
        const rule = TRAIT_RULES[trait];
        if (!rule) continue;

        let checkBreakpoint = false;
        const regionRyzeCheck = strategy === 'RegionRyze' && rule.type === 'Region';
        const bronzeLifeCheck = strategy === 'BronzeLife' && rule.type !== 'Origin' && trait !== 'Targon';
        if (regionRyzeCheck || bronzeLifeCheck) checkBreakpoint = true;
        if (checkBreakpoint) {
            let activeTier = -1;
            for (let i = 0; i < rule.breakpoints.length; i++) {
                if (count >= rule.breakpoints[i]) activeTier = i;
                else {
                    if (activeTier === -1) openableTraits[trait] = count;
                    else openedTraits[trait] = count;
                    break;
                }
            }
        }
    }

    // Candidate Logic
    let candidates: Champion[] = [];
    if (openableTraits.length > 0) {
        candidates = availablePool.filter(c =>
            c.traits.some(t => (openableTraits[t] || (strategy === 'RegionRyze' && t === 'Targon')) && !openedTraits[t])
        );
    }
    else {
        candidates = availablePool.filter(c => {
            let distinctCount = 0;
            for (const t of c.traits) {
                const rule = TRAIT_RULES[t];
                if (!rule) continue;

                const regionRyzeCheck = strategy === 'RegionRyze' && rule.type === 'Region';
                const bronzeLifeCheck = strategy === 'BronzeLife' && rule.type !== 'Origin' && t !== 'Targon';
                if (bronzeLifeCheck && openedTraits[t] <= rule.breakpoints[0]) return false;
                if (regionRyzeCheck || bronzeLifeCheck) distinctCount++;
            }

            const threshold = strategy === 'RegionRyze' ? 2 : 3;
            return distinctCount >= threshold;
        });

        if (candidates.length <= 0) {
            candidates = availablePool.filter(c => {
                return c.traits.some(t => !openedTraits[t]);
            });
        }
    }

    return candidates;
}

function buildTeamRecursively(
    currentTeam: Champion[],
    activeEmblems: Record<string, number>,
    activeChampions: Champion[],
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
    const candidates = getCandidates(currentTeam, activeEmblems, activeChampions, strategy);

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
        buildTeamRecursively(currentTeam, activeEmblems, activeChampions, strategy, maxSlots, results);
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
    let regionCount = 0;
    let bronzeCount = 0;
    let totalCost = champions.reduce((sum, c) => sum + c.cost, 0);
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
            const regionRyzeCheck = strategy === 'RegionRyze' && rule.type === 'Region';
            const bronzeLifeCheck = strategy === 'BronzeLife' && rule.type !== 'Origin' && trait !== 'Targon';
            if (regionRyzeCheck) regionCount++;
            if (bronzeLifeCheck && count <= rule.breakpoints[0]) bronzeCount++;
        }
    }

    let strategyValue = 0;
    let strategyName = '';

    if (strategy === 'RegionRyze') {
        strategyValue = regionCount;
        strategyName = 'region';
        difficulty += regionCount * 500;
    } else {
        strategyValue = bronzeCount;
        strategyName = 'bronzeTrait';
        difficulty += bronzeCount * 500;
    }

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

    let ryze = activeChampions.find(c => c.name === "Ryze")!;
    if (ryze && strategy === 'RegionRyze' && !initialTeam.includes(ryze)) {
        initialTeam.push(ryze);
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
