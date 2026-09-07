import { Champion } from '@/types/tft';

/**
 * Checks if a champion is any variant of Lux.
 */
export function isLux(champ: Champion): boolean {
    return champ.name.startsWith('Lux') || champ.apiName.toLowerCase().includes('lux');
}

/**
 * Returns how many board/champion slots a unit takes.
 * Elder Dragon takes 2 slots; all other champions take 1 slot.
 */
export function getChampionSlots(champ: Champion): number {
    if (champ.name === 'Elder Dragon' || champ.apiName === 'DA_18_ElderDragon') {
        return 2;
    }
    return 1;
}

/**
 * Returns how much a champion contributes to a given trait count.
 * - Elder Dragon grants +2 to Riftbeast, +1 to Apex Predator.
 * - Any Lux variant grants +2 to her regional trait (non-Avatar), +1 to Avatar.
 * - All other champions grant +1.
 */
export function getChampionTraitContribution(champ: Champion, trait: string): number {
    if (champ.name === 'Elder Dragon' || champ.apiName === 'DA_18_ElderDragon') {
        if (trait === 'Riftbeast') return 2;
        return 1;
    }
    if (isLux(champ)) {
        if (trait !== 'Avatar') return 2;
        return 1;
    }
    return 1;
}

/**
 * Calculates effective max slots for a team.
 * If 2 or more Riftbeast is open/active, the team gets +2 max team size.
 */
export function getEffectiveMaxSlots(baseMaxSlots: number, traitCounts: Record<string, number>): number {
    const riftbeastCount = traitCounts['Riftbeast'] || 0;
    return baseMaxSlots + (riftbeastCount >= 2 ? 2 : 0);
}
