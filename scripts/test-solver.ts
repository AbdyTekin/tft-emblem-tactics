import fs from 'fs';
import path from 'path';
import { solveTeamComp, TeamComp } from '../lib/solver';
import { Champion } from '../types/tft';
import { isLux, getChampionSlots, getChampionTraitContribution, getEffectiveMaxSlots } from '../lib/tft-rules';

// MOCK DATA LOADING
const championsPath = path.join(__dirname, '../lib/set18-champions.json');
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
        output += `Units (${top.champions.length}): ${top.champions.map(c => c.name).join(', ')}\n`;
        const slotsUsed = top.champions.reduce((sum, c) => sum + getChampionSlots(c), 0);
        output += `Slots Used: ${slotsUsed}\n`;
    }
    console.log(output);
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), output);
}

// TEST CASES

async function runTests() {
    fs.writeFileSync(path.join(__dirname, '../test-results.log'), "Running Solver Tests (Set 18 Edge Cases)...\n");

    // 1. Lux +2 Regional Trait Test
    // Lux (Elderwood) should give +2 to Elderwood!
    // Ornn has 1 Elderwood. Together they should reach 3 Elderwood (activating Elderwood 3)!
    const luxElderwood = getChamp('Lux (Elderwood)');
    const ornn = getChamp('Ornn');
    const t1 = solveTeamComp(
        allChampions,
        [],
        2,
        'Vertical',
        [luxElderwood, ornn]
    );
    logTeam('Edge Case: Lux (Elderwood) + Ornn (Expect Elderwood (3) active)', t1);
    if (!t1[0]?.activeSynergies.some(s => s.includes('Elderwood (3)'))) {
        throw new Error("FAILED: Lux did not grant +2 to Elderwood!");
    }

    // 2. Only One Lux Variant Test
    // Even if we search with 5 slots and Blossom emblem, only 1 Lux variant can appear in the team!
    const t2 = solveTeamComp(
        allChampions,
        ['Blossom'],
        5,
        'Vertical',
        []
    );
    logTeam('Edge Case: Only 1 Lux Variant in Generated Team', t2);
    for (const comp of t2) {
        const luxCount = comp.champions.filter(c => isLux(c)).length;
        if (luxCount > 1) {
            throw new Error(`FAILED: Found ${luxCount} Lux variants in a team: ${comp.champions.map(c => c.name).join(', ')}`);
        }
    }

    // 3. Elder Dragon 2 Slots + 2 Riftbeast Test
    // Elder Dragon takes 2 slots and gives 2 Riftbeast.
    // Since Riftbeast is 2, Riftbeast opens and team size gets +2!
    // So with base slots 4: effectiveMaxSlots becomes 4 + 2 = 6!
    // Elder dragon takes 2 slots, so remaining 4 slots can fit 4 normal units (total 5 units, 6 slots used).
    const elderDragon = getChamp('Elder Dragon');
    const t3 = solveTeamComp(
        allChampions,
        [],
        4,
        'Vertical',
        [elderDragon]
    );
    logTeam('Edge Case: Elder Dragon (Expect 2 slots, Riftbeast (2)+ active, +2 team size)', t3);
    const topComp3 = t3[0];
    const topComp3Slots = topComp3.champions.reduce((sum, c) => sum + getChampionSlots(c), 0);
    if (topComp3Slots !== 6) {
        throw new Error(`FAILED: Expected 6 slots used (4 base + 2 Riftbeast bonus), got ${topComp3Slots}`);
    }

    // 4. 2 Riftbeast +2 Team Size Test (without Elder Dragon)
    // Cinderling (1) + Murkwolf (1) = 2 Riftbeast.
    // Base slots 3 -> effectiveMaxSlots = 3 + 2 = 5!
    // Total champions should reach 5 units!
    const cinderling = getChamp('Cinderling');
    const murkwolf = getChamp('Murkwolf');
    const t4 = solveTeamComp(
        allChampions,
        [],
        3,
        'Vertical',
        [cinderling, murkwolf]
    );
    logTeam('Edge Case: 2 Riftbeast +2 Team Size (Base 3 -> 5 units)', t4);
    const topComp4 = t4[0];
    if (topComp4.champions.length !== 5) {
        throw new Error(`FAILED: Expected 5 units (3 base + 2 bonus), got ${topComp4.champions.length}`);
    }

    console.log("\n ALL EDGE CASE TESTS PASSED!");
}

runTests().catch(e => {
    console.error(e);
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), `Error: ${e.message}\n${e.stack}`);
    process.exit(1);
});
