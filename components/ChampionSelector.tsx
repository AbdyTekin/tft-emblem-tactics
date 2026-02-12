"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTFT } from '@/context/language-context';
import { Champion } from '@/types/tft';
import HorizontalScrollArea from '@/components/HorizontalScrollArea';
import { useTranslations } from 'next-intl';
import HoverCard from '@/components/HoverCard';
import { TRAIT_RULES } from '@/lib/trait-rules';
import TraitIcon from '@/components/TraitIcon';

interface ChampionSelectorProps {
    initialTeam: Champion[];
    setInitialTeam: (team: Champion[]) => void;
    currentLevel: number;
}

function usePopupPosition(
    isOpen: boolean,
    buttonRef: React.RefObject<HTMLButtonElement | null>,
    containerRef: React.RefObject<HTMLDivElement | null>
) {
    const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

    const updatePosition = useCallback(() => {
        if (!isOpen || !buttonRef.current || !containerRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const width = containerRect.width;

        let top = rect.bottom + 8;
        let left = containerRect.left;

        if (typeof window !== 'undefined') {
            if (left + width > window.innerWidth) {
                left = window.innerWidth - width - 10;
            }
            left = Math.max(10, left);

            // If popup would go below viewport, position above the button
            const popupMaxHeight = 350; // max-h-[300px] + header ~50px
            if (top + popupMaxHeight > window.innerHeight) {
                const aboveTop = rect.top - popupMaxHeight - 8;
                if (aboveTop > 0) {
                    top = aboveTop;
                }
            }
        }

        setStyle({
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            position: 'fixed',
            zIndex: 50,
            visibility: 'visible',
        });
    }, [isOpen, buttonRef, containerRef]);

    // Compute position synchronously before paint to avoid flash
    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
        } else {
            setStyle({ visibility: 'hidden' });
        }
    }, [isOpen, updatePosition]);

    // Continuously update position on scroll (any ancestor) and resize
    useEffect(() => {
        if (!isOpen) return;

        const onScrollOrResize = () => {
            updatePosition();
        };

        // Listen on window scroll + resize, and use capture to catch any scrollable ancestor
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);

        return () => {
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [isOpen, updatePosition]);

    return style;
}

export default function ChampionSelector({ initialTeam, setInitialTeam, currentLevel }: ChampionSelectorProps) {
    const { champions } = useTFT();
    const t = useTranslations();
    const tTraits = useTranslations('Traits');
    const [search, setSearch] = useState("");
    const [filterCost, setFilterCost] = useState<number | null>(null);
    const [filterTrait, setFilterTrait] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isCostDropdownOpen, setIsCostDropdownOpen] = useState(false);
    const [isTraitDropdownOpen, setIsTraitDropdownOpen] = useState(false);
    const costDropdownRef = useRef<HTMLDivElement>(null);
    const traitDropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const popupStyle = usePopupPosition(isOpen, buttonRef, containerRef);

    // Custom scrollbar state for popup
    const popupScrollRef = useRef<HTMLDivElement>(null);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [isScrollHovering, setIsScrollHovering] = useState(false);
    const [isScrollDragging, setIsScrollDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartScrollTop = useRef(0);

    const handlePopupScroll = useCallback(() => {
        if (!popupScrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = popupScrollRef.current;

        if (scrollHeight <= clientHeight) {
            setThumbHeight(0);
            return;
        }

        const newThumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 20);
        const maxTop = clientHeight - newThumbHeight;
        const scrollRatio = scrollTop / (scrollHeight - clientHeight);

        setThumbHeight(newThumbHeight);
        setThumbTop(scrollRatio * maxTop);
    }, []);

    const handleScrollDragStart = (e: React.MouseEvent) => {
        if (!popupScrollRef.current) return;
        setIsScrollDragging(true);
        dragStartY.current = e.clientY;
        dragStartScrollTop.current = popupScrollRef.current.scrollTop;
        e.preventDefault();
    };

    useEffect(() => {
        const handleDragMove = (e: MouseEvent) => {
            if (!isScrollDragging || !popupScrollRef.current) return;

            const deltaY = e.clientY - dragStartY.current;
            const { scrollHeight, clientHeight } = popupScrollRef.current;
            const maxScrollTop = scrollHeight - clientHeight;

            const maxThumbTop = clientHeight - thumbHeight;
            if (maxThumbTop <= 0) return;

            const scrollRatio = deltaY / maxThumbTop;
            const scrollAmount = scrollRatio * maxScrollTop;

            popupScrollRef.current.scrollTop = dragStartScrollTop.current + scrollAmount;
        };

        const handleDragEnd = () => {
            setIsScrollDragging(false);
        };

        if (isScrollDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isScrollDragging, thumbHeight]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Derive Region/Class traits for the trait dropdown
    const regionClassTraits = useMemo(() => {
        const regions: string[] = [];
        const classes: string[] = [];
        for (const [name, rule] of Object.entries(TRAIT_RULES)) {
            if (rule.type === 'Region') regions.push(name);
            else if (rule.type === 'Class') classes.push(name);
        }
        regions.sort((a, b) => a.localeCompare(b));
        classes.sort((a, b) => a.localeCompare(b));
        return { regions, classes };
    }, []);

    // Build a set of Region/Class trait names for search matching
    const regionClassTraitNames = useMemo(() => {
        return new Set([...regionClassTraits.regions, ...regionClassTraits.classes]);
    }, [regionClassTraits]);

    const filteredChampions = useMemo(() => {
        return champions.filter(c => {
            // Search: match name OR Region/Class trait names (translated)
            if (search) {
                const q = search.toLowerCase();
                const nameMatch = c.name.toLowerCase().includes(q);
                const traitMatch = c.traits.some(trait => {
                    if (!regionClassTraitNames.has(trait)) return false;
                    // Match against both the raw key and the translated name
                    try {
                        return trait.toLowerCase().includes(q) || tTraits(trait).toLowerCase().includes(q);
                    } catch {
                        return trait.toLowerCase().includes(q);
                    }
                });
                if (!nameMatch && !traitMatch) return false;
            }
            if (filterCost !== null && c.cost !== filterCost) return false;
            if (filterTrait !== null && !c.traits.includes(filterTrait)) return false;
            return true;
        }).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
    }, [champions, search, filterCost, filterTrait, regionClassTraitNames, tTraits]);

    // Close cost/trait dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (costDropdownRef.current && !costDropdownRef.current.contains(e.target as Node)) {
                setIsCostDropdownOpen(false);
            }
            if (traitDropdownRef.current && !traitDropdownRef.current.contains(e.target as Node)) {
                setIsTraitDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Observe popup scroll area for resize and scroll
    useEffect(() => {
        if (!isOpen) return;
        const element = popupScrollRef.current;
        if (!element) return;

        handlePopupScroll();

        const observer = new ResizeObserver(handlePopupScroll);
        observer.observe(element);
        element.addEventListener('scroll', handlePopupScroll);

        return () => {
            observer.disconnect();
            element.removeEventListener('scroll', handlePopupScroll);
        };
    }, [isOpen, handlePopupScroll, filteredChampions]);

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
            <div className="flex flex-col gap-1.5 mb-1.5">
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
                            className={`w-full aspect-square rounded-lg border flex items-center justify-center transition-all duration-300 cursor-pointer
                                ${isOpen ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-800/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.15)] text-indigo-400' : 'bg-black/20 border-white/5 hover:border-white/7 hover:bg-white/2 text-gray-400 hover:text-gray-300'}
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
                        className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-visible flex flex-col"
                        style={popupStyle}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-3 border-b border-white/10 bg-gray-950/30">
                            <div className="flex gap-2 items-center">
                                {/* Search Input */}
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

                                {/* Trait Filter Dropdown */}
                                <div ref={traitDropdownRef} className="relative">
                                    <button
                                        onClick={() => { setIsTraitDropdownOpen(!isTraitDropdownOpen); setIsCostDropdownOpen(false); }}
                                        className={`h-[30px] flex items-center gap-1 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterTrait
                                            ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300'
                                            : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                                            }`}
                                    >
                                        {filterTrait ? (
                                            <>
                                                <TraitIcon trait={filterTrait} className="w-3.5 h-3.5" />
                                                <span>{tTraits(filterTrait)}</span>
                                            </>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                            </svg>
                                        )}

                                    </button>
                                    {isTraitDropdownOpen && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden">
                                            <div className="max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
                                                {/* Clear option */}
                                                <button
                                                    onClick={() => { setFilterTrait(null); setIsTraitDropdownOpen(false); }}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${filterTrait === null ? 'bg-indigo-900/30 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                        }`}
                                                >
                                                    <span>{t('all_traits')}</span>
                                                </button>
                                                {/* Regions */}
                                                <div className="px-3 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider border-t border-white/5">{t('regions')}</div>
                                                {regionClassTraits.regions.map(trait => (
                                                    <button
                                                        key={trait}
                                                        onClick={() => { setFilterTrait(filterTrait === trait ? null : trait); setIsTraitDropdownOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${filterTrait === trait ? 'bg-indigo-900/30 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                            }`}
                                                    >
                                                        <TraitIcon trait={trait} className="w-3.5 h-3.5" />
                                                        <span>{tTraits(trait)}</span>
                                                    </button>
                                                ))}
                                                {/* Classes */}
                                                <div className="px-3 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider border-t border-white/5">{t('classes')}</div>
                                                {regionClassTraits.classes.map(trait => (
                                                    <button
                                                        key={trait}
                                                        onClick={() => { setFilterTrait(filterTrait === trait ? null : trait); setIsTraitDropdownOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${filterTrait === trait ? 'bg-indigo-900/30 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                            }`}
                                                    >
                                                        <TraitIcon trait={trait} className="w-3.5 h-3.5" />
                                                        <span>{tTraits(trait)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cost Filter Dropdown */}
                                <div ref={costDropdownRef} className="relative">
                                    <button
                                        onClick={() => { setIsCostDropdownOpen(!isCostDropdownOpen); setIsTraitDropdownOpen(false); }}
                                        className={`h-[30px] flex items-center gap-1 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${(() => {
                                            if (filterCost === null) return 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300';
                                            const costBtnStyles: Record<number, string> = {
                                                1: 'bg-gray-900/40 border-gray-500/50 text-gray-400',
                                                2: 'bg-green-900/30 border-green-500/50 text-green-400',
                                                3: 'bg-blue-900/30 border-blue-500/50 text-blue-400',
                                                4: 'bg-purple-900/30 border-purple-500/50 text-purple-400',
                                                5: 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400',
                                            };
                                            return costBtnStyles[filterCost] || '';
                                        })()}`}
                                    >
                                        <div
                                            className="w-4 h-4 bg-current"
                                            style={{
                                                maskImage: 'url(https://raw.communitydragon.org/latest/game/assets/ux/tft/regionportals/icon/gold.png)',
                                                WebkitMaskImage: 'url(https://raw.communitydragon.org/latest/game/assets/ux/tft/regionportals/icon/gold.png)',
                                                maskSize: 'contain',
                                                WebkitMaskSize: 'contain',
                                                maskRepeat: 'no-repeat',
                                                WebkitMaskRepeat: 'no-repeat',
                                                maskPosition: 'center',
                                                WebkitMaskPosition: 'center',
                                            }}
                                        />
                                        {filterCost !== null && <span>{filterCost}</span>}
                                    </button>
                                    {isCostDropdownOpen && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-10 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden">
                                            {/* Clear option */}
                                            <button
                                                onClick={() => { setFilterCost(null); setIsCostDropdownOpen(false); }}
                                                className={`w-full flex items-center justify-center px-1 py-1.5 text-xs transition-colors cursor-pointer ${filterCost === null ? 'bg-indigo-900/30 text-indigo-300' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                    }`}
                                            >
                                                <span>-</span>
                                            </button>
                                            {[1, 2, 3, 4, 5].map(cost => {
                                                const costColorMap: Record<number, string> = {
                                                    1: 'text-gray-400',
                                                    2: 'text-green-400',
                                                    3: 'text-blue-400',
                                                    4: 'text-purple-400',
                                                    5: 'text-yellow-400',
                                                };
                                                const activeBgMap: Record<number, string> = {
                                                    1: 'bg-gray-800/50',
                                                    2: 'bg-green-900/30',
                                                    3: 'bg-blue-900/30',
                                                    4: 'bg-purple-900/30',
                                                    5: 'bg-yellow-900/30',
                                                };
                                                return (
                                                    <button
                                                        key={cost}
                                                        onClick={() => { setFilterCost(filterCost === cost ? null : cost); setIsCostDropdownOpen(false); }}
                                                        className={`w-full flex items-center justify-center px-2 py-1.5 text-xs font-bold transition-colors cursor-pointer ${filterCost === cost ? `${activeBgMap[cost]} ${costColorMap[cost]}` : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                            }`}
                                                    >
                                                        <span className={costColorMap[cost]}>{cost}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Wrapper clips the custom scrollbar thumb at 50% */}
                        <div className="overflow-hidden rounded-b-xl">
                            {/* Custom scrollable area with custom scrollbar */}
                            <div
                                className="relative overflow-visible bg-gray-950/30"
                                onMouseEnter={() => setIsScrollHovering(true)}
                                onMouseLeave={() => setIsScrollHovering(false)}
                            >
                                <div
                                    ref={popupScrollRef}
                                    className="max-h-[203px] overflow-y-auto"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    <style jsx>{`
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
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
                                </div>

                                {/* Custom scrollbar thumb — 50% overflows right edge, clipped by popup's overflow-hidden */}
                                {thumbHeight > 0 && (
                                    <div
                                        className={`absolute right-[-6px] top-0 w-3 h-full transition-opacity duration-200 ${isScrollHovering || isScrollDragging ? 'opacity-100' : 'opacity-0'
                                            }`}
                                    >
                                        <div
                                            className={`w-full bg-white/20 rounded-full cursor-pointer hover:bg-white/30 active:bg-white/40 transition-colors ${isScrollDragging ? 'bg-white/40' : ''}`}
                                            style={{
                                                height: `${thumbHeight}px`,
                                                transform: `translateY(${thumbTop}px)`,
                                                transition: isScrollDragging ? 'none' : 'transform 0.05s linear'
                                            }}
                                            onMouseDown={handleScrollDragStart}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
