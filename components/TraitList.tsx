"use client";

import React from 'react';
import ScrollArea from '@/components/ScrollArea';
import { useTranslations } from 'next-intl';
import HoverCard from './HoverCard';
import { emblemImage } from '@/lib/assets';

interface TraitListProps {
    availableTraits: readonly string[];
    selectedEmblems: string[];
    addEmblem: (trait: string) => void;
    removeEmblem: (trait: string) => void;
    resetEmblems: () => void;
}

export default function TraitList({ availableTraits, selectedEmblems, addEmblem, removeEmblem, resetEmblems }: TraitListProps) {
    const t = useTranslations();
    const tTraits = useTranslations('Traits');

    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 flex flex-col lg:shrink-1 lg:min-h-[95px] h-auto z-10 relative">
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
            <ScrollArea className="lg:flex-1 lg:min-h-0 h-auto lg:h-full -mr-2 pr-2 [&>div]:!h-auto lg:[&>div]:!h-full">
                <div className="grid grid-cols-5 gap-1.5">
                    {availableTraits.map((trait) => {
                        const count = selectedEmblems.filter(e => e === trait).length;
                        const isSelected = count > 0;
                        const name = tTraits(trait);

                        return (
                            <HoverCard key={trait} trigger={
                                <div className="relative w-full aspect-square">
                                    <button
                                        onClick={() => addEmblem(trait)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            removeEmblem(trait);
                                        }}
                                        aria-label={t('add_emblem', { trait: name })}
                                        className={`
                                            relative w-full h-full rounded-lg overflow-hidden border transition-all group cursor-pointer
                                            ${isSelected
                                                ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                                : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <img
                                            src={emblemImage(trait)}
                                            alt=""
                                            width={64}
                                            height={64}
                                            className={`w-full h-full object-contain transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`}
                                        />
                                    </button>

                                    {/* Count; clicking it removes one (keyboard and touch friendly, like right-click) */}
                                    {isSelected && (
                                        <button
                                            onClick={() => removeEmblem(trait)}
                                            aria-label={t('remove_emblem', { trait: name, count })}
                                            className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-indigo-500 hover:bg-red-500 text-white text-[9px] font-bold shadow-sm ring-1 ring-gray-900 cursor-pointer transition-colors"
                                        >
                                            {count}
                                        </button>
                                    )}
                                </div>
                            }>
                                <span>{name}</span>
                            </HoverCard>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
