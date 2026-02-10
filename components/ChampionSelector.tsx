"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTFT } from '@/context/language-context';
import { Champion } from '@/types/tft';
import ScrollArea from '@/components/ScrollArea';
import HorizontalScrollArea from '@/components/HorizontalScrollArea';
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
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Position state for the popup
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const [popupWidth, setPopupWidth] = useState(380);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update popup position
    useEffect(() => {
        if (isOpen && buttonRef.current && containerRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            const width = containerRect.width;
            setPopupWidth(width);

            let top = rect.bottom + 8;
            let left = containerRect.left;

            if (typeof window !== 'undefined') {
                if (left + width > window.innerWidth) {
                    left = window.innerWidth - width - 10;
                }
                left = Math.max(10, left);
            }

            setPopupStyle({
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                position: 'fixed',
                zIndex: 50
            });
        }
    }, [isOpen]);

    const filteredChampions = useMemo(() => {
        return champions.filter(c => {
            if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (filterCost !== null && c.cost !== filterCost) return false;
            return true;
        }).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
    }, [champions, search, filterCost]);

    const handleToggleChampion = (champion: Champion) => {
        const exists = initialTeam.find(c => c.name === champion.name);
        if (exists) {
            setInitialTeam(initialTeam.filter(c => c.name !== champion.name));
        } else {
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

    const renderChampionCard = (champ: Champion, isSelected: boolean, onClick: () => void) => {
        // Image URL using apiName
        const imageUrl = `https://raw.communitydragon.org/latest/game/assets/characters/${champ.apiName.toLowerCase()}/hud/${champ.apiName.toLowerCase()}_square.tft_set16.png`;
        const costColorObj = costColors[champ.cost as keyof typeof costColors] || 'border-gray-500 text-gray-400';
        const bgCostColor = costColorObj.split(' ')[1].replace('text-', 'bg-');

        return (
            <HoverCard key={champ.name} trigger={
                <button
                    onClick={onClick}
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
                    <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${bgCostColor}`} />
                </button>
            }>
                <span>{champ.name}</span>
            </HoverCard>
        );
    };

    return (
        <div ref={containerRef} className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden">
            <div className="flex flex-col gap-1.5 mb-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {t('champions')}
                    </h2>
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
                </div>
            </div>

            <HorizontalScrollArea className="flex-1 min-h-0 w-full">
                <div className="flex gap-1.5 items-center w-full">
                    <div className="flex-shrink-0" style={{ width: 'calc((100% - 1.5rem) / 5)' }}>
                        <button
                            ref={buttonRef}
                            onClick={() => setIsOpen(!isOpen)}
                            className={`w-full aspect-square rounded-lg border border-white/10 flex items-center justify-center transition-all cursor-pointer
                                ${isOpen ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'hover:bg-white/5 text-gray-400 hover:text-white hover:border-white/30'}
                            `}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>

                    {initialTeam.map(champ => (
                        <div key={champ.name} className="flex-shrink-0" style={{ width: 'calc((100% - 1.5rem) / 5)' }}>
                            {renderChampionCard(champ, true, () => handleToggleChampion(champ))}
                        </div>
                    ))}
                </div>
            </HorizontalScrollArea>

            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}>
                    {/* Content Container */}
                    <div
                        className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        style={popupStyle}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-3 border-b border-white/10 bg-gray-950/30">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder={t('search')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50"
                                        autoFocus
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
                                <div className="flex gap-0.5 items-center">
                                    {[1, 2, 3, 4, 5].map(cost => {
                                        const isActive = filterCost === cost;
                                        const baseClass = "w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded border transition-all cursor-pointer";

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

                        <ScrollArea className="max-h-[300px] pr-2 -mr-2 [&>div]:!h-auto bg-gray-950/30">
                            <div className="grid grid-cols-5 gap-1.5 p-3 pb-8">
                                {filteredChampions.map(champ => {
                                    const isSelected = initialTeam.some(c => c.name === champ.name);
                                    return (
                                        <div key={champ.name} className="w-full">
                                            {renderChampionCard(champ, isSelected, () => handleToggleChampion(champ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
