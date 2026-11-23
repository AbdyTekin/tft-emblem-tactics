/** Visual tier of an active trait, as the game colors it. */
export type TierStyle = 'bronze' | 'silver' | 'gold' | 'prismatic' | 'unique';

export type TraitKind = 'origin' | 'class' | 'unique';

/** Estimated in-game unlock difficulty: 1 = easy, 2 = medium, 3 = hard, 4 = extreme. */
export type UnlockDifficulty = 1 | 2 | 3 | 4;

export interface UnlockInfo {
    difficulty: UnlockDifficulty;
    /** Minimum player level required to unlock, when the game enforces one. */
    levelRequired?: number;
    /** Localized in-game unlock condition. */
    condition: { en: string; tr: string };
}

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
    /** Sorted by `min`. */
    tiers: TraitTier[];
    /** Extra team slots granted once the trait reaches `min`, when a set has such a trait. */
    teamSize?: { min: number; bonus: number };
    icon: string;
    names: { en: string; tr: string };
    emblem: { apiName: string; icon: string; recipe: string[] | null } | null;
}

export interface Champion {
    apiName: string;
    /** Lowercase apiName, stable React key. */
    id: string;
    /** Units sharing a unitId can't be on the same board (e.g. K/DA & True Damage Akali, Sona variants). */
    unitId: string;
    /** English display name; also used for matching and search. */
    name: string;
    names: { en: string; tr: string };
    cost: number;
    traits: string[];
    plannerCode: number;
    squareIcon?: string;
    tileIcon?: string;
    /** Present on the 32 Set 19 champions that start locked and require an in-game quest. */
    unlock?: UnlockInfo;
}

export interface SetData {
    meta: { set: number; mutator: string; patch: string; channel: string };
    traits: TraitData[];
    champions: Champion[];
}
