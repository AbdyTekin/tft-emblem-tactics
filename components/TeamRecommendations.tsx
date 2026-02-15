"use client";

import { useState } from 'react';
import TraitIcon from '@/components/TraitIcon';
import TeamSkeleton from '@/components/TeamSkeleton';
import { TeamComp } from '@/lib/solver';
import { TRAIT_RULES } from '@/lib/trait-rules';
import { generateTeamCode } from '@/lib/team-code';
import { useTranslations } from 'next-intl';

// --- CONFIGURATION START ---

const TRAIT_STYLES = {
    DEFAULT: "bg-transparent border-white/10 text-gray-500",
    BRONZE: "bg-transparent border-yellow-700 text-yellow-700",
    SILVER: "bg-transparent border-gray-300 text-gray-300",
    GOLD: "bg-transparent border-yellow-500 text-yellow-500",
    PRISMATIC: "bg-transparent border-cyan-400 text-cyan-400",
    UNIQUE: "bg-transparent border-rose-600 text-rose-600"
};

const CHAMPION_STYLES: Record<number, { border: string; badge: string }> = {
    1: { border: 'border-gray-500', badge: 'bg-gray-700' },
    2: { border: 'border-green-600', badge: 'bg-green-800' },
    3: { border: 'border-blue-500', badge: 'bg-blue-700' },
    4: { border: 'border-purple-600', badge: 'bg-purple-800' },
    5: { border: 'border-yellow-500', badge: 'bg-yellow-700' },
};

// --- CONFIGURATION END ---

interface TeamRecommendationsProps {
    teamRecommendations: TeamComp[];
    selectedEmblems: string[];
    level: number;
    isGenerating: boolean;
}

export default function TeamRecommendations({ teamRecommendations, selectedEmblems, level, isGenerating }: TeamRecommendationsProps) {
    const t = useTranslations();
    const tTraits = useTranslations('Traits');
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const handleCopyTeamCode = async (team: TeamComp, idx: number) => {
        const code = generateTeamCode(team.champions);
        try {
            await navigator.clipboard.writeText(code);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        }
    };

    if (isGenerating) {
        return <TeamSkeleton />;
    }

    if (selectedEmblems.length === 0) {
        return (
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6 backdrop-blur-sm shadow-xl h-full min-h-[500px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-200">{t('ready_to_build')}</h3>
                <p className="text-gray-500 mt-2 max-w-md text-lg">
                    {t('select_emblems_msg', { level })}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {teamRecommendations.map((team, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden backdrop-blur-sm shadow-xl transition-all hover:border-indigo-500/30 hover:shadow-2xl hover:bg-gray-900/80">
                    <div className="p-4">
                        {/* Synergies & Score Row */}
                        <div className="mb-4 flex items-start justify-between gap-4">

                            {/* Synergies */}
                            <div className="flex flex-wrap gap-2 flex-1">
                                {team.activeSynergies.map((syn, i) => {
                                    // Example: "Demacia (9)"
                                    const match = syn.match(/^(.+)\s\((\d+)\)$/);
                                    if (!match) return null;
                                    const name = match[1];
                                    const count = parseInt(match[2], 10);

                                    const traitRule = TRAIT_RULES[name];
                                    // Default (Inactive/Low)
                                    let styleClass = TRAIT_STYLES.DEFAULT;
                                    let displayCount = `${count}`;

                                    if (traitRule) {
                                        const { breakpoints, isPrismatic } = traitRule;
                                        let tier = -1;

                                        for (let b = 0; b < breakpoints.length; b++) {
                                            if (count >= breakpoints[b]) {
                                                tier = b;
                                            } else {
                                                break;
                                            }
                                        }

                                        // Set Display Text: "Count"
                                        displayCount = `${count}`;

                                        // Determine Color Style
                                        if (tier >= 0) {
                                            if (traitRule.type === 'Origin') {
                                                styleClass = TRAIT_STYLES.UNIQUE;
                                            } else if (isPrismatic) {
                                                if (tier === breakpoints.length - 1) {
                                                    styleClass = TRAIT_STYLES.PRISMATIC;
                                                } else if (tier === breakpoints.length - 2) {
                                                    styleClass = TRAIT_STYLES.GOLD;
                                                } else if (tier === 0) {
                                                    styleClass = TRAIT_STYLES.BRONZE;
                                                } else {
                                                    styleClass = TRAIT_STYLES.SILVER;
                                                }
                                            } else {
                                                if (tier === breakpoints.length - 1) {
                                                    styleClass = TRAIT_STYLES.GOLD;
                                                } else if (tier === 0) {
                                                    styleClass = TRAIT_STYLES.BRONZE;
                                                } else {
                                                    styleClass = TRAIT_STYLES.SILVER;
                                                }
                                            }
                                        }
                                    }

                                    return (
                                        <div key={i} className={`flex items-center gap-1 pl-2 pr-2 py-0.5 rounded-full border-[1.5px] shadow-sm transition-all ${styleClass}`}>
                                            <span className="text-[15px] font-bold w-2 text-center leading-none opacity-90">{displayCount}</span>
                                            <TraitIcon
                                                trait={name}
                                                className="w-2 h-2"
                                            />
                                            <span className="text-[12px] font-medium opacity-90 text-gray-300">{tTraits(name)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Score & Team Code */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                                    {team.strategyName && (
                                        <>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t(team.strategyName)}</span>
                                            <span className="text-sm font-bold text-yellow-500 mr-2">{team.strategyValue}</span>
                                            <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                        </>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('difficulty')}</span>
                                    <span className="text-xl font-black text-white tracking-tight">{team.difficulty}</span>
                                </div>
                                <button
                                    onClick={() => handleCopyTeamCode(team, idx)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer border ${copiedIdx === idx
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                        : 'bg-black/20 border-white/5 text-gray-400 hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:text-indigo-300'
                                        }`}
                                >
                                    {copiedIdx === idx ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                            {t('copied')}
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                            </svg>
                                            {t('team_code')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Champions Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                            {team.champions.map((champ) => (
                                <div key={champ.id} className="group relative aspect-square">
                                    <div className={`absolute inset-0 rounded-xl border-2 transition-all shadow-lg overflow-hidden bg-gray-800 ${CHAMPION_STYLES[champ.cost]?.border || CHAMPION_STYLES[1].border
                                        }`}>
                                        <img
                                            src={`https://raw.communitydragon.org/latest/game/assets/characters/${champ.apiName.toLowerCase()}/hud/${champ.apiName.toLowerCase()}_square.tft_set16.png`}
                                            alt={champ.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                                            }}
                                        />
                                        {/* Cost Badge */}
                                        <div className={`absolute top-0 right-0 px-1 py-0.25 rounded-bl-lg flex items-center justify-center ${CHAMPION_STYLES[champ.cost]?.badge || CHAMPION_STYLES[1].badge
                                            }`}>
                                            <img
                                                src="https://raw.communitydragon.org/latest/game/assets/ux/tft/regionportals/icon/gold.png"
                                                alt="Gold"
                                                className="w-3 h-3 mr-0.5"
                                            />
                                            <span className="text-[10px] font-black text-white">{champ.cost}</span>
                                        </div>
                                        {/* Name Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4 text-center">
                                            <span className="text-[10px] font-bold text-white truncate block">
                                                {champ.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
