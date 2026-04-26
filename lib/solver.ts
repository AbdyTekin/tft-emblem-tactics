import { Champion } from '@/types/tft';
import { TRAIT_RULES, TraitRule } from '@/lib/trait-rules';

export interface TeamComp {
    champions: Champion[];
    difficulty: number;
    activeSynergies: string[];
    strategyValue: number;
    strategyName: string;
}

export type SolverStrategy = 'Vertical' | 'BronzeLife';

let RECURSION_COUNT = 0;
const MAX_RECURSION_LIMIT = 100000;

function calculateTraitCounts(
    champions: Champion[],
    activeEmblems: Record<string, number>
): Record<string, number> {
    const counts: Record<string, number> = { ...activeEmblems };

    for (const champ of champions) {
        for (const trait of champ.traits) {
            counts[trait] = (counts[trait] || 0) + 1;
        }
    }
    return counts;
}

function updateTraitCounts(
    counts: Record<string, number>,
    champion: Champion,
    direction: 1 | -1
): void {
    for (const trait of champion.traits) {
        counts[trait] = (counts[trait] || 0) + direction;
    }
}

function getCandidates(
    currentTeam: Champion[],
    traitCounts: Record<string, number>,
    allChampions: Champion[],
    strategy: SolverStrategy,
    selectedEmblems: string[]
): Champion[] {
    const currentNames = new Set(currentTeam.map(c => c.name));

    const availablePool = allChampions.filter(c =>
        !currentNames.has(c.name)
    );

    if (availablePool.length === 0) return [];

    if (strategy === 'Vertical') {
        // Vertical priority: Try to upgrade the earliest possible selected emblem
        for (const emblemTrait of selectedEmblems) {
            const count = traitCounts[emblemTrait] || 0;
            const rule = TRAIT_RULES[emblemTrait];
            if (!rule) continue;

            // Check if we can still upgrade this trait
            const isCapped = count >= rule.breakpoints[rule.breakpoints.length - 1];
            if (!isCapped) {
                // Find candidates that have this trait
                const candidates = availablePool.filter(c => c.traits.includes(emblemTrait));
                if (candidates.length > 0) {
                    return candidates;
                }
            }
        }

        // Fallback if no selected emblem traits can be upgraded with available pool
        // Prioritize champions that bring in NEW origin/class traits or add to currently openable origin/class traits
        
        const activeNonUniqueTraits = new Set<string>();
        const openableNonUniqueTraits = new Set<string>();

        for (const [trait, count] of Object.entries(traitCounts)) {
            if (count <= 0) continue;
            const rule = TRAIT_RULES[trait];
            if (!rule || rule.type === 'Unique') continue;
            
            if (count >= rule.breakpoints[0]) {
                activeNonUniqueTraits.add(trait);
            } else {
                openableNonUniqueTraits.add(trait);
            }
        }

        // 1. Try to activate an openable trait
        if (openableNonUniqueTraits.size > 0) {
            let candidates = availablePool.filter(c => 
                c.traits.some(t => openableNonUniqueTraits.has(t))
            );
            if (candidates.length > 0) return candidates;
        }

        // 2. Try to introduce multiple NEW non-unique traits
        let candidates = availablePool.filter(c => {
            let newTraitsCount = 0;
            for (const t of c.traits) {
                const rule = TRAIT_RULES[t];
                if (!rule || rule.type === 'Unique') continue;
                if (!activeNonUniqueTraits.has(t)) newTraitsCount++;
            }
            return newTraitsCount >= 2;
        });
        if (candidates.length > 0) return candidates;

        // 3. Try to introduce at least 1 NEW non-unique trait
        candidates = availablePool.filter(c => {
            return c.traits.some(t => {
                const rule = TRAIT_RULES[t];
                if (!rule || rule.type === 'Unique') return false;
                return !activeNonUniqueTraits.has(t);
            });
        });
        if (candidates.length > 0) return candidates;

        // If no opened traits can be upgraded, return all available champions
        return availablePool;
    }

    const openableTraits: Record<string, number> = {};
    const openedTraits: Record<string, number> = {};
    for (const [trait, count] of Object.entries(traitCounts)) {
        if (count <= 0) continue;
        const rule = TRAIT_RULES[trait];
        if (!rule) continue;

        let checkBreakpoint = false;
        const bronzeLifeCheck = strategy === 'BronzeLife' && rule.type !== 'Unique';
        if (bronzeLifeCheck) checkBreakpoint = true;
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

    // Candidate Logic for BronzeLife
    let candidates: Champion[] = [];
    if (Object.keys(openableTraits).length > 0) {
        candidates = availablePool.filter(c =>
            c.traits.some(t => openableTraits[t] && !openedTraits[t])
        );
    }
    else {
        candidates = availablePool.filter(c => {
            let distinctCount = 0;
            for (const t of c.traits) {
                const rule = TRAIT_RULES[t];
                if (!rule) continue;

                const bronzeLifeCheck = strategy === 'BronzeLife' && rule.type !== 'Unique';
                if (bronzeLifeCheck && openedTraits[t] <= rule.breakpoints[0]) return false;
                if (bronzeLifeCheck) distinctCount++;
            }

            const threshold = 3;
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
    traitCounts: Record<string, number>,
    activeEmblems: Record<string, number>,
    activeChampions: Champion[],
    strategy: SolverStrategy,
    maxSlots: number,
    results: TeamComp[],
    selectedEmblems: string[]
): void {
    RECURSION_COUNT++;
    if (RECURSION_COUNT > MAX_RECURSION_LIMIT) return;

    const usedSlots = currentTeam.length;
    if (usedSlots >= maxSlots) {
        const comp = createTeamComp(currentTeam, activeEmblems, strategy, selectedEmblems);
        results.push(comp);
        return;
    }

    // RECURSIVE STEP
    const candidates = getCandidates(currentTeam, traitCounts, activeChampions, strategy, selectedEmblems);

    if (candidates.length === 0) return;

    const sortedCandidates = candidates.sort((a, b) => b.cost - a.cost);

    for (const candidate of sortedCandidates) {
        currentTeam.push(candidate);
        updateTraitCounts(traitCounts, candidate, 1);

        buildTeamRecursively(currentTeam, traitCounts, activeEmblems, activeChampions, strategy, maxSlots, results, selectedEmblems);

        updateTraitCounts(traitCounts, candidate, -1);
        currentTeam.pop();

        if (RECURSION_COUNT > MAX_RECURSION_LIMIT) break;
    }
}

function createTeamComp(
    champions: Champion[],
    activeEmblems: Record<string, number>,
    strategy: SolverStrategy,
    selectedEmblems: string[]
): TeamComp {
    const traitCounts = calculateTraitCounts(champions, activeEmblems);
    const activeSynergies: string[] = [];
    let difficulty = 0;
    let originCount = 0;
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
            const bronzeLifeCheck = strategy === 'BronzeLife' && rule.type !== 'Unique';
            if (bronzeLifeCheck && count <= rule.breakpoints[0]) bronzeCount++;
        }
    }

    let strategyValue = 0;
    let strategyName = '';

    if (strategy === 'Vertical') {
        let verticalScore = 0;
        let multiplier = 100000;
        
        // Priority points for selected emblems
        for (const emblem of selectedEmblems) {
            const count = traitCounts[emblem] || 0;
            const rule = TRAIT_RULES[emblem];
            if (rule) {
                let activeTier = -1;
                for (let i = 0; i < rule.breakpoints.length; i++) {
                    if (count >= rule.breakpoints[i]) activeTier = i;
                }
                
                if (activeTier >= 0) {
                    verticalScore += (activeTier + 1) * multiplier;
                }
            }
            multiplier /= 10;
        }

        let goldOrPrismaticCount = 0;
        let activeNonUniqueCount = 0;

        for (const [trait, count] of Object.entries(traitCounts)) {
            if (count <= 0) continue;
            const rule = TRAIT_RULES[trait];
            if (!rule) continue;

            let activeTier = -1;
            for (let i = 0; i < rule.breakpoints.length; i++) {
                if (count >= rule.breakpoints[i]) activeTier = i;
            }

            if (activeTier >= 0) {
                if (rule.type !== 'Unique') {
                    activeNonUniqueCount++;

                    // A trait is considered "gold or prismatic" if it reached its highest breakpoint, 
                    // or the second highest breakpoint if it has 4 or more breakpoints.
                    const isGoldOrPrismatic = activeTier === rule.breakpoints.length - 1 || 
                        (rule.breakpoints.length >= 4 && activeTier === rule.breakpoints.length - 2);
                    
                    if (isGoldOrPrismatic) {
                        goldOrPrismaticCount++;
                    }
                }
            }
        }

        strategyValue = goldOrPrismaticCount;
        strategyName = 'vertical';
        difficulty += verticalScore + (activeNonUniqueCount * 100);
    } else {
        strategyValue = bronzeCount;
        strategyName = 'bronzeTrait';
        difficulty += bronzeCount * 1000;
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
    selectedEmblems: string[], // Emblems in order of selection
    maxSlots: number, // "team size"
    strategy: SolverStrategy = 'Vertical',
    initialTeam: Champion[] = [] // selected/filtered champions
): TeamComp[] {
    RECURSION_COUNT = 0;
    const results: TeamComp[] = [];
    
    const activeEmblems: Record<string, number> = {};
    for (const e of selectedEmblems) {
        activeEmblems[e] = (activeEmblems[e] || 0) + 1;
    }

    // 0. Clone Initial Team to prevent mutation of props
    const currentTeam = [...initialTeam];

    // 1. Validate Initial Team
    const usedSlots = currentTeam.length;
    if (usedSlots > maxSlots) {
        // Already overfilled
        return [createTeamComp(currentTeam, activeEmblems, strategy, selectedEmblems)];
    }

    // 2. Start Recursive Build
    const startTraitCounts = calculateTraitCounts(currentTeam, activeEmblems);

    buildTeamRecursively(
        [...currentTeam],
        startTraitCounts,
        activeEmblems,
        activeChampions,
        strategy,
        maxSlots,
        results,
        selectedEmblems
    );

    // 3. Sort & Return Top Results
    results.sort((a, b) => b.difficulty - a.difficulty);

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
