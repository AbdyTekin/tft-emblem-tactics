
import fs from 'fs';
import path from 'path';
import { solveTeamComp, TeamComp } from '../lib/solver';
import { Champion } from '../types/tft';

// MOCK DATA LOADING
const championsPath = path.join(__dirname, '../lib/set16-champions.json');
const allChampions: Champion[] = JSON.parse(fs.readFileSync(championsPath, 'utf-8'));

function getChamp(name: string): Champion {
    const c = allChampions.find(c => c.name === name);
    if (!c) throw new Error(`Champion not found: ${name}`);
    return c;
}

// HELPERS
function logTeam(title: string, team: TeamComp[]) {
    let output = `\n=== ${title} ===\n`;
    if (team.length === 0) {
        output += "No teams found.\n";
    } else {
        const top = team[0];
        output += `Score: ${top.difficulty} | StrategyVal: ${top.strategyValue} (${top.strategyName})\n`;
        output += `Synergies: ${top.activeSynergies.join(', ')}\n`;
        output += `Units: ${top.champions.map(c => c.name).join(', ')}\n`;
    }
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), output);
}

// TEST CASES

async function runTests() {
    // Clear log
    fs.writeFileSync(path.join(__dirname, '../test-results.log'), "Running Solver Tests...\n");

    // 1. Galio Slot Test
    // Galio takes 0 slots. If we have size 1, we should be able to fit Galio + 1 Unit?
    // Wait, solver logic: "Exceptions... Galio...".
    // If we select Galio initially.
    const galio = getChamp('Galio');
    const t1 = solveTeamComp(
        allChampions,
        {},
        1, // Max slots
        'RegionRyze',
        [galio] // Initial
    );
    // Should have 2 units (Galio + 1 other)?
    logTeam('Galio + 1 Slot', t1);

    // 2. Baron Slot Test
    // Baron takes 2 slots. If we have size 2, adding Baron fills it?
    // If we have size 1, adding Baron fails?
    const baron = getChamp('Baron Nashor');
    try {
        const t2 = solveTeamComp(allChampions, {}, 1, 'RegionRyze', [baron]);
        logTeam('Baron in 1 Slot (Should fail/overflow check?)', t2);
    } catch (e) {
        fs.appendFileSync(path.join(__dirname, '../test-results.log'), 'Baron in 1 Slot: Caught expected error/empty\n');
    }

    const t3 = solveTeamComp(allChampions, {}, 2, 'RegionRyze', [baron]);
    logTeam('Baron in 2 Slots', t3);
    // Should show Void (2) because Baron adds +2.

    // 3. Region Ryze Priority Test
    // Mock: Have 1 Piltover active (e.g. Vi, active count 1/2).
    // Solver should prioritize finding another Piltover (e.g. Caitlyn, Jayce, Ekko, Heimer? Set 9 names? Wait, Set 16.)
    // Let's check Set 16 Piltover units from JSON:
    // Caitlyn (Piltover/Longshot), Vi (Piltover/Zaun/Defender), Seraphine (Piltover/Disruptor), T-Hex?
    const vi = getChamp('Vi'); // Piltover
    const t4 = solveTeamComp(
        allChampions,
        {},
        2, // Vi + 1
        'RegionRyze',
        [vi]
    );
    // Expect: The 2nd unit should be Piltover to close the trait (BP 2).
    logTeam('Region Ryze: Fix 1/2 Piltover', t4);

    // 4. Region Ryze Distinct Test
    // Mock: Have complete traits. Need 2 distinct NEW regions.
    // Vi (Piltover 1) + Caitlyn (Piltover 1) -> Piltover 2 (Active).
    // Next unit should provide 2 distinct regions?
    // E.g. A unit with [RegionA, RegionB]. Or just single region unit if no dual region exists?
    // "select all champions which has 2 distinct region traits we dont have"
    // Are there units with 2 regions in Set 16?
    // Let's scan:
    // Vi: Piltover, Zaun. (2 regions!)
    // If we have neither, Vi is a top candidate.
    const t5 = solveTeamComp(
        allChampions,
        {},
        1,
        'RegionRyze', // Empty start
        []
    );
    // Should pick someone like Vi (Piltover/Zaun) or someone else with 2 regions?
    logTeam('Region Ryze: Empty Start (Best 1 Unit)', t5);

    // 5. Bronze Life Test
    // Priority: un-opened traits.
    // If none, pick 3 distinct Class/Regions.
    // Is there a unit with 3 Class/Regions?
    // Vi: Piltover(R), Zaun(R), Defender(C). -> 3!
    // So Vi is a god unit for Bronze Life too?
    const t6 = solveTeamComp(
        allChampions,
        {},
        1,
        'BronzeLife',
        []
    );
    logTeam('Bronze Life: Empty Start', t6);

}

runTests().catch(e => {
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), `Error: ${e.message}\n${e.stack}`);
});
