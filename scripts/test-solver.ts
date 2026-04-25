import fs from 'fs';
import path from 'path';
import { solveTeamComp, TeamComp } from '../lib/solver';
import { Champion } from '../types/tft';

// MOCK DATA LOADING
const championsPath = path.join(__dirname, '../lib/set17-champions.json');
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

    // 1. Basic Slot Test - Set 17
    const aatrox = getChamp('Aatrox');
    const t1 = solveTeamComp(
        allChampions,
        {},
        2, // Max slots
        'OriginMax',
        [aatrox] // Initial
    );
    // Should have 2 units (Aatrox + 1 other that grants N.O.V.A or Bastion)
    logTeam('Aatrox + 1 Slot (OriginMax)', t1);

    // 2. Trait Activation priority
    // Aatrox is NOVA, Bastion
    // Maokai is NOVA, Brawler
    // 2 units should prioritize N.O.V.A.
    const maokai = getChamp('Maokai');
    const t2 = solveTeamComp(
        allChampions,
        {},
        2,
        'OriginMax',
        [aatrox, maokai] // Complete NOVA team
    );
    logTeam('Aatrox + Maokai', t2);

    // 3. Bronze Life Test
    // Prioritize units with many distinct unique traits.
    const t3 = solveTeamComp(
        allChampions,
        {},
        3,
        'BronzeLife',
        []
    );
    logTeam('Bronze Life: 3 Units Empty Start', t3);

    // 4. OriginMax Empty Source
    // Prioritizes finding units with Origins
    const t4 = solveTeamComp(
        allChampions,
        {},
        3,
        'OriginMax', // Empty start
        []
    );
    logTeam('OriginMax: 3 Units Empty Start', t4);
}

runTests().catch(e => {
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), `Error: ${e.message}\n${e.stack}`);
});
