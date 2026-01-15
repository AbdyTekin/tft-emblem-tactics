// scripts/update-data.mjs
import fs from 'fs';
import path from 'path';

const URL = "https://raw.communitydragon.org/latest/cdragon/tft/tr_tr.json";
const OUTPUT_DIR = path.join(process.cwd(), 'lib');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'tft-data-tr.json');

async function fetchData() {
    console.log("🔥 Fetching latest TFT data from Community Dragon...");
    try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

        const data = await response.json();

        // We only care about the latest set (Set 16 for you, but dynamically finds the last one)
        // Note: 'sets' is usually an object or array in this JSON. 
        // We save the WHOLE file so the AI can parse it, or you can filter here.

        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
        console.log(`✅ Data saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

fetchData();