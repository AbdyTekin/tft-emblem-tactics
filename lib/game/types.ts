/** Visual tier of an active trait, as the game colors it. */
export type TierStyle = 'bronze' | 'silver' | 'gold' | 'prismatic' | 'unique';

export type TraitKind = 'origin' | 'class' | 'unique';

export interface TraitTier {
    min: number;
    /** Inclusive upper bound; null means "and above". */
    max: number | null;
    style: TierStyle;
}

export interface TraitData {
    key: string;
    apiName: string;
    kind: TraitKind;
    /** Sorted by `min`. Ranges can overlap for special traits (Rival); see `activeTier`. */
    tiers: TraitTier[];
    /** Extra team slots granted once the trait reaches `min` (Riftbeast 10: +2). */
    teamSize?: { min: number; bonus: number };
    icon: string;
    names: { en: string; tr: string };
    emblem: { apiName: string; icon: string; recipe: string[] | null } | null;
}

export interface Champion {
    apiName: string;
    /** Lowercase apiName, stable React key. */
    id: string;
    /** Units sharing a unitId can't be on the same board (all Lux variants share one). */
    unitId: string;
    /** English display name; also used for matching and search. */
    name: string;
    names: { en: string; tr: string };
    cost: number;
    traits: string[];
    plannerCode: number;
    squareIcon?: string;
    tileIcon?: string;
}

export interface SetData {
    meta: { set: number; mutator: string; patch: string; channel: string };
    traits: TraitData[];
    champions: Champion[];
}
