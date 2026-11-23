"use client";

import { useTranslations } from 'next-intl';
import { unitSlots } from '@/lib/game/rules';
import type { Champion, UnlockDifficulty } from '@/lib/game/types';
import { useNames } from '@/lib/hooks/use-names';

/** Circular medallion colors on champion portraits, keyed by unlock difficulty (literal Tailwind classes). */
export const UNLOCK_BADGE_STYLE: Record<UnlockDifficulty, string> = {
    1: 'bg-gray-950/90 text-sky-300 border-sky-400/75 shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    2: 'bg-gray-950/90 text-amber-300 border-amber-400/80 shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    3: 'bg-gray-950/90 text-orange-300 border-orange-400/85 shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    4: 'bg-gray-950/90 text-rose-300 border-rose-400/90 shadow-[0_1px_6px_rgba(244,63,94,0.4)]',
};

const UNLOCK_PILL_STYLE: Record<UnlockDifficulty, string> = {
    1: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    2: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    3: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    4: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const DIFFICULTY_KEY: Record<UnlockDifficulty, 'unlock_difficulty_1' | 'unlock_difficulty_2' | 'unlock_difficulty_3' | 'unlock_difficulty_4'> = {
    1: 'unlock_difficulty_1',
    2: 'unlock_difficulty_2',
    3: 'unlock_difficulty_3',
    4: 'unlock_difficulty_4',
};

/** TFT-style shield-bottomed padlock matching the in-game Set 19 unlock indicator. */
export function LockIcon({ className = 'w-3 h-3' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2.25A4.75 4.75 0 0 0 7.25 7v2.75H5.5a.75.75 0 0 0-.75.75v6.85a1 1 0 0 0 .48.85l6.25 3.85a1 1 0 0 0 1.04 0l6.25-3.85a1 1 0 0 0 .48-.85V10.5a.75.75 0 0 0-.75-.75h-1.75V7A4.75 4.75 0 0 0 12 2.25ZM9.75 7a2.25 2.25 0 1 1 4.5 0v2.75h-4.5V7Zm4.25 7.25a2 2 0 0 1-1 1.73V17.5a1 1 0 1 1-2 0v-1.52a2 2 0 1 1 3-1.73Z"
            />
        </svg>
    );
}

/** Tooltip body for a champion: name, traits, and unlock quest + difficulty when unlockable. */
export default function ChampionTooltip({ champion }: { champion: Champion }) {
    const t = useTranslations();
    const names = useNames();
    const unlock = champion.unlock;
    const condition = names.unlockCondition(champion);

    return (
        <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-gray-100">{names.champion(champion)}</span>
                <div className="flex items-center gap-1.5">
                    {unitSlots(champion) === 2 && (
                        <span className="px-1 py-0.25 rounded bg-purple-500/20 border border-purple-400/40 text-[9px] font-bold text-purple-200">
                            {t('two_slots')}
                        </span>
                    )}
                    <span className="text-[10px] font-semibold text-gray-400">{champion.cost}g</span>
                </div>
            </div>
            <div className="text-[11px] text-gray-400">
                {champion.traits.map(tr => names.trait(tr)).join(' · ')}
            </div>
            {unlock && condition && (
                <div className="mt-1 pt-1.5 border-t border-white/10 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${UNLOCK_PILL_STYLE[unlock.difficulty]}`}>
                            <LockIcon className="w-3 h-3" />
                            {t('unlock_label')}: {t(DIFFICULTY_KEY[unlock.difficulty])}
                        </span>
                        {unlock.levelRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300">
                                {t('unlock_level', { level: unlock.levelRequired })}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] leading-snug text-gray-200">{condition}</p>
                </div>
            )}
        </div>
    );
}
