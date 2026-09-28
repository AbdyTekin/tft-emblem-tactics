// Set 18 mechanics that the generated data can't express. Each rule quotes the in-game text it follows.
import { TRAITS, getTrait } from '@/lib/game/data';
import type { Champion } from '@/lib/game/types';

/** "Elder Dragon takes up 2 team slots and grants +2 to the Riftbeast trait." (Apex Predator) */
export const ELDER_DRAGON = 'DA_18_ElderDragon';
export const RIFTBEAST = 'Riftbeast';

/** "An Avatar's chosen Trait is counted twice for Trait bonuses." */
export const AVATAR = 'Avatar';

/**
 * Rival: "Only active while fielding 1 Rival." The Rivals augment lets Rengar and Kha'Zix be fielded
 * together "with no penalties".
 */
export const RIVAL = 'Rival';

/** "Takedowns evolve Kha'Zix, permanently granting him your choice of Executioner, Rapidfire, Ravager, or Spellweaver." */
export const KHAZIX = 'DA_18_KhaZix';
export const KHAZIX_EVOLUTIONS = ['Executioner', 'Rapidfire', 'Ravager', 'Spellweaver'] as const;

/** A unit holds at most three items, so at most three emblems. */
export const MAX_ITEMS_PER_UNIT = 3;

/** The client's team planner holds 10 units. */
export const PLANNER_MAX_UNITS = 10;

export function unitSlots(champion: Champion): number {
    return champion.apiName === ELDER_DRAGON ? 2 : 1;
}

/** How much a unit adds to `trait` (0 when it doesn't have it). */
export function traitContribution(champion: Champion, trait: string): number {
    if (!champion.traits.includes(trait)) return 0;
    if (champion.apiName === ELDER_DRAGON && trait === RIFTBEAST) return 2;
    if (champion.traits.includes(AVATAR) && trait !== AVATAR) return 2;
    return 1;
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
    // best[a] = fewest slots reaching exactly min(a, target) trait count
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
 * Team size for a board, including trait bonuses (Riftbeast 10: +2). A bonus only applies if the units
 * that reach its threshold fit on the board *before* it: you can't place a unit into the slots it unlocks.
 * `emblemCounts` holds emblems that have a holder, since they add to traits without taking slots.
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
export function isTraitSuppressed(trait: string, count: number, options: { rivalsAugment?: boolean } = {}): boolean {
    return trait === RIVAL && count > 1 && !options.rivalsAugment;
}

/** Evolved Kha'Zix variants (same unit, one extra trait), used when the player plans for his evolution. */
export function khazixVariants(khazix: Champion): Champion[] {
    return KHAZIX_EVOLUTIONS.map(trait => {
        const names = getTrait(trait)?.names ?? { en: trait, tr: trait };
        return {
            ...khazix,
            apiName: `${khazix.apiName}:${trait}`,
            id: `${khazix.id}-${trait.toLowerCase()}`,
            name: `${khazix.name} (${names.en})`,
            names: { en: `${khazix.names.en} (${names.en})`, tr: `${khazix.names.tr} (${names.tr})` },
            traits: [...khazix.traits, trait],
        };
    });
}
