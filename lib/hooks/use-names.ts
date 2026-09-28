"use client";

import { useLocale } from 'next-intl';
import { getTrait } from '@/lib/game/data';
import type { Champion } from '@/lib/game/types';

type Lang = keyof Champion['names'];

/** Game names in the current UI language (both come from the game data). */
export function useNames() {
    const locale = useLocale() as Lang;
    return {
        trait: (key: string) => getTrait(key)?.names[locale] ?? key,
        champion: (champion: Champion) => champion.names[locale] ?? champion.name,
    };
}
