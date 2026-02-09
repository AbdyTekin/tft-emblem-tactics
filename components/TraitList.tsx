"use client";

import React from 'react';
import ScrollArea from '@/components/ScrollArea';
import { useTranslations } from 'next-intl';
import HoverCard from './HoverCard';

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
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col lg:flex-1 lg:min-h-[95px] h-auto z-10 relative">
            <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t('traits')}
                </h2>
                <button
                    onClick={resetEmblems}
                    disabled={selectedEmblems.length === 0}
                    className={`text-[11px] font-bold text-red-400 hover:text-red-300 transition-all uppercase border border-red-500/30 px-2 rounded-full hover:bg-red-500/10 cursor-pointer ${selectedEmblems.length > 0
                        ? 'opacity-100 pointer-events-auto transform translate-y-0'
                        : 'opacity-0 pointer-events-none transform -translate-y-1'
                        }`}
                >
                    {t('reset')}
                </button>
            </div>
            <ScrollArea className="lg:flex-1 lg:min-h-0 h-auto [&>div]:!h-auto lg:[&>div]:!h-full">
                <div className="grid grid-cols-5 gap-2 pr-1 pb-4">
                    {availableTraits.map((trait) => {
                        const count = selectedEmblems.filter(e => e === trait).length;
                        const isSelected = count > 0;

                        // Construct Image URL
                        const normalizedName = trait.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const imageUrl = `https://raw.communitydragon.org/16.1/game/assets/maps/particles/tft/item_icons/traits/spatula/set16/tft16_emblem_${normalizedName}.tft_set16.png`;

                        return (
                            <HoverCard key={trait} trigger={
                                <button
                                    onClick={() => addEmblem(trait)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        removeEmblem(trait, e);
                                    }}
                                    className={`relative w-full aspect-square rounded-lg transition-all duration-200 group flex items-center justify-center border cursor-pointer ${isSelected
                                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:bg-indigo-600/30'
                                        : 'bg-white/5 hover:bg-indigo-500/20 border-white/5 hover:border-indigo-500/30'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded p-0.5 ${isSelected ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                        <img
                                            src={imageUrl}
                                            alt={trait}
                                            className="w-full h-full object-contain filter drop-shadow-sm"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerText = trait.substring(0, 2);
                                            }}
                                        />
                                    </div>

                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold shadow-sm ring-1 ring-gray-900">
                                            {count}
                                        </div>
                                    )}
                                </button>
                            }>
                                <span>{tTraits(trait)}</span>
                            </HoverCard>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}

