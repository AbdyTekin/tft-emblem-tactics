"use client";

import type { Strategy } from '@/lib/solver';
import { useTranslations } from 'next-intl';
import HoverCard from '@/components/HoverCard';

interface ControlsProps {
    level: number;
    setLevel: (level: number) => void;
    bonusTeamSize: number;
    setBonusTeamSize: (bonus: number) => void;
    strategy: Strategy;
    setStrategy: (strategy: Strategy) => void;
    rivalsAugment: boolean;
    setRivalsAugment: (on: boolean) => void;
    evolvedKhazix: boolean;
    setEvolvedKhazix: (on: boolean) => void;
}

const MIN_LEVEL = 4;
const MAX_LEVEL = 10;
/** Tactician's Cape / Crown / Shield (+1 each) and Cursed Crown (+2). */
const MAX_BONUS_TEAM_SIZE = 3;

const stepButton = "cursor-pointer flex items-center justify-center rounded-xl bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95";

export default function Controls({
    level, setLevel, bonusTeamSize, setBonusTeamSize, strategy, setStrategy,
    rivalsAugment, setRivalsAugment, evolvedKhazix, setEvolvedKhazix,
}: ControlsProps) {
    const t = useTranslations();

    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col gap-5 flex-shrink-0">
            {/* Level Selection */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('level')}</span>

                <div className="relative flex items-center justify-between gap-3 px-5">
                    <button
                        onClick={() => setLevel(Math.max(MIN_LEVEL, level - 1))}
                        disabled={level <= MIN_LEVEL}
                        aria-label={t('level_down')}
                        className={`${stepButton} w-10 h-10`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Level Display */}
                    <div className="flex-1 h-10 relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-900/40 to-indigo-800/20 shadow-[0_0_10px_rgba(99,102,241,0.1)] flex items-center justify-center border border-indigo-500/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-10 mix-blend-overlay" />

                        <div className="relative flex flex-col items-center z-10">
                            <span className="text-2xl font-bold text-indigo-100 leading-none tracking-tight drop-shadow-md" aria-live="polite">
                                {level}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setLevel(Math.min(MAX_LEVEL, level + 1))}
                        disabled={level >= MAX_LEVEL}
                        aria-label={t('level_up')}
                        className={`${stepButton} w-10 h-10`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Extra team slots from items and augments */}
                <div className="flex items-center justify-between gap-2 px-5 mt-1">
                    <HoverCard trigger={
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-dotted border-gray-600 cursor-help">
                            {t('bonus_team_size')}
                        </span>
                    }>
                        <span>{t('bonus_team_size_hint')}</span>
                    </HoverCard>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setBonusTeamSize(Math.max(0, bonusTeamSize - 1))}
                            disabled={bonusTeamSize <= 0}
                            aria-label={t('bonus_team_size_down')}
                            className={`${stepButton} w-6 h-6 text-sm font-bold`}
                        >
                            −
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-indigo-200" aria-live="polite">+{bonusTeamSize}</span>
                        <button
                            onClick={() => setBonusTeamSize(Math.min(MAX_BONUS_TEAM_SIZE, bonusTeamSize + 1))}
                            disabled={bonusTeamSize >= MAX_BONUS_TEAM_SIZE}
                            aria-label={t('bonus_team_size_up')}
                            className={`${stepButton} w-6 h-6 text-sm font-bold`}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* Strategy Selection */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('strategy')}</span>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        {
                            id: 'Vertical',
                            label: t('strategy_vertical'),
                            desc: t('strategy_vertical_desc'),
                            icon: (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )
                        },
                        {
                            id: 'BronzeLife',
                            label: t('strategy_bronze_life'),
                            desc: t('strategy_bronze_life_desc'),
                            icon: (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            )
                        },
                    ].map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setStrategy(option.id as Strategy)}
                            aria-pressed={strategy === option.id}
                            className={`cursor-pointer relative flex items-center w-full p-2.5 rounded-xl border transition-all duration-300 group text-left
                ${strategy === option.id
                                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-800/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                                    : 'bg-black/20 border-white/5 hover:border-white/7 hover:bg-white/2'
                                }
              `}
                        >
                            <div className={`p-2 rounded-lg mr-3 transition-colors duration-300 ${strategy === option.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-800 group-hover:text-gray-300'
                                }`}>
                                {option.icon}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${strategy === option.id ? 'text-indigo-200' : 'text-gray-400 group-hover:text-gray-200'
                                    }`}>
                                    {option.label}
                                </span>
                                <span className="text-[10px] text-gray-600 font-medium truncate group-hover:text-gray-500 transition-colors">
                                    {option.desc}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Rarely needed game states */}
            <details className="group -mt-2">
                <summary className="cursor-pointer select-none text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 list-none flex items-center gap-1">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                    {t('advanced')}
                </summary>
                <div className="mt-2 flex flex-col gap-2 text-[11px] text-gray-400">
                    <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-indigo-500" checked={rivalsAugment} onChange={e => setRivalsAugment(e.target.checked)} />
                        <span>{t('rivals_augment')}</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-indigo-500" checked={evolvedKhazix} onChange={e => setEvolvedKhazix(e.target.checked)} />
                        <span>{t('evolved_khazix')}</span>
                    </label>
                </div>
            </details>
        </div>
    );
}
