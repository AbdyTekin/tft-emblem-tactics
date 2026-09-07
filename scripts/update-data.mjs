// scripts/update-data.mjs
// Fetches TFT champion data from Community Dragon (latest or pbe)
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const usePbe = args.includes('--pbe');
const setArg = args.find(arg => arg.startsWith('--set='));
const SET_NUMBER = setArg ? parseInt(setArg.split('=')[1], 10) : 18;

const BASE_URL = usePbe 
    ? "https://raw.communitydragon.org/pbe/cdragon/tft" 
    : "https://raw.communitydragon.org/latest/cdragon/tft";

const URL_EN = `${BASE_URL}/en_us.json`;
const URL_TR = `${BASE_URL}/tr_tr.json`;
const OUTPUT_DIR = path.join(process.cwd(), 'lib');

function normalizeAssetPath(p) {
    if (!p || p.toLowerCase() === 'none') return undefined;
    return p.toLowerCase().replace(/\.tex$/, '.png');
}

async function fetchData() {
    console.log(`🔥 Fetching TFT Set ${SET_NUMBER} data from Community Dragon (${usePbe ? 'PBE' : 'Latest'})...`);

    try {
        console.log("📥 Fetching EN data...");
        const resEn = await fetch(URL_EN);
        if (!resEn.ok) throw new Error(`Failed to fetch EN: ${resEn.statusText}`);
        const dataEn = await resEn.json();

        let setEn = null;
        for (const [, val] of Object.entries(dataEn.setData)) {
            if (val.number === SET_NUMBER || val.mutator === `TFTSet${SET_NUMBER}`) {
                setEn = val;
                break;
            }
        }

        if (!setEn) {
            throw new Error(`Set ${SET_NUMBER} not found in CDragon data!`);
        }

        console.log(`✅ Found Set ${SET_NUMBER}: "${setEn.name}" (mutator: ${setEn.mutator})`);
        console.log(`   Total champions: ${setEn.champions ? setEn.champions.length : 0}`);

        const playableChamps = (setEn.champions || [])
            .filter(c => c.traits && c.traits.length > 0)
            .map(c => {
                const squareIcon = normalizeAssetPath(c.squareIcon);
                const icon = normalizeAssetPath(c.icon);
                return {
                    apiName: c.apiName,
                    name: c.name,
                    cost: c.cost,
                    traits: c.traits.map(t => t.replace(/\./g, '')),
                    id: c.apiName.toLowerCase(),
                    ...(squareIcon ? { squareIcon } : {}),
                    ...(icon ? { icon } : {})
                };
            })
            .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

        console.log(`   Playable champions (with traits): ${playableChamps.length}`);

        if (playableChamps.length < 20) {
            console.warn(`\n⚠️  WARNING: Only ${playableChamps.length} playable champion(s) found for Set ${SET_NUMBER}. Data on Community Dragon may be incomplete!`);
        }

        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

        const champFile = path.join(OUTPUT_DIR, `set${SET_NUMBER}-champions.json`);
        fs.writeFileSync(champFile, JSON.stringify(playableChamps, null, 2));
        console.log(`✅ Champion data saved to ${champFile}`);

        console.log("📥 Fetching TR data...");
        const resTr = await fetch(URL_TR);
        if (!resTr.ok) throw new Error(`Failed to fetch TR: ${resTr.statusText}`);
        const dataTr = await resTr.json();

        const trFile = path.join(OUTPUT_DIR, 'tft-data-tr.json');
        fs.writeFileSync(trFile, JSON.stringify(dataTr, null, 2));
        console.log(`✅ TR data saved to ${trFile}`);

        console.log("\n📋 Champion Summary:");
        for (const c of playableChamps) {
            console.log(`   ${c.cost}g ${c.name} — [${c.traits.join(', ')}]`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

fetchData();