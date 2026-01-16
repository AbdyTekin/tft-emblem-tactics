import { Champion } from '@/types/tft';

export interface TeamComp {
    champions: Champion[];
    score: number;
    activeSynergies: string[];
}

const TEAM_SIZE = 8; // Standard TFT team size

/**
 * Generates team compositions based on selected emblems.
 * 
 * Algorithm:
 * 1. Identify "Core Units": Champions that possess at least one of the selected emblems.
 * 2. Score all champions based on how well they fit:
 *    - High bonus for matching a selected emblem.
 *    - Small bonus for cost (higher cost = generally stronger).
 *    - Bonus for sharing traits with already selected Core Units (Synergy potential).
 * 3. Generate a primary composition by greedily selecting top scoring units.
 */
export function solveTeamComp(
    activeChampions: Champion[],
    selectedEmblems: string[]
): TeamComp[] {
    if (selectedEmblems.length === 0) {
        return [];
    }

    // 1. Calculate a "Static Score" for each champion based purely on selected emblems
    const scoredChampions = activeChampions.map(champ => {
        let score = 0;
        const matchingTraits = champ.traits.filter(t => selectedEmblems.includes(t));

        // Heuristic Scoring
        score += matchingTraits.length * 100; // Heavy weight for requested traits
        score += champ.cost * 5;              // Prefer higher cost units slightly

        return { ...champ, rawScore: score, matchingTraits };
    });

    // Sort by score descending
    scoredChampions.sort((a, b) => b.rawScore - a.rawScore);

    // 2. Select initial core (Fit as many matching units as possible up to TEAM_SIZE)
    // If we have more matches than team size, we just take the best ones.
    // If we have fewer, we fill with synergy bots.

    let currentComp: typeof scoredChampions = [];
    const compIds = new Set<string>();

    // Take top candidates
    for (const champ of scoredChampions) {
        if (currentComp.length >= TEAM_SIZE) break;
        currentComp.push(champ);
        compIds.add(champ.id);
    }

    // 3. If we still have room (currentComp.length < TEAM_SIZE), fill with Synergy Bots
    if (currentComp.length < TEAM_SIZE) {
        // Identify traits currently in the comp
        const currentTraits = new Map<string, number>();
        currentComp.forEach(c => {
            c.traits.forEach(t => {
                currentTraits.set(t, (currentTraits.get(t) || 0) + 1);
            });
        });

        // Find candidates from the remaining pool
        const remainingChampions = activeChampions.filter(c => !compIds.has(c.id));

        // Score remaining champions based on how many VALID EXISTING traits they activate
        const fillerCandidates = remainingChampions.map(champ => {
            let synergyScore = 0;
            champ.traits.forEach(t => {
                if (currentTraits.has(t)) {
                    synergyScore += 10; // Bonus for activating/adding to an existing trait
                }
            });
            return { ...champ, synergyScore: synergyScore + champ.cost };
        });

        fillerCandidates.sort((a, b) => b.synergyScore - a.synergyScore);

        // Fill the rest
        for (const champ of fillerCandidates) {
            if (currentComp.length >= TEAM_SIZE) break;
            currentComp.push({ ...champ, rawScore: 0, matchingTraits: [] }); // formatting to match type
        }
    }

    // 4. Finalize and Calculate Output Metrics
    const finalChampions = currentComp.map(({ rawScore, matchingTraits, ...c }) => c); // strip internal props

    // Calculate active synergies for this specific team
    const traitCounts = new Map<string, number>();
    finalChampions.forEach(c => {
        c.traits.forEach(t => {
            traitCounts.set(t, (traitCounts.get(t) || 0) + 1);
        });
    });

    const activeSynergies: string[] = [];
    // For now, we consider a synergy "active" if it has > 1 unit, or if it's a selected emblem (even if 1).
    // Real TFT logic requires breakpoints (e.g. 2/4/6), but we don't have that data in the JSON.
    // We'll estimate: if count >= 2 or it is a selected emblem.
    traitCounts.forEach((count, trait) => {
        if (count >= 2 || selectedEmblems.includes(trait)) {
            activeSynergies.push(`${trait} (${count})`);
        }
    });

    // Calculate total team score
    const totalScore = currentComp.reduce((sum, c) => sum + (c.rawScore || 0) + (c.cost || 0), 0);

    return [
        {
            champions: finalChampions,
            score: totalScore,
            activeSynergies: activeSynergies.sort()
        }
    ];
}
