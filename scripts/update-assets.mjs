// scripts/update-assets.mjs
// Downloads the images referenced by lib/data/set<N>.json from CommunityDragon and stores small WebP
// copies in public/assets, so the site serves every image itself (no third-party requests).
//
//   node scripts/update-assets.mjs           fetch missing images
//   node scripts/update-assets.mjs --force   re-fetch everything (after a patch changes art)
//
// Run it after `npm run data:update` whenever champions, traits or emblems change.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const SET = Number(args.find(a => a.startsWith('--set='))?.split('=')[1] ?? 18);
const FORCE = args.includes('--force');
const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'lib', 'data', `set${SET}.json`);
const OUT = path.join(ROOT, 'public', 'assets');
const CDRAGON = 'https://raw.communitydragon.org/latest/game/';

/** Must match lib/assets.ts. */
const slug = key => key.toLowerCase().replace(/[^a-z0-9]/g, '');

async function download(assetPath) {
    const res = await fetch(CDRAGON + assetPath);
    if (!res.ok) throw new Error(`GET ${assetPath} -> ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(`GET ${assetPath}: expected an image, got ${type}`);
    return Buffer.from(await res.arrayBuffer());
}

async function convert({ source, target, size }) {
    const file = path.join(OUT, target);
    if (!FORCE && fs.existsSync(file)) return 'kept';
    const image = await download(source);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(image).resize(size, size, { fit: 'cover' }).webp({ quality: 80, alphaQuality: 90 }).toFile(file);
    return 'written';
}

async function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const jobs = [
        ...data.champions.map(c => ({ source: c.squareIcon ?? c.tileIcon, target: `champions/${c.id}.webp`, size: 128 })),
        ...data.traits.map(t => ({ source: t.icon, target: `traits/${slug(t.key)}.webp`, size: 48 })),
        ...data.traits.filter(t => t.emblem).map(t => ({ source: t.emblem.icon, target: `emblems/${slug(t.key)}.webp`, size: 64 })),
        { source: 'assets/ux/tft/regionportals/icon/gold.png', target: 'ui/gold.webp', size: 32 },
    ];

    const results = { written: 0, kept: 0 };
    // A few at a time to stay polite to CommunityDragon
    for (let i = 0; i < jobs.length; i += 6) {
        const batch = await Promise.all(jobs.slice(i, i + 6).map(convert));
        for (const r of batch) results[r]++;
    }
    const bytes = jobs.reduce((sum, j) => sum + fs.statSync(path.join(OUT, j.target)).size, 0);
    console.log(`public/assets: ${results.written} written, ${results.kept} kept, ${(bytes / 1024).toFixed(0)} KB total.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
