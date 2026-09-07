import { Champion } from '@/types/tft';

export function getChampionImageUrl(champ: Champion): string {
    if (champ.squareIcon) {
        return `https://raw.communitydragon.org/latest/game/${champ.squareIcon}`;
    }
    if (champ.icon) {
        return `https://raw.communitydragon.org/latest/game/${champ.icon}`;
    }
    const champApiNameLower = champ.apiName.toLowerCase();
    return `https://raw.communitydragon.org/latest/game/assets/characters/${champApiNameLower}/hud/${champApiNameLower}_square.tft_set18.png`;
}
