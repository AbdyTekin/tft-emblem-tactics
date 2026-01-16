
import { solveTeamComp } from './lib/solver';
import enChampions from './lib/set16-champions-en.json';

const champions = enChampions as any[];

console.log("--- Test 1: RegionRyze Strategy (Level 8, Demacia Emblem) ---");
const result1 = solveTeamComp(
    champions,
    { "Demacia": 1 },
    8,
    'RegionRyze'
);
if (result1.length > 0) {
    console.log("Score:", result1[0].score);
    console.log("Synergies:", result1[0].activeSynergies);
    console.log("Champions:", result1[0].champions.map(c => c.name).join(", "));
} else {
    console.log("No teams found.");
}

console.log("\n--- Test 2: BronzeLife Strategy (Level 8, no emblems) ---");
const result2 = solveTeamComp(
    champions,
    {},
    8,
    'BronzeLife'
);
if (result2.length > 0) {
    console.log("Score:", result2[0].score);
    console.log("Synergies:", result2[0].activeSynergies);
} else {
    console.log("No teams found.");
}
