export type TraitType = 'Region' | 'Class' | 'Origin';

export interface TraitRule {
    type: TraitType;
    breakpoints: number[];
    hasEmblem: boolean;
    isPrismatic?: boolean;
}

export const TRAIT_RULES: Record<string, TraitRule> = {
    // REGIONS
    "Bilgewater": { type: 'Region', breakpoints: [3, 5, 7, 10], hasEmblem: true, isPrismatic: true },
    "Demacia": { type: 'Region', breakpoints: [3, 5, 7, 11], hasEmblem: true, isPrismatic: true },
    "Freljord": { type: 'Region', breakpoints: [3, 5, 7], hasEmblem: true },
    "Ionia": { type: 'Region', breakpoints: [3, 5, 7, 10], hasEmblem: true, isPrismatic: true },
    "Ixtal": { type: 'Region', breakpoints: [3, 5, 7], hasEmblem: true },
    "Noxus": { type: 'Region', breakpoints: [3, 5, 7, 10], hasEmblem: true, isPrismatic: true },
    "Piltover": { type: 'Region', breakpoints: [2, 4, 6], hasEmblem: true },
    "Shadow Isles": { type: 'Region', breakpoints: [2, 3, 4, 5], hasEmblem: false },
    "Shurima": { type: 'Region', breakpoints: [2, 3, 4], hasEmblem: false, isPrismatic: true },
    "Targon": { type: 'Region', breakpoints: [1], hasEmblem: false },
    "Void": { type: 'Region', breakpoints: [2, 4, 6, 9], hasEmblem: true },
    "Yordle": { type: 'Region', breakpoints: [2, 4, 6, 8, 10], hasEmblem: true, isPrismatic: true },
    "Zaun": { type: 'Region', breakpoints: [3, 5, 7], hasEmblem: true },

    // CLASSES
    "Arcanist": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Bruiser": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Darkin": { type: 'Class', breakpoints: [1, 2, 3], hasEmblem: false },
    "Defender": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Disruptor": { type: 'Class', breakpoints: [2, 4], hasEmblem: true },
    "Gunslinger": { type: 'Class', breakpoints: [2, 4], hasEmblem: true },
    "Invoker": { type: 'Class', breakpoints: [2, 4], hasEmblem: true },
    "Juggernaut": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Longshot": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Quickstriker": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Slayer": { type: 'Class', breakpoints: [2, 4, 6], hasEmblem: true },
    "Vanquisher": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },
    "Warden": { type: 'Class', breakpoints: [2, 3, 4, 5], hasEmblem: true },

    // ORIGINS
    "Ascendant": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Assimilator": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Blacksmith": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Caretaker": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Chainbreaker": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Chronokeeper": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Dark Child": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Dragonborn": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Eternal": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Glutton": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Harvester": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Heroic": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "HexMech": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Huntress": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Immortal": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Riftscourge": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Rune Mage": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Star Forger": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "The Boss": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "World Ender": { type: 'Origin', breakpoints: [1], hasEmblem: false },
    "Soulbound": { type: 'Origin', breakpoints: [1], hasEmblem: false },
};

export const getEmblemTraits = () =>
    Object.keys(TRAIT_RULES).filter(t => TRAIT_RULES[t].hasEmblem);