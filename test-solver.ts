
import { solveTeamComp } from './lib/solver';
import enChampions from './lib/set16-champions-en.json';

const champions = enChampions as any[];

console.log("--- Test 1: Single Emblem (Yordle) ---");
const result1 = solveTeamComp(champions, ["Yordle"]);
console.log("Score:", result1[0]?.score);
console.log("Synergies:", result1[0]?.activeSynergies);
console.log("Champions:", result1[0]?.champions.map(c => c.name).join(", "));

console.log("\n--- Test 2: Double Emblem (Arcanist, Scrap) ---");
const result2 = solveTeamComp(champions, ["Arcanist", "Scrap"]);
console.log("Score:", result2[0]?.score);
console.log("Synergies:", result2[0]?.activeSynergies);
console.log("Champions:", result2[0]?.champions.map(c => c.name).join(", "));
