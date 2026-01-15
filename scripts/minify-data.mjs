// scripts/minify-data.mjs
import fs from 'fs';
import path from 'path';

// 1. Paths
const INPUT_FILE = path.join(process.cwd(), 'lib/tft-data-en.json');
const OUTPUT_FILE = path.join(process.cwd(), 'lib/set16-champions-en.json');

async function minify() {
    console.log("✂️  Reading massive JSON file...");

    try {
        const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
        const data = JSON.parse(rawData);

        // 2. Find Set 16
        // The big file usually has a "sets" object. We look for key "16" or the latest one.
        // Adjust "16" below if the key in your file is different (e.g. "TFTSet16")
        const set16 = data.sets['16'] || data.sets['TFTSet16'];

        if (!set16) {
            console.error("❌ Could not find Set 16 in the data! Available sets:", Object.keys(data.sets));
            return;
        }

        console.log(`✅ Found Set 16: "${set16.name}" containing ${set16.champions.length} units.`);

        // 3. Filter & Map (The Diet)
        const cleanChampions = set16.champions
            .filter(unit =>
                // Remove "fake" units like Target Dummies, Minions, or special boss units
                // Real units usually have a cost and traits.
                unit.cost < 10 &&
                unit.traits.length > 0 &&
                !unit.apiName.includes("TFT_TrainingDummy")
            )
            .map(unit => ({
                // ONLY keep what we need for the UI
                apiName: unit.apiName,   // Needed for Image URL
                name: unit.name,         // Display Name
                cost: unit.cost,         // Sorting/Coloring
                traits: unit.traits,     // Synergy Math
                id: unit.apiName.toLowerCase() // Pre-calculate for easier Image URLs
            }));

        // 4. Save
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanChampions, null, 2));

        const originalSize = fs.statSync(INPUT_FILE).size / 1024 / 1024;
        const newSize = fs.statSync(OUTPUT_FILE).size / 1024;

        console.log(`\n🎉 Success!`);
        console.log(`Original: ${originalSize.toFixed(2)} MB`);
        console.log(`Cleaned:  ${newSize.toFixed(2)} KB`);
        console.log(`Saved to: src/data/set16-champions.json`);

    } catch (error) {
        console.error("Error processing file:", error.message);
    }
}

minify();