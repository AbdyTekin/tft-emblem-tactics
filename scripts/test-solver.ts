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

    // 1. Level 8 Team Slot Count Test
    // A standard level 8 team with e.g. Blossom emblem must use exactly 8 slots (NOT 10 slots!)
    const t1 = solveTeamComp(
        allChampions,
        ['Blossom'],
        8,
        'Vertical',
        []
    );
    logTeam('Level 8 Blossom Team (Expect 8 slots used)', t1);
    for (const comp of t1) {
        const slots = comp.champions.reduce((sum, c) => sum + getChampionSlots(c), 0);
        if (slots !== 8) {
            throw new Error(`FAILED: Level 8 team used ${slots} slots instead of 8! Units: ${comp.champions.map(c => c.name).join(', ')}`);
        }
    }

    // 2. Lux +2 Regional Trait Test
    // Lux (Elderwood) grants +2 to Elderwood!
    // Ornn has 1 Elderwood. Together they should reach 3 Elderwood (activating Elderwood 3)!
    const luxElderwood = getChamp('Lux (Elderwood)');
    const ornn = getChamp('Ornn');
    const t2 = solveTeamComp(
        allChampions,
        [],
        2,
        'Vertical',
        [luxElderwood, ornn]
    );
    logTeam('Lux (Elderwood) + Ornn (Expect Elderwood (3) active)', t2);
    if (!t2[0]?.activeSynergies.some(s => s.includes('Elderwood (3)'))) {
        throw new Error("FAILED: Lux did not grant +2 to Elderwood!");
    }

    // 3. Only One Lux Variant in Team Test
    const t3 = solveTeamComp(
        allChampions,
        ['Blossom'],
        8,
        'Vertical',
        []
    );
    logTeam('Only 1 Lux Variant in Level 8 Team', t3);
    for (const comp of t3) {
        const luxCount = comp.champions.filter(c => isLux(c)).length;
        if (luxCount > 1) {
            throw new Error(`FAILED: Found ${luxCount} Lux variants in a team: ${comp.champions.map(c => c.name).join(', ')}`);
        }
    }

    // 4. Elder Dragon 2 Slots + 2 Riftbeast Test
    // Elder Dragon takes 2 slots and gives 2 Riftbeast.
    // Since 2 Riftbeast is NOT 10 Riftbeast, it does NOT grant +2 team size.
    // So on base slots 8, an Elder Dragon team must use exactly 8 slots!
    // (e.g. 1 Elder Dragon [2 slots] + 6 normal units [6 slots] = 7 units, 8 slots).
    const elderDragon = getChamp('Elder Dragon');
    const t4 = solveTeamComp(
        allChampions,
        [],
        8,
        'Vertical',
        [elderDragon]
    );
    logTeam('Elder Dragon Level 8 Team (Expect 8 slots used total)', t4);
    const topComp4 = t4[0];
    const topComp4Slots = topComp4.champions.reduce((sum, c) => sum + getChampionSlots(c), 0);
    if (topComp4Slots !== 8) {
        throw new Error(`FAILED: Expected 8 slots used for Elder Dragon level 8 team, got ${topComp4Slots}`);
    }

    // 5. 10 Riftbeast +2 Team Size Test
    // All 9 normal Riftbeast units (9 slots, 9 Riftbeast) + Elder Dragon (2 slots, +2 Riftbeast)
    // gives 11 Riftbeast count (>= 10)!
    // That triggers +2 team size!
    const allRiftbeasts = allChampions.filter(c => c.traits.includes('Riftbeast'));
    const rbTraitCounts = { Riftbeast: 11 };
    const effectiveSlots = getEffectiveMaxSlots(8, rbTraitCounts);
    console.log(`10+ Riftbeast effectiveMaxSlots for base 8: ${effectiveSlots} (Expected: 10)`);
    if (effectiveSlots !== 10) {
        throw new Error(`FAILED: Expected 10 slots for 10+ Riftbeast, got ${effectiveSlots}`);
    }

    console.log("\n ALL LEVEL 8 & EDGE CASE TESTS PASSED!");
}

runTests().catch(e => {
    console.error(e);
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), `Error: ${e.message}\n${e.stack}`);
    process.exit(1);
});
