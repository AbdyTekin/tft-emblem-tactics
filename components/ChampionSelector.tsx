"use client";

import React, { useState, useMemo } from 'react';
import { useTFT } from '@/context/language-context';
import { Champion } from '@/types/tft';
import ScrollArea from '@/components/ScrollArea';
import { useTranslations } from 'next-intl';
import HoverCard from '@/components/HoverCard';

interface ChampionSelectorProps {
    initialTeam: Champion[];
    setInitialTeam: (team: Champion[]) => void;
    currentLevel: number;
}

export default function ChampionSelector({ initialTeam, setInitialTeam, currentLevel }: ChampionSelectorProps) {
    const { champions } = useTFT();
    const t = useTranslations();
    const [search, setSearch] = useState("");
    const [filterCost, setFilterCost] = useState<number | null>(null);

    // Filter champions
    const filteredChampions = useMemo(() => {
        return champions.filter(c => {
            // Search text
            if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;

            // Cost filter
            if (filterCost !== null && c.cost !== filterCost) return false;

            return true;
        }).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
    }, [champions, search, filterCost]);

    const handleToggleChampion = (champion: Champion) => {
        const exists = initialTeam.find(c => c.name === champion.name);
        if (exists) {
            setInitialTeam(initialTeam.filter(c => c.name !== champion.name));
        } else {
            // Constraint: Don't add if team size exceeds level? 
            // For now, let's just allow adding. Solver will handle "overfilled" or we can limit here.
            // Let's allow user to select "core" units, usually 2-3.
            setInitialTeam([...initialTeam, champion]);
        }
    };

    const costColors = {
        1: 'border-gray-500 text-gray-400',
        2: 'border-green-500 text-green-400',
        3: 'border-blue-500 text-blue-400',
        4: 'border-purple-500 text-purple-400',
        5: 'border-yellow-500 text-yellow-400'
    };

    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col h-[200px] lg:h-[200px]">
            <div className="flex flex-col gap-1.5 mb-1.5">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {t('champions')}
                    </h2>
                    {initialTeam.length > 0 && (
                        <button
                            onClick={() => setInitialTeam([])}
                            disabled={initialTeam.length === 0}
                            className={`text-[11px] font-bold text-red-400 hover:text-red-300 transition-all uppercase border border-red-500/30 px-2 rounded-full hover:bg-red-500/10 cursor-pointer ${initialTeam.length > 0
                                ? 'opacity-100 pointer-events-auto transform translate-y-0'
                                : 'opacity-0 pointer-events-none transform -translate-y-1'
                                }`}
                        >
                            {t('reset')}
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t('search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    {/* Cost Filters - Mini Buttons */}
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(cost => {
                            const isActive = filterCost === cost;
                            const baseClass = "w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded border transition-all cursor-pointer";

                            let colorClass = "";
                            if (isActive) {
                                switch (cost) {
                                    case 1: colorClass = "bg-gray-800 border-gray-500 text-gray-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]"; break;
                                    case 2: colorClass = "bg-gray-800 border-green-500 text-green-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]"; break;
                                    case 3: colorClass = "bg-gray-800 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]"; break;
                                    case 4: colorClass = "bg-gray-800 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]"; break;
                                    case 5: colorClass = "bg-gray-800 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]"; break;
                                }
                            } else {
                                switch (cost) {
                                    case 1: colorClass = "bg-gray-900 border-gray-500/20 text-gray-500/40 hover:bg-gray-500/10 hover:border-gray-500/50 hover:text-gray-400"; break;
                                    case 2: colorClass = "bg-gray-900 border-green-500/20 text-green-500/40 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-400"; break;
                                    case 3: colorClass = "bg-gray-900 border-blue-500/20 text-blue-500/40 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400"; break;
                                    case 4: colorClass = "bg-gray-900 border-purple-500/20 text-purple-500/40 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-400"; break;
                                    case 5: colorClass = "bg-gray-900 border-yellow-500/20 text-yellow-500/40 hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-400"; break;
                                }
                            }

                            return (
                                <button
                                    key={cost}
                                    onClick={() => setFilterCost(isActive ? null : cost)}
                                    className={`${baseClass} ${colorClass}`}
                                >
                                    {cost}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 -mr-2 pr-2">
                <div className="grid grid-cols-5 gap-1.5 pb-2">
                    {filteredChampions.map(champ => {
                        const isSelected = initialTeam.some(c => c.name === champ.name);

                        // Image URL using apiName
                        const imageUrl = `https://raw.communitydragon.org/latest/game/assets/characters/${champ.apiName.toLowerCase()}/hud/${champ.apiName.toLowerCase()}_square.tft_set16.png`;

                        return (
                            <HoverCard key={champ.name} trigger={
                                <button
                                    onClick={() => handleToggleChampion(champ)}
                                    className={`
                                        relative aspect-square rounded-lg overflow-hidden border transition-all group w-full cursor-pointer
                                        ${isSelected
                                            ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={champ.name}
                                        className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                                        }}
                                    />

                                    {/* Cost Indicator Dot */}
                                    <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${costColors[champ.cost as keyof typeof costColors]?.split(' ')[1].replace('text-', 'bg-') || 'bg-gray-500'}`} />
                                </button>
                            }>
                                <span>{champ.name}</span>
                            </HoverCard>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
