import type { Champion } from '@/lib/game/types';

const CDRAGON_GAME = 'https://raw.communitydragon.org/latest/game/';

export function getChampionImageUrl(champ: Champion): string {
    const path = champ.squareIcon ?? champ.tileIcon;
    return path ? `${CDRAGON_GAME}${path}` : 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
}
