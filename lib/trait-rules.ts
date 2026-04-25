export type TraitType = 'Origin' | 'Class' | 'Unique';

export interface TraitRule {
    type: TraitType;
    breakpoints: number[];
    hasEmblem: boolean;
    isPrismatic?: boolean;
}

export const TRAIT_RULES: Record<string, TraitRule> = {
    // ORIGINS
    "Dark Star": { type: 'Origin', breakpoints: [2, 4, 6, 9], hasEmblem: true, isPrismatic: true },
    "Meeple": { type: 'Origin', breakpoints: [3, 5, 7, 10], hasEmblem: true, isPrismatic: true },
    "Space Groove": { type: 'Origin', breakpoints: [1, 3, 5, 7, 10], hasEmblem: true, isPrismatic: true },
    "Anima": { type: 'Origin', breakpoints: [3, 6], hasEmblem: true },
    "Stargazer": { type: 'Origin', breakpoints: [3, 5, 7], hasEmblem: true },
    "NOVA": { type: 'Origin', breakpoints: [2, 5], hasEmblem: true },
    "Mecha": { type: 'Origin', breakpoints: [3, 4, 6], hasEmblem: false },
    "Psionic": { type: 'Origin', breakpoints: [2, 4], hasEmblem: true },
    "Primordian": { type: 'Origin', breakpoints: [2, 3], hasEmblem: true },
    "Arbiter": { type: 'Origin', breakpoints: [2, 3], hasEmblem: true },
    "Timebreaker": { type: 'Origin', breakpoints: [2, 3, 4], hasEmblem: true },

    // CLASSES
    "Bastion": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Brawler": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Challenger": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Conduit": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: false },
    "Fateweaver": { type: 'Class', breakpoints: [2, 4], hasEmblem: false },
    "Marauder": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Replicator": { type: 'Class', breakpoints: [2, 4], hasEmblem: false },
    "Rogue": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Shepherd": { type: 'Class', breakpoints: [3, 5, 7], hasEmblem: true },
    "Sniper": { type: 'Class', breakpoints: [2, 3, 4], hasEmblem: true },
    "Vanguard": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Voyager": { type: 'Class', breakpoints: [2, 3, 4, 5, 6], hasEmblem: true },

    // UNIQUE TRAITS (single-champion, no emblem)
    "Bulwark": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Choose Trait": { type: 'Unique', breakpoints: [], hasEmblem: false },
    "Commander": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Dark Lady": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Divine Duelist": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Doomer": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Eradicator": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Factory New": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Galaxy Hunter": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Gun Goddess": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Oracle": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Party Animal": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Redeemer": { type: 'Unique', breakpoints: [1], hasEmblem: false },
};

export const getEmblemTraits = () =>
    Object.keys(TRAIT_RULES).filter(t => TRAIT_RULES[t].hasEmblem);