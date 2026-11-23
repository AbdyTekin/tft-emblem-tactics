// scripts/update-data.mjs
// Generates lib/data/set<N>.json (champions, traits, emblems, unlock conditions, team-planner codes)
// from MetaTFT's Set 19 lookup JSONs and verifies/resolves icon paths against CommunityDragon's
// standalone TFT client export (explore.communitydragon.org/tft/).
//
//   node scripts/update-data.mjs            fetch PBE data and rewrite lib/data/set19.json
//   node scripts/update-data.mjs --check    exit 1 if live/PBE data differs from the committed file
//   node scripts/update-data.mjs --latest   use the live channel instead of PBE
//   node scripts/update-data.mjs --offline  reuse the download cache in .cache/set19
//
// Game mechanics that the generated data can't express (Baron Nashor's two slots, K/DA star-level
// counting, Sona Producer variants, Akali exclusivity, unlock hardness scoring) live in lib/game/rules.ts.
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const SET = Number(args.find(a => a.startsWith('--set='))?.split('=')[1] ?? 19);
const CHANNEL = flag('latest') ? 'latest' : 'pbe';
const CHECK = flag('check');
const OFFLINE = flag('offline');

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'lib', 'data', `set${SET}.json`);
const CACHE_DIR = path.join(ROOT, '.cache', `set${SET}`, CHANNEL);
const METATFT = `https://data.metatft.com/lookups/TFTSet${SET}_${CHANNEL}`;
const CDRAGON_TFT = `https://explore.communitydragon.org/tft/${CHANNEL}`;

// Origin/class split isn't consistently marked on Set 19 bands; unique traits come from their style.
const KINDS = {
    19: {
        origin: [
            'Beach Pop', 'Classical', 'EDM', 'Gu Feng', 'Heartsteel', 'Hyperpop', 'Illbeats',
            'Ionic Spark', 'Jazz', 'K/DA', 'Pentakill', 'R&B', 'Rock', 'True Damage',
        ],
        class: [
            'Arcanist', 'Bodyguard', 'Choreographer', 'Collab', 'Encore', 'Frontman', 'Hitmaker',
            'Juggernaut', 'Manager', 'Prodigy', 'Renegade', 'Slayer', 'Swiftstriker', 'Trickshot',
        ],
    },
};

// Riot's PBE asset for Beach Pop still carries a placeholder 0-300 tier; fill in the live breakpoints
// until the exported asset replaces it.
const TIER_OVERRIDES = {
    19: {
        DA_OceanSong19: [
            { min: 3, max: 4, style: 'bronze' },
            { min: 5, max: 6, style: 'silver' },
            { min: 7, max: null, style: 'gold' },
        ],
    },
};

// Estimated in-game unlock difficulty for Set 19's 32 unlockable champions:
//   1 = Easy    (natural trait/item condition hit during normal play)
//   2 = Medium  (deliberate stage/econ/trait commitment or 2-star 4-cost)
//   3 = Hard    (deep vertical + exclusivity, 85g econ, streak at Lv8+, or Lv9 8-trait web)
//   4 = Extreme (multi-stage chase capstone: Baron Nashor 5 instruments + 60k Malzahar dmg; Lv10 Sona)
const UNLOCK_DIFFICULTY = {
    19: {
        // Tier 1: Easy
        DA_Kobuko19: 1,
        DA_Ashe19: 1,
        DA_Lulu19: 1,
        DA_Samira19: 1,
        DA_Tristana19: 1,
        DA_Evelynn19: 1,
        DA_Tibbers19: 1,
        DA_Alistar19: 1,
        DA_Alune19: 1,
        DA_Jinx19: 1,
        DA_Kayle19: 1,
        DA_Vayne19: 1,
        DA_Yasuo19: 1,
        DA_Zac19: 1,
        DA_Vladimir19: 1,
        // Tier 2: Medium
        DA_Seraphine19_Indie: 2,
        DA_Thresh19: 2,
        DA_Wukong19: 2,
        DA_Aphelios19: 2,
        DA_Gwen19: 2,
        DA_Janna19: 2,
        DA_LeeSin19: 2,
        DA_Mordekaiser19: 2,
        DA_Taliyah19: 2,
        DA_Teemo19: 2,
        // Tier 3: Hard
        DA_AkaliKDA19: 3,
        DA_Akali_TrueDamage19: 3,
        DA_Pyke19: 3,
        DA_Rakan19: 3,
        DA_Smeech19: 3,
        // Tier 4: Extreme
        DA_BaronNashor19: 4,
        DA_Sona19: 4,
    },
};

// Fallback Turkish unlock text for PBE strings not yet translated in tr_tr.json (only used when tr === en).
const UNLOCK_TR_FALLBACK = {
    DA_Lulu19: 'Özellik etkinken Hiperpop şampiyonların 10 kez yetenek kullansın.',
    DA_Samira19: 'Bir Klasik, İsyankâr veya Trickshot şampiyonunda 2 eşya.',
    DA_Tristana19: 'Hiperpop etkinken 5 skor al.',
    DA_Jinx19: 'Bir Ionic Spark veya Prodüktör şampiyonunda 3 eşya.',
    DA_Kayle19: '4 farklı Pentakill veya Atik Vurucu şampiyonu.',
    DA_Thresh19: 'Rakipler Klasik tarafından toplam 275 saniye büyülenmeli.',
    DA_Yasuo19: 'True Damage veya Biçici şampiyonlarında 6 farklı yıldız seviyesi.',
    DA_Mordekaiser19: '10 farklı Pentakill yıldız seviyesi.',
    DA_Pyke19: 'Çatışma sonunda 85 veya daha fazla altına sahip ol.',
    DA_Taliyah19: 'Her bedelden bir şampiyon çatışmaya Plaj Popu hücresinde başlasın.',
    DA_Vladimir19: 'Savaş alanının ön 2 sırasında yalnızca 1 şampiyon bulunsun.',
};

// Mutually exclusive champions that share a unitId and need distinct display names & portrait folders.
const EXCLUSIVE_VARIANTS = {
    19: {
        DA_AkaliKDA19: {
            unitId: 'DA_Akali19',
            name: { en: 'Akali (K/DA)', tr: 'Akali (K/DA)' },
            iconFolder: '/champions/akali_kda/',
        },
        DA_Akali_TrueDamage19: {
            unitId: 'DA_Akali19',
            name: { en: 'Akali (True Damage)', tr: 'Akali (True Damage)' },
            iconFolder: '/champions/akali_truedamage/',
        },
    },
};

// MetaTFT Set 19 style enum (differs from legacy LoL CDragon: 4=gold, 5=prismatic, 6=unique).
const STYLES = { 1: 'bronze', 3: 'silver', 4: 'gold', 5: 'prismatic', 6: 'unique' };
const OPEN_ENDED = 300; // Set 19 uses 300 or 1000 for open-ended upper bounds

class DataError extends Error {}
const fail = message => { throw new DataError(message); };

async function loadText(file, url) {
    const cached = path.join(CACHE_DIR, file);
    if (!OFFLINE) {
        const res = await fetch(url);
        if (!res.ok) fail(`GET ${url} -> ${res.status} ${res.statusText}`);
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
    } else if (!fs.existsSync(cached)) {
        fail(`--offline: ${cached} is missing; run once without --offline`);
    }
    return fs.readFileSync(cached, 'utf8');
}

async function loadJson(file, url) {
    return JSON.parse(await loadText(file, url));
}

function validateAssetPath(p, what) {
    if (!/^[a-z0-9_./-]+\.png$/.test(p) || p.includes('..') || p.startsWith('/')) {
        fail(`unexpected asset path for ${what}: ${p}`);
    }
    return p;
}

/** Builds a lookup from lowercase PNG basename -> matching paths in CommunityDragon's TFT export. */
function buildAssetIndex(filesTxt) {
    const byBase = new Map();
    for (const line of filesTxt.split(/\r?\n/)) {
        const p = line.trim();
        if (!p.endsWith('.png')) continue;
        const base = p.slice(p.lastIndexOf('/') + 1, -4).toLowerCase();
        const list = byBase.get(base) ?? [];
        list.push(p);
        byBase.set(base, list);
    }
    return byBase;
}

function resolveIcon(assetIndex, name, what, { prefer, require } = {}) {
    if (!name) fail(`missing icon name for ${what}`);
    const matches = assetIndex.get(name.toLowerCase()) ?? [];
    if (matches.length === 0) fail(`icon ${name} for ${what} not found in CommunityDragon TFT export`);
    let chosen;
    if (require) {
        chosen = matches.find(p => p.includes(require)) ?? fail(`icon ${name} for ${what} has no match in ${require}`);
    } else if (prefer) {
        chosen = matches.find(p => p.includes(prefer)) ?? matches[0];
    } else {
        chosen = matches[0];
    }
    return validateAssetPath(chosen, what);
}

/**
 * Normalizes Set 19 trait breakpoints:
 * - Applies explicit overrides for PBE placeholder traits (Beach Pop).
 * - Collapses A-Side/B-Side and Prismatic-Quest duplicate `minUnits` rows (e.g. Heartsteel 7,
 *   Pentakill 7, True Damage 3 & 5) to the non-quest base tier and clean non-overlapping ranges.
 */
function buildTiers(trait) {
    const override = TIER_OVERRIDES[SET]?.[trait.apiName];
    if (override && trait.effects?.length === 1 && trait.effects[0].minUnits === 0) {
        return override.map(t => ({ ...t }));
    }

    const effects = (trait.effects ?? []).filter(e => e.minUnits != null && e.minUnits > 0);
    if (effects.length === 0) return [];

    // When multiple effects share a minUnits (e.g. Gold + quest-gated Prismatic at 7, or A/B-Side),
    // keep the lowest non-quest style (bronze < silver < gold < prismatic) since quest Prismatic
    // requires a separate Prismatic Tour augment rather than unit count alone.
    const byMin = new Map();
    for (const e of effects) {
        const style = STYLES[e.style] ?? fail(`trait ${trait.name}: unknown tier style ${e.style}`);
        const prev = byMin.get(e.minUnits);
        if (!prev || e.style < prev.rawStyle) {
            byMin.set(e.minUnits, { min: e.minUnits, rawMax: e.maxUnits, style, rawStyle: e.style });
        }
    }

    const sorted = [...byMin.values()].sort((a, b) => a.min - b.min);
    return sorted.map((tier, i) => {
        const next = sorted[i + 1];
        const max = next
            ? next.min - 1
            : (tier.rawMax == null || tier.rawMax >= OPEN_ENDED || tier.rawMax < tier.min ? null : tier.rawMax);
        return { min: tier.min, max, style: tier.style };
    });
}

function buildTraits(en, tr, champions, assetIndex) {
    const kinds = KINDS[SET] ?? fail(`no KINDS entry for set ${SET}`);
    const used = new Set(champions.flatMap(c => c.traits));
    const trNames = new Map(tr.traits.map(t => [t.apiName, t.name]));
    const traits = [];

    for (const t of en.traits) {
        if (!used.has(t.name)) continue; // skip Rising Star, Superstar, Mystical Instrument
        const tiers = buildTiers(t);
        if (tiers.length === 0) fail(`trait ${t.name} has no breakpoints but champions use it`);

        const kind = tiers.every(tier => tier.style === 'unique')
            ? 'unique'
            : Object.keys(kinds).find(k => kinds[k].includes(t.name)) ?? fail(`trait ${t.name} is missing from KINDS[${SET}]`);

        traits.push({
            key: t.name,
            apiName: t.apiName,
            kind,
            tiers,
            icon: resolveIcon(assetIndex, t.icon, t.name, { prefer: '/iconmask/' }),
            names: { en: t.name, tr: trNames.get(t.apiName) ?? fail(`no Turkish name for trait ${t.apiName}`) },
            emblem: null,
        });
    }

    for (const name of used) if (!traits.some(t => t.key === name)) fail(`champion trait ${name} is not defined`);
    return traits;
}

function attachEmblems(traits, en, assetIndex) {
    const itemsByApi = new Map(en.items.map(i => [i.apiName, i]));
    const traitsByApi = new Map(traits.map(t => [t.apiName, t]));

    for (const item of en.items) {
        const isEmblem = item.tags?.includes('Emblem') || /Emblem$/i.test(item.name ?? '');
        if (!isEmblem) continue;
        const traitApi = item.associatedTraits?.[0] ?? fail(`emblem ${item.apiName} (${item.name}) has no associatedTraits`);
        const trait = traitsByApi.get(traitApi) ?? fail(`emblem ${item.apiName} (${item.name}) matches no trait (${traitApi})`);
        const recipe = item.composition?.length
            ? item.composition.map(c => itemsByApi.get(c)?.name ?? fail(`unknown component ${c}`))
            : null;
        if (trait.emblem && trait.emblem.recipe && !recipe) continue;
        trait.emblem = {
            apiName: item.apiName,
            icon: resolveIcon(assetIndex, item.icon, item.apiName, { prefer: '/iconitem/' }),
            recipe,
        };
    }
}

function extractUnlockText(unlock) {
    const parts = (unlock.conditions ?? []).map(c => c.text?.trim()).filter(Boolean);
    return (parts.length ? parts.join(' / ') : (unlock.manual_conditions ?? '').trim());
}

function buildUnlock(unit, trUnit) {
    if (!unit.unlock) return undefined;
    const difficulty = UNLOCK_DIFFICULTY[SET]?.[unit.apiName]
        ?? fail(`no UNLOCK_DIFFICULTY[${SET}] entry for unlockable champion ${unit.apiName} (${unit.name})`);

    const enText = extractUnlockText(unit.unlock);
    if (!enText) fail(`empty unlock condition for ${unit.apiName}`);
    const rawTr = trUnit?.unlock ? extractUnlockText(trUnit.unlock) : '';
    const trText = rawTr && rawTr !== enText
        ? rawTr
        : (UNLOCK_TR_FALLBACK[unit.apiName] ?? fail(`missing Turkish unlock text for ${unit.apiName}: ${enText}`));

    const textLevel = enText.match(/at Level (\d+)\+/i);
    const levelRequired = unit.unlock.levelRequired ?? (textLevel ? Number(textLevel[1]) : undefined);

    return {
        difficulty,
        ...(levelRequired ? { levelRequired } : {}),
        condition: { en: enText, tr: trText },
    };
}

function buildChampions(en, tr, assetIndex) {
    const variants = EXCLUSIVE_VARIANTS[SET] ?? {};
    const trByApi = new Map(tr.units.map(u => [u.apiName, u]));

    const champions = [];
    for (const u of en.units) {
        // Real playable shop units (both base and unlockable) carry `poolCost`; summons/dupes don't.
        if (u.poolCost == null || !u.traits?.length) continue;
        const trUnit = trByApi.get(u.apiName);
        if (!trUnit?.name) fail(`no Turkish name for ${u.apiName}`);
        if (typeof u.codeValue !== 'number') fail(`no team planner code for ${u.apiName}`);

        const variant = variants[u.apiName];
        const names = variant?.name ?? { en: u.name, tr: trUnit.name };
        const squareIcon = resolveIcon(assetIndex, u.squareIcon ?? u.tileIcon, u.apiName, variant?.iconFolder ? { require: variant.iconFolder } : undefined);
        const unlock = buildUnlock(u, trUnit);

        champions.push({
            apiName: u.apiName,
            id: u.apiName.toLowerCase(),
            unitId: variant?.unitId ?? u.apiName,
            name: names.en,
            names,
            cost: u.cost,
            traits: [...u.traits],
            plannerCode: u.codeValue,
            squareIcon,
            ...(unlock ? { unlock } : {}),
        });
    }

    if (champions.length < 20) fail(`only ${champions.length} champions found; the set data looks incomplete`);
    return champions.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
}

async function main() {
    const en = await loadJson('en_us.json', `${METATFT}_en_us.json`);
    const tr = await loadJson('tr_tr.json', `${METATFT}_tr_tr.json`);
    const filesTxt = await loadText('files.exported.txt', `${CDRAGON_TFT}/cdragon/files.exported.txt`);
    const assetIndex = buildAssetIndex(filesTxt);

    const champions = buildChampions(en, tr, assetIndex);
    const traits = buildTraits(en, tr, champions, assetIndex);
    attachEmblems(traits, en, assetIndex);

    const releaseMatch = String(en._metadata?.release ?? '').match(/rls-(\d+\.\d+)/);
    const patch = releaseMatch ? releaseMatch[1] : `${SET}.1`;

    const output = {
        meta: {
            set: SET,
            mutator: en._metadata?.set ?? `TFTSet${SET}`,
            patch,
            channel: CHANNEL,
        },
        traits: traits.sort((a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key)),
        champions,
    };
    const json = JSON.stringify(output, null, 2) + '\n';

    if (CHECK) {
        const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8').replace(/\r\n/g, '\n') : '';
        if (current === json) {
            console.log(`${path.relative(ROOT, OUT_FILE)} matches Set ${SET} ${CHANNEL} (${output.meta.patch}).`);
            return;
        }
        console.error(`${path.relative(ROOT, OUT_FILE)} is out of date with Set ${SET} ${CHANNEL} (${output.meta.patch}). Run \`npm run data:update\`.`);
        process.exitCode = 1;
        return;
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, json);
    const emblems = traits.filter(t => t.emblem).length;
    const unlockables = champions.filter(c => c.unlock).length;
    console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}: ${champions.length} champions (${unlockables} unlockable), ${traits.length} traits, ${emblems} emblems (patch ${output.meta.patch}, ${CHANNEL}).`);
}

main().catch(error => {
    console.error(error instanceof DataError ? `Data error: ${error.message}` : error);
    process.exitCode = 1;
});
