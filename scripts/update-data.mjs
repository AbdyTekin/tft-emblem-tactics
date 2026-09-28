// scripts/update-data.mjs
// Generates lib/data/set<N>.json (champions, traits, emblems, team-planner codes) from CommunityDragon.
//
//   node scripts/update-data.mjs            fetch live data and rewrite the file
//   node scripts/update-data.mjs --check    exit 1 if live data differs from the committed file
//   node scripts/update-data.mjs --pbe      use the PBE channel (next patch / next set)
//   node scripts/update-data.mjs --offline  reuse the download cache in .cache/cdragon
//   node scripts/update-data.mjs --set=19   another set (then update KINDS / EXCLUDED_CHAMPIONS below)
//
// Game mechanics that CommunityDragon doesn't encode (Lux counting twice, Elder Dragon's two slots,
// Rival exclusivity, emblem holders) live in lib/game/rules.ts, not here.
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const SET = Number(args.find(a => a.startsWith('--set='))?.split('=')[1] ?? 18);
const CHANNEL = flag('pbe') ? 'pbe' : 'latest';
const CHECK = flag('check');
const OFFLINE = flag('offline');

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'lib', 'data', `set${SET}.json`);
const CACHE_DIR = path.join(ROOT, '.cache', 'cdragon', CHANNEL);
const CDRAGON = `https://raw.communitydragon.org/${CHANNEL}`;

// Origin/class split isn't in the game data; unique traits are detected from their tier style.
const KINDS = {
    18: {
        origin: ['Blackthorn', 'Blossom', 'Coven', 'Elderwood', 'Fae', 'Flora Fatalis', 'Inferno', 'Lunar', 'Primal', 'Riftbeast', 'Solar', 'Sprykin'],
        class: ['Adaptor', 'Brawler', 'Defender', 'Executioner', 'Hunter', 'Invoker', 'Juggernaut', 'Rapidfire', 'Ravager', 'Spellweaver', 'Summoner', 'Vanguard'],
        // Carried by two champions but only active with one of them on the board (see rules.ts).
        unique: ['Rival'],
    },
};

// Planner-only entries that never reach a board. Base Lux has no regional trait: owning an Avatar
// turns every other Avatar in your shop into its trait, so the board always holds a variant.
const EXCLUDED_CHAMPIONS = { 18: ['DA_Lux18_Base'] };

const STYLES = { 1: 'bronze', 3: 'silver', 4: 'unique', 5: 'gold', 6: 'prismatic' };
const OPEN_ENDED = 1000; // CDragon uses 25000 for "and above"

class DataError extends Error {}
const fail = message => { throw new DataError(message); };

async function load(file, url) {
    const cached = path.join(CACHE_DIR, file);
    if (!OFFLINE) {
        const res = await fetch(url);
        if (!res.ok) fail(`GET ${url} -> ${res.status} ${res.statusText}`);
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
    } else if (!fs.existsSync(cached)) {
        fail(`--offline: ${cached} is missing; run once without --offline`);
    }
    return JSON.parse(fs.readFileSync(cached, 'utf8'));
}

// Asset paths are interpolated into image URLs, so only accept plain lowercase asset paths.
function assetPath(p, what) {
    if (!p) return undefined;
    const png = p.toLowerCase().replace(/\.tex$/, '.png');
    if (!/^assets\/[a-z0-9_./-]+\.png$/.test(png) || png.includes('..')) fail(`unexpected asset path for ${what}: ${p}`);
    return png;
}

function findSet(data) {
    const set = data.setData?.find(s => s.mutator === `TFTSet${SET}`);
    if (!set) fail(`TFTSet${SET} not found (available: ${data.setData?.map(s => s.mutator).join(', ')})`);
    return set;
}

function buildTraits(set, setTr, champions) {
    const kinds = KINDS[SET] ?? fail(`no KINDS entry for set ${SET}`);
    const used = new Set(champions.flatMap(c => c.traits));
    const trNames = new Map(setTr.traits.map(t => [t.apiName, t.name]));
    const traits = [];

    for (const t of set.traits) {
        const effects = t.effects.filter(e => e.minUnits != null);
        if (effects.length === 0) {
            if (used.has(t.name)) fail(`trait ${t.name} has no breakpoints but champions use it`);
            continue; // e.g. Eclipse: defined but carried by no unit
        }
        const tiers = effects
            .map(e => ({
                min: e.minUnits,
                max: e.maxUnits >= OPEN_ENDED ? null : e.maxUnits,
                style: STYLES[e.style] ?? fail(`trait ${t.name}: unknown tier style ${e.style}`),
            }))
            .sort((a, b) => a.min - b.min || (a.max ?? Infinity) - (b.max ?? Infinity));

        const kind = tiers.every(tier => tier.style === 'unique')
            ? 'unique'
            : Object.keys(kinds).find(k => kinds[k].includes(t.name)) ?? fail(`trait ${t.name} is missing from KINDS[${SET}]`);

        const teamSizeEffect = effects.find(e => typeof e.variables?.TeamSize === 'number');
        traits.push({
            key: t.name,
            apiName: t.apiName,
            kind,
            tiers,
            ...(teamSizeEffect ? { teamSize: { min: teamSizeEffect.minUnits, bonus: teamSizeEffect.variables.TeamSize } } : {}),
            icon: assetPath(t.icon, t.name),
            names: { en: t.name, tr: trNames.get(t.apiName) ?? fail(`no Turkish name for trait ${t.apiName}`) },
            emblem: null,
        });
    }

    for (const name of used) if (!traits.some(t => t.key === name)) fail(`champion trait ${name} is not defined`);
    return traits;
}

function attachEmblems(traits, data, set) {
    const setItems = new Set(set.items);
    const items = new Map(data.items.map(i => [i.apiName, i]));
    const pattern = new RegExp(`^DA_${SET}_Emblem`);

    for (const item of data.items) {
        if (!pattern.test(item.apiName) || !setItems.has(item.apiName)) continue;
        const traitName = item.name.replace(/ Emblem$/, '');
        const trait = traits.find(t => t.key === traitName) ?? fail(`emblem ${item.apiName} (${item.name}) matches no trait`);
        const recipe = item.composition?.length ? item.composition.map(c => items.get(c)?.name ?? fail(`unknown component ${c}`)) : null;
        // Some emblems exist twice (crafted and augment-granted); keep the craftable one.
        if (trait.emblem && trait.emblem.recipe && !recipe) continue;
        trait.emblem = { apiName: item.apiName, icon: assetPath(item.icon, item.apiName), recipe };
    }
}

function buildChampions(set, setTr, planner) {
    const excluded = new Set(EXCLUDED_CHAMPIONS[SET] ?? []);
    const trNames = new Map(setTr.champions.map(c => [c.apiName, c.name]));
    const plannerList = planner[`TFTSet${SET}`] ?? fail(`team planner has no TFTSet${SET} (keys: ${Object.keys(planner).join(', ')})`);
    const codes = new Map(plannerList.map(p => [p.character_id, p.team_planner_code]));
    // Lux variants aren't in the planner list; they import as the single planner Lux.
    const avatarEntry = plannerList.find(p => p.traits?.some(t => t.name === 'Avatar'));

    const champions = [];
    for (const c of set.champions) {
        if (!c.traits?.length || excluded.has(c.apiName)) continue;
        const isAvatar = c.traits.includes('Avatar');
        const planned = codes.get(c.apiName) ?? (isAvatar ? avatarEntry?.team_planner_code : undefined);
        if (planned === undefined) fail(`no team planner code for ${c.apiName}`);
        champions.push({
            apiName: c.apiName,
            id: c.apiName.toLowerCase(),
            // Units that can't share a board (Lux variants) share a unitId.
            unitId: isAvatar && avatarEntry ? avatarEntry.character_id : c.apiName,
            name: c.name,
            names: { en: c.name, tr: trNames.get(c.apiName) ?? fail(`no Turkish name for ${c.apiName}`) },
            cost: c.cost,
            traits: [...c.traits],
            plannerCode: planned,
            squareIcon: assetPath(c.squareIcon, c.apiName),
            tileIcon: assetPath(c.tileIcon, c.apiName),
        });
    }
    if (champions.length < 20) fail(`only ${champions.length} champions found; the set data looks incomplete`);
    return champions.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
}

async function main() {
    const meta = await load('content-metadata.json', `${CDRAGON}/content-metadata.json`);
    const en = await load('en_us.json', `${CDRAGON}/cdragon/tft/en_us.json`);
    const tr = await load('tr_tr.json', `${CDRAGON}/cdragon/tft/tr_tr.json`);
    const planner = await load('tftchampions-teamplanner.json', `${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/tftchampions-teamplanner.json`);

    const set = findSet(en);
    const setTr = findSet(tr);
    const champions = buildChampions(set, setTr, planner);
    const traits = buildTraits(set, setTr, champions);
    attachEmblems(traits, en, set);

    const output = {
        meta: {
            set: SET,
            mutator: set.mutator,
            patch: String(meta.version ?? '').split('.').slice(0, 2).join('.'),
            channel: CHANNEL,
        },
        traits: traits.sort((a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key)),
        champions,
    };
    const json = JSON.stringify(output, null, 2) + '\n';

    if (CHECK) {
        const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8').replace(/\r\n/g, '\n') : '';
        if (current === json) {
            console.log(`${path.relative(ROOT, OUT_FILE)} matches CommunityDragon ${CHANNEL} (${output.meta.patch}).`);
            return;
        }
        console.error(`${path.relative(ROOT, OUT_FILE)} is out of date with CommunityDragon ${CHANNEL} (${output.meta.patch}). Run \`npm run data:update\`.`);
        process.exitCode = 1;
        return;
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, json);
    const emblems = traits.filter(t => t.emblem).length;
    console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}: ${champions.length} champions, ${traits.length} traits, ${emblems} emblems (patch ${output.meta.patch}, ${CHANNEL}).`);
}

main().catch(error => {
    console.error(error instanceof DataError ? `Data error: ${error.message}` : error);
    process.exitCode = 1;
});
