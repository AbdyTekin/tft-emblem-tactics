import type { TeamEvaluation } from '@/lib/game/evaluate';
import { TRAIT_SCORE_SCALE, UNLOCK_SCORE_COST, unlockDifficultyFor } from '@/lib/game/rules';
import type { Champion } from '@/lib/game/types';
import type { Strategy, TeamMetrics } from '@/lib/solver/types';

export function distinctEmblemTraits(emblems: readonly string[]): string[] {
    return [...new Set(emblems)];
}

export function teamMetrics(
    evaluation: TeamEvaluation,
    team: readonly Champion[],
    emblems: readonly string[],
    level = 8,
): TeamMetrics {
    const active = evaluation.traits.filter(t => t.style !== null);
    const originsAndClasses = active.filter(t => t.kind !== 'unique');
    const byTrait = new Map(evaluation.traits.map(t => [t.trait, t]));
    const distinct = distinctEmblemTraits(emblems);
    const first = distinct.length ? byTrait.get(distinct[0]) : undefined;

    return {
        bronze: active.filter(t => t.style === 'bronze').length,
        activeTraits: originsAndClasses.length,
        goldPlus: originsAndClasses.filter(t => t.style === 'gold' || t.style === 'prismatic').length,
        emblemTraitsActive: distinct.filter(e => byTrait.get(e)?.style).length,
        vertical: distinct.length ? { trait: distinct[0], count: first?.count ?? 0, style: first?.style ?? null } : null,
        unlockDifficulty: team.reduce((sum, c) => sum + unlockDifficultyFor(c, level), 0),
        cost: team.reduce((sum, c) => sum + c.cost, 0),
    };
}

/**
 * Ranking key, compared element by element (higher wins):
 * - Vertical: tier of each emblem trait in pick order, then unlock-adjusted active traits,
 *   gold+ traits, lower unlock difficulty, total cost.
 * - Bronze For Life: emblem traits active, unlock-adjusted bronze traits, active traits,
 *   lower unlock difficulty, total cost.
 * Unlock difficulty slightly discounts secondary traits (0.15 trait per hardness point) so boards
 * packed with hard or out-of-level unlocks don't crowd out realistic comps, while never blocking
 * an emblem vertical breakpoint.
 */
export function teamScore(strategy: Strategy, metrics: TeamMetrics, evaluation: TeamEvaluation, emblems: readonly string[]): number[] {
    const penalty = metrics.unlockDifficulty * UNLOCK_SCORE_COST;
    if (strategy === 'Vertical') {
        const tiers = distinctEmblemTraits(emblems).map(e => {
            const state = evaluation.traits.find(t => t.trait === e);
            return state?.style ? state.tierIndex + 1 : 0;
        });
        return [
            ...tiers,
            metrics.activeTraits * TRAIT_SCORE_SCALE - penalty,
            metrics.goldPlus,
            -metrics.unlockDifficulty,
            metrics.cost,
        ];
    }
    return [
        metrics.emblemTraitsActive,
        metrics.bronze * TRAIT_SCORE_SCALE - penalty,
        metrics.activeTraits,
        -metrics.unlockDifficulty,
        metrics.cost,
    ];
}

/** Negative when `a` ranks above `b`. */
export function compareScores(a: readonly number[], b: readonly number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (b[i] ?? 0) - (a[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}
