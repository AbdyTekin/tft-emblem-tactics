export type TraitType = 'Origin' | 'Class' | 'Unique';

export interface TraitRule {
    type: TraitType;
    breakpoints: number[];
    hasEmblem: boolean;
    isPrismatic?: boolean;
}

export const TRAIT_RULES: Record<string, TraitRule> = {
    // ORIGINS
    "Elderwood": { type: 'Origin', breakpoints: [3, 5, 7, 9, 11], hasEmblem: true, isPrismatic: true },
    "Blossom": { type: 'Origin', breakpoints: [3, 5, 7, 9, 11], hasEmblem: true, isPrismatic: true },
    "Riftbeast": { type: 'Origin', breakpoints: [3, 5, 7, 10], hasEmblem: false, isPrismatic: true },
    "Coven": { type: 'Origin', breakpoints: [3, 4, 5, 7], hasEmblem: true },
    "Inferno": { type: 'Origin', breakpoints: [2, 3, 5, 7], hasEmblem: true },
    "Blackthorn": { type: 'Origin', breakpoints: [2, 4, 6], hasEmblem: true },
    "Sprykin": { type: 'Origin', breakpoints: [3, 5, 7], hasEmblem: true },
    "Lunar": { type: 'Origin', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Solar": { type: 'Origin', breakpoints: [3], hasEmblem: false },
    "Fae": { type: 'Origin', breakpoints: [2, 4], hasEmblem: true },
    "Primal": { type: 'Origin', breakpoints: [2, 4], hasEmblem: true },
    "Flora Fatalis": { type: 'Origin', breakpoints: [1, 2], hasEmblem: true },

    // CLASSES
    "Adaptor": { type: 'Class', breakpoints: [2, 3, 4], hasEmblem: false },
    "Brawler": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Defender": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Executioner": { type: 'Class', breakpoints: [2, 3, 4], hasEmblem: true },
    "Hunter": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Invoker": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Juggernaut": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Rapidfire": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Ravager": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Spellweaver": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Summoner": { type: 'Class', breakpoints: [2, 3], hasEmblem: false },
    "Vanguard": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },

    // UNIQUE TRAITS (single/special champion, no emblem)
    "Apex Predator": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Attuned": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Avatar": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Bounty Seeker": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Caustic": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Emerald Aspect": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Greenfather": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Monolith": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Old Growth": { type: 'Unique', breakpoints: [1], hasEmblem: false },
    "Rival": { type: 'Unique', breakpoints: [1, 2], hasEmblem: false },
    "Thornmaiden": { type: 'Unique', breakpoints: [1], hasEmblem: false }
};

export const getEmblemTraits = () =>
    Object.keys(TRAIT_RULES).filter(t => TRAIT_RULES[t].hasEmblem);