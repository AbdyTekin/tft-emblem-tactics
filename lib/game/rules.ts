// Set 19 mechanics that the generated data can't express. Each rule quotes the in-game text it follows.
import { CHAMPIONS, TRAITS, getTrait } from '@/lib/game/data';
import type { Champion } from '@/lib/game/types';

/** "Baron Nashor takes up 2 team slots and is unstoppable." (One Monster Band) */
export const BARON_NASHOR = 'DA_BaronNashor19';

/**
 * "K/DA champions release new songs based on their total star level."
 * The planner doesn't track per-unit star levels and assumes 2-star late-game boards,
 * so each K/DA champion and held K/DA Emblem contributes 2 toward K/DA breakpoints.
 */
export const KDA = 'K/DA';
export const KDA_STAR_LEVEL = 2;

/** "When Sona is fielded, choose a band to feature, gaining their trait." (Producer) */
export const SONA = 'DA_Sona19';
export const SONA_BANDS = ['Heartsteel', 'Ionic Spark', 'K/DA', 'Pentakill', 'True Damage'] as const;

/** Extra unlock hardness added when a champion's unlock requires a higher level than the planned board. */
export const UNLOCK_LEVEL_PENALTY = 3;

/**
 * Scoring trade-off between traits and unlock difficulty (exact integer ratio: 3 / 20 = 0.15 per point).
 * - Easy unlock (1): -0.15 trait (worth taking for +1 trait, loses ties to base units)
 * - Medium unlock (2): -0.30 trait
 * - Hard unlock (3): -0.45 trait
 * - Extreme unlock (4): -0.60 trait
 * - Out-of-level unlock (+3): e.g. Lv10 Sona on a Lv8 board = 7 -> -1.05 trait
 */
export const TRAIT_SCORE_SCALE = 20;
export const UNLOCK_SCORE_COST = 3;

/** A unit holds at most three items, so at most three emblems. */
export const MAX_ITEMS_PER_UNIT = 3;

/** The client's team planner holds 10 units. */
export const PLANNER_MAX_UNITS = 10;

export function unitSlots(champion: Champion): number {
    return champion.apiName === BARON_NASHOR ? 2 : 1;
}

/** How much a unit adds to `trait` (0 when it doesn't have it). */
export function traitContribution(champion: Champion, trait: string): number {
    if (!champion.traits.includes(trait)) return 0;
    if (trait === KDA) return KDA_STAR_LEVEL;
    return 1;
}

/** How much one held emblem adds to `trait`. */
export function emblemContribution(trait: string): number {
    return trait === KDA ? KDA_STAR_LEVEL : 1;
}

/** Estimated unlock hardness of fielding `champion` on a board at `level` (0 for base shop units). */
export function unlockDifficultyFor(champion: Champion, level: number): number {
    if (!champion.unlock) return 0;
    const levelGap = champion.unlock.levelRequired && level < champion.unlock.levelRequired
        ? UNLOCK_LEVEL_PENALTY
        : 0;
    return champion.unlock.difficulty + levelGap;
}

export interface BoardSize {
    level: number;
    /** Tactician's Cape / Crown / Shield (+1 each), Cursed Crown (+2). */
    bonusTeamSize?: number;
}

/** Team slots before any trait bonus. */
export function baseTeamSize({ level, bonusTeamSize = 0 }: BoardSize): number {
    return level + bonusTeamSize;
}

/** Fewest board slots needed for `units` to add up to `target` (null when they can't). */
function minSlotsToReach(units: { slots: number; amount: number }[], target: number): number | null {
    if (target <= 0) return 0;
    const best: number[] = Array(target + 1).fill(Infinity);
    best[0] = 0;
    for (const unit of units) {
        for (let a = target; a >= 0; a--) {
            if (best[a] === Infinity) continue;
            const next = Math.min(target, a + unit.amount);
            best[next] = Math.min(best[next], best[a] + unit.slots);
        }
    }
    return best[target] === Infinity ? null : best[target];
}

/**
 * Team size for a board, including any trait team-size bonuses. A bonus only applies if the units
 * reaching its threshold fit on the board *before* it applies.
 */
export function teamSizeFor(
    team: readonly Champion[],
    size: BoardSize,
    emblemCounts: ReadonlyMap<string, number> = new Map(),
): number {
    const base = baseTeamSize(size);
    let total = base;
    for (const trait of TRAITS) {
        if (!trait.teamSize) continue;
        const contributors = team
            .filter(c => c.traits.includes(trait.key))
            .map(c => ({ slots: unitSlots(c), amount: traitContribution(c, trait.key) }));
        const needed = minSlotsToReach(contributors, trait.teamSize.min - (emblemCounts.get(trait.key) ?? 0));
        if (needed !== null && needed <= base) total += trait.teamSize.bonus;
    }
    return total;
}

/** True when a trait's count doesn't activate it because of a rule outside its breakpoints. */
export function isTraitSuppressed(): boolean {
    return false;
}

/** Sona (Producer) band variants (same unitId, one extra band trait), added when the player enables Producer planning. */
export function sonaVariants(sona: Champion): Champion[] {
    const slug = (band: string) => band.toLowerCase().replace(/[^a-z0-9]/g, '');
    return SONA_BANDS.map(band => {
        const names = getTrait(band)?.names ?? { en: band, tr: band };
        return {
            ...sona,
            apiName: `${sona.apiName}:${band}`,
            id: `${sona.id}-${slug(band)}`,
            name: `${sona.name} (${names.en})`,
            names: { en: `${sona.names.en} (${names.en})`, tr: `${sona.names.tr} (${names.tr})` },
            traits: [...sona.traits, band],
        };
    });
}

/** Every unit that can be planned; Sona's Producer band variants are added on request. */
export function candidatePool(options: { sonaProducer?: boolean }, pool: readonly Champion[] = CHAMPIONS): Champion[] {
    const sona = options.sonaProducer ? pool.find(c => c.apiName === SONA) : undefined;
    return sona ? [...pool, ...sonaVariants(sona)] : [...pool];
}
