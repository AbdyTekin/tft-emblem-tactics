"use client";

import React, { useState, useMemo } from 'react';
import { LanguageProvider, useTFT } from '@/context/language-context';
import { solveTeamComp } from '@/lib/solver';
// Assuming solveTeamComp is available globally or imported from a separate file.
// For example: import { solveTeamComp } from '@/utils/team-solver';

function MainLayout() {
  const { champions, language, setLanguage, t } = useTFT();

  // State for selected emblems
  const [selectedEmblems, setSelectedEmblems] = useState<string[]>([]);

  // Memoize unique traits
  const allTraits = useMemo(() => {
    const traits = new Set<string>();
    champions.forEach(c => {
      c.traits.forEach(t => traits.add(t));
    });
    return Array.from(traits).sort();
  }, [champions]);

  // Derived state: generated team
  // We re-run the solver whenever champions or selectedEmblems change.
  // In a real app with heavy computation, we might debounce this or run it in a worker/effect.
  const teamRecommendations = useMemo(() => {
    if (selectedEmblems.length === 0) return [];
    // Dynamically import solver? No, we can import it at top level.
    // Ideally we import solveTeamComp. For now let's assume it's available.
    // Placeholder for solveTeamComp function, replace with actual implementation
    // Using imported solveTeamComp

    return solveTeamComp(champions, selectedEmblems);
  }, [champions, selectedEmblems]);

  const toggleEmblem = (trait: string) => {
    setSelectedEmblems(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
            <span className="font-bold text-indigo-400">TFT</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {language === 'tr' ? 'TFT Takım Oluşturucu' : 'TFT Set 16 Gen'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
            className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-800 border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <span className="sr-only">Toggle Language</span>
            <span
              className={`${language === 'tr' ? 'translate-x-9' : 'translate-x-1'
                } inline-block h-6 w-6 transform rounded-full bg-indigo-500 transition-transform shadow-lg`}
            />
            <span className={`absolute left-2 text-xs font-medium ${language === 'en' ? 'text-white' : 'text-gray-500'}`}>EN</span>
            <span className={`absolute right-2 text-xs font-medium ${language === 'tr' ? 'text-white' : 'text-gray-500'}`}>TR</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Panel: Emblem Selector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6 backdrop-blur-sm shadow-xl flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                <span className="text-indigo-400">❖</span>
                {t('traits') || 'Traits'}
              </h2>
              {selectedEmblems.length > 0 && (
                <button
                  onClick={() => setSelectedEmblems([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {t('reset') || 'Reset'}
                </button>
              )}
            </div>
            <div className="space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent flex-1">
              {allTraits.map((trait) => {
                const isSelected = selectedEmblems.includes(trait);
                return (
                  <button
                    key={trait}
                    onClick={() => toggleEmblem(trait)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group flex items-center justify-between border ${isSelected
                      ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-indigo-500/30'
                      }`}
                  >
                    <span className={`transition-colors ${isSelected ? 'text-white font-medium' : 'group-hover:text-indigo-200 text-gray-300'}`}>
                      {trait}
                    </span>
                    {isSelected && (
                      <span className="text-indigo-400 text-sm animate-pulse">●</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Team Recommendations */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedEmblems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6 backdrop-blur-sm shadow-xl h-full min-h-[500px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-300">{t('team_generator') || 'Team Recommendations'}</h3>
              <p className="text-gray-500 mt-2 max-w-sm">
                Select emblems from the left to generate optimized team compositions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {teamRecommendations.map((team, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-gray-900/50 p-6 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Recommended Team</h3>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
                      Score: {team.score}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Active Synergies</h4>
                    <div className="flex flex-wrap gap-2">
                      {team.activeSynergies.map((syn, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-sm border border-indigo-500/30">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Champions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                      {team.champions.map((champ) => (
                        <div key={champ.id} className="group relative flex flex-col items-center">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-700 group-hover:border-indigo-500 transition-colors shadow-lg bg-gray-800">
                            {/* Image Placeholder using ID */}
                            <img
                              src={`https://raw.communitydragon.org/latest/game/assets/characters/${champ.apiName.toLowerCase()}/hud/${champ.apiName.toLowerCase()}_square.tft_set16.png`}
                              alt={champ.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                              }}
                            />
                            <div className="absolute bottom-0 right-0 bg-gray-900/80 px-1 rounded-tl text-[10px] font-bold text-white border-t border-l border-white/10">
                              {champ.cost}
                            </div>
                          </div>
                          <span className="mt-2 text-xs font-medium text-gray-300 text-center truncate w-full group-hover:text-white transition-colors">
                            {champ.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <MainLayout />
    </LanguageProvider>
  );
}
