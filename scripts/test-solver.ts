import fs from 'fs';
import path from 'path';
import { solveTeamComp, TeamComp } from '../lib/solver';
import { Champion } from '../types/tft';

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
        output += `Units: ${top.champions.map(c => c.name).join(', ')}\n`;
    }
    console.log(output);
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), output);
}

// TEST CASES

async function runTests() {
    // Clear log
    fs.writeFileSync(path.join(__dirname, '../test-results.log'), "Running Solver Tests (Set 18)...\n");

    // 1. Basic Slot Test - Set 18
    const xayah = getChamp('Xayah');
    const t1 = solveTeamComp(
        allChampions,
        ['Elderwood'],
        3, // Max slots
        'Vertical',
        [xayah] // Initial
    );
    logTeam('Xayah + Elderwood Emblem (Vertical)', t1);

    // 2. Trait Activation priority
    // Ornn is Elderwood, Defender
    // Alistar is Elderwood, Brawler
    const ornn = getChamp('Ornn');
    const t2 = solveTeamComp(
        allChampions,
        [],
        3,
        'Vertical',
        [xayah, ornn] // Need 1 more for Elderwood (3)
    );
    logTeam('Xayah + Ornn + 1 Slot', t2);

    // 3. Bronze Life Test
    const t3 = solveTeamComp(
        allChampions,
        [],
        4,
        'BronzeLife',
        []
    );
    logTeam('Bronze Life: 4 Units Empty Start', t3);

    // 4. Vertical Empty Start
    const t4 = solveTeamComp(
        allChampions,
        ['Ravager'],
        4,
        'Vertical',
        []
    );
    logTeam('Vertical: 4 Units with Ravager Emblem', t4);
}

runTests().catch(e => {
    console.error(e);
    fs.appendFileSync(path.join(__dirname, '../test-results.log'), `Error: ${e.message}\n${e.stack}`);
});
