// scripts/update-data.mjs
// Fetches TFT Set 17 champion data from Community Dragon and generates set17-champions.json
import fs from 'fs';
import path from 'path';

const URL_EN = "https://raw.communitydragon.org/latest/cdragon/tft/en_us.json";
const URL_TR = "https://raw.communitydragon.org/latest/cdragon/tft/tr_tr.json";
const OUTPUT_DIR = path.join(process.cwd(), 'lib');

const SET_NUMBER = 17;

async function fetchData() {
    console.log("🔥 Fetching latest TFT data from Community Dragon...");

    try {
        // Fetch English data
        console.log("📥 Fetching EN data...");
        const resEn = await fetch(URL_EN);
        if (!resEn.ok) throw new Error(`Failed to fetch EN: ${resEn.statusText}`);
        const dataEn = await resEn.json();

        // Find Set 17 in setData
        let set17En = null;
        for (const [, val] of Object.entries(dataEn.setData)) {
            if (val.number === SET_NUMBER) {
                set17En = val;
                break;
            }
        }

        if (!set17En) {
            throw new Error(`Set ${SET_NUMBER} not found in CDragon data!`);
        }

        console.log(`✅ Found Set ${SET_NUMBER}: "${set17En.name}" (mutator: ${set17En.mutator})`);
        console.log(`   Total champions: ${set17En.champions.length}`);

        // Filter playable champions (those with at least one trait)
        const playableChamps = set17En.champions
            .filter(c => c.traits && c.traits.length > 0)
            .map(c => ({
                apiName: c.apiName,
                name: c.name,
                cost: c.cost,
                traits: c.traits.map(t => t.replace(/\./g, '')),
                id: c.apiName.toLowerCase()
            }))
            .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

        console.log(`   Playable champions (with traits): ${playableChamps.length}`);

        // Write set17-champions.json
        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

        const champFile = path.join(OUTPUT_DIR, 'set17-champions.json');
        fs.writeFileSync(champFile, JSON.stringify(playableChamps, null, 2));
        console.log(`✅ Champion data saved to ${champFile}`);

        // Save full TR data for reference
        console.log("📥 Fetching TR data...");
        const resTr = await fetch(URL_TR);
        if (!resTr.ok) throw new Error(`Failed to fetch TR: ${resTr.statusText}`);
        const dataTr = await resTr.json();

        const trFile = path.join(OUTPUT_DIR, 'tft-data-tr.json');
        fs.writeFileSync(trFile, JSON.stringify(dataTr, null, 2));
        console.log(`✅ TR data saved to ${trFile}`);

        // Print summary
        console.log("\n📋 Champion Summary:");
        for (const c of playableChamps) {
            console.log(`   ${c.cost}g ${c.name} — [${c.traits.join(', ')}]`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

fetchData();