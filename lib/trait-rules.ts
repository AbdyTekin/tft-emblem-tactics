// Transitional view of the generated trait data in the shape the current solver expects.
// Removed together with lib/solver.ts once the new solver lands.
import { EMBLEM_TRAITS, TRAITS } from '@/lib/game/data';
import { breakpoints } from '@/lib/game/traits';

export type TraitType = 'Origin' | 'Class' | 'Unique';

export interface TraitRule {
    type: TraitType;
    breakpoints: number[];
    hasEmblem: boolean;
}

const TYPES = { origin: 'Origin', class: 'Class', unique: 'Unique' } as const;

export const TRAIT_RULES: Record<string, TraitRule> = Object.fromEntries(
    TRAITS.map(t => [t.key, { type: TYPES[t.kind], breakpoints: breakpoints(t), hasEmblem: t.emblem !== null }]),
);

export const getEmblemTraits = () => [...EMBLEM_TRAITS];
