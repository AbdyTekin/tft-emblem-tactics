import { getTrait } from '@/lib/game/data';
import type { TierStyle, TraitData, TraitTier } from '@/lib/game/types';

/**
 * The tier that is active at `count`, or null below the first breakpoint.
 * When ranges overlap (Rival lists 1–1 bronze, 1+ gold and 2+ gold), the most specific one wins:
 * the highest `min`, then the smallest `max`.
 */
export function activeTier(trait: TraitData, count: number): { index: number; tier: TraitTier } | null {
    let best: { index: number; tier: TraitTier } | null = null;
    for (let index = 0; index < trait.tiers.length; index++) {
        const tier = trait.tiers[index];
        if (count < tier.min || (tier.max !== null && count > tier.max)) continue;
        if (
            !best ||
            tier.min > best.tier.min ||
            (tier.min === best.tier.min && (tier.max ?? Infinity) < (best.tier.max ?? Infinity))
        ) {
            best = { index, tier };
        }
    }
    return best;
}

/** Distinct breakpoints of a trait, ascending. */
export function breakpoints(trait: TraitData): number[] {
    return [...new Set(trait.tiers.map(t => t.min))];
}

/** Style shown for `count` units of `traitKey`, or null when the trait is inactive (or unknown). */
export function tierStyle(traitKey: string, count: number): TierStyle | null {
    const trait = getTrait(traitKey);
    return trait ? activeTier(trait, count)?.tier.style ?? null : null;
}

/** The next breakpoint above `count`, or null at the top tier. */
export function nextBreakpoint(trait: TraitData, count: number): number | null {
    return breakpoints(trait).find(b => b > count) ?? null;
}

/** Display order: prismatic first, unique last. */
export const STYLE_RANK: Record<TierStyle, number> = { prismatic: 4, gold: 3, silver: 2, bronze: 1, unique: 0 };
