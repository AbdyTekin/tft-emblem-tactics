"use client";

import React from 'react';
import TraitIcon from '@/components/TraitIcon';
import ScrollArea from '@/components/ScrollArea';
import { useTranslations } from 'next-intl';

interface TraitListProps {
    availableTraits: string[];
    selectedEmblems: string[];
    addEmblem: (trait: string) => void;
    removeEmblem: (trait: string, e: React.MouseEvent) => void;
    resetEmblems: () => void;
}

export default function TraitList({ availableTraits, selectedEmblems, addEmblem, removeEmblem, resetEmblems }: TraitListProps) {
    const t = useTranslations();
    const tTraits = useTranslations('Traits');

    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col lg:flex-1 lg:min-h-0 h-auto">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t('traits')}
                </h2>
                {selectedEmblems.length > 0 && (
                    <button
                        onClick={resetEmblems}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase border border-red-500/30 px-2 py-0.5 rounded-full hover:bg-red-500/10"
                    >
                        {t('reset')}
                    </button>
                )}
            </div>
            <ScrollArea className="lg:flex-1 lg:min-h-0 h-auto [&>div]:!h-auto lg:[&>div]:!h-full">
                <div className="space-y-1">
                    {availableTraits.map((trait) => {
                        const count = selectedEmblems.filter(e => e === trait).length;
                        const isSelected = count > 0;

                        // Construct Image URL
                        // Trying conservative approach: remove spaces and lowercase.
                        const normalizedName = trait.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const imageUrl = `https://raw.communitydragon.org/16.1/game/assets/maps/particles/tft/item_icons/traits/spatula/set16/tft16_emblem_${normalizedName}.tft_set16.png`;

                        return (
                            <button
                                key={trait}
                                onClick={() => addEmblem(trait)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    removeEmblem(trait, e);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group flex items-center justify-between border cursor-pointer ${isSelected
                                    ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:bg-indigo-600/30'
                                    : 'bg-white/5 hover:bg-indigo-500/20 border-white/5 hover:border-indigo-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded p-0.5 ${isSelected ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                        <img
                                            src={imageUrl}
                                            alt={trait}
                                            className="w-full h-full object-contain filter drop-shadow-sm"
                                            onError={(e) => {
                                                // Fallback to text initials or generic icon if needed
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerText = trait.substring(0, 2);
                                            }}
                                        />
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                        {tTraits(trait)}
                                    </span>
                                </div>

                                {isSelected && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-sm">
                                        {count}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
