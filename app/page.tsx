"use client";

import React, { useState, useMemo } from 'react';
import { LanguageProvider, useTFT } from '@/context/language-context';
import { solveTeamComp, SolverStrategy } from '@/lib/solver';
import { getEmblemTraits } from '@/lib/trait-rules';

const TraitIcon = ({ trait, className }: { trait: string, className?: string }) => {
  const normalizedTrait = trait.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Potential URL patterns based on user feedback and common CDragon patterns
  const urls = [
    `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_16_${normalizedTrait}.tft_set16.png`,
    `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_16_${normalizedTrait}.png`,
    `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_9_${normalizedTrait}.png`, // Specific case for Bilgewater/Legacy
    `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_4_${normalizedTrait}.png` // Generic fallback
  ];

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    // Fallback UI or empty
    return null;
  }

  return (
    <img
      src={urls[currentUrlIndex]}
      alt={trait}
      className={className}
      onError={handleError}
    />
  );
};

function MainLayout() {
  const { champions, language, setLanguage, t } = useTFT();



  const [selectedEmblems, setSelectedEmblems] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(8);
  const [strategy, setStrategy] = useState<SolverStrategy>('Standard');

  const availableTraits = useMemo(() => {
    const traits = getEmblemTraits();
    return traits.sort();
  }, []);

  const teamRecommendations = useMemo(() => {
    if (selectedEmblems.length === 0) return [];

    const activeEmblems: Record<string, number> = {};
    selectedEmblems.forEach(e => activeEmblems[e] = (activeEmblems[e] || 0) + 1);

    return solveTeamComp(champions, activeEmblems, level, strategy);
  }, [champions, selectedEmblems, level, strategy]);

  const addEmblem = (trait: string) => {
    setSelectedEmblems(prev => [...prev, trait]);
  };

  const removeEmblem = (trait: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmblems(prev => {
      const index = prev.indexOf(trait);
      if (index > -1) {
        const newArr = [...prev];
        newArr.splice(index, 1);
        return newArr;
      }
      return prev;
    });
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
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Controls Panel */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level {level}</span>
              </div>
              <input
                type="range"
                min="6"
                max="10"
                step="1"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
            </div>
            <div className="h-px bg-white/5 w-full" />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strategy</span>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as SolverStrategy)}
                className="bg-black/20 rounded-lg p-2 text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer uppercase tracking-wide hover:text-white transition-colors border border-white/5"
              >
                <option value="Standard">Standard</option>
                <option value="RegionRyze">Region Ryze</option>
                <option value="BronzeLife">Bronze Life</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 backdrop-blur-sm shadow-xl flex flex-col h-[calc(100vh-20rem)]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {t('traits') || 'Traits'}
              </h2>
              {selectedEmblems.length > 0 && (
                <button
                  onClick={() => setSelectedEmblems([])}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase border border-red-500/30 px-2 py-0.5 rounded-full hover:bg-red-500/10"
                >
                  {t('reset') || 'RESET'}
                </button>
              )}
            </div>
            <div className="space-y-1 overflow-y-auto pr-2 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
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
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group flex items-center justify-between border ${isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
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
                        {trait}
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
          </div>
        </div>

        {/* Right Panel: Team Recommendations */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {selectedEmblems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6 backdrop-blur-sm shadow-xl h-full min-h-[500px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-200">Ready to Build</h3>
              <p className="text-gray-500 mt-2 max-w-md text-lg">
                Select your emblems from the sidebar. The solver will automatically generate the best possible {level}-unit team compositions.
              </p>
            </div>
          ) : (
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
                          const [name, countStr] = syn.split('(');
                          const count = countStr ? countStr.replace(')', '') : '1';
                          return (
                            <div key={i} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-gray-800 border border-white/10 shadow-sm">
                              <TraitIcon
                                trait={name}
                                className="w-5 h-5 object-contain"
                              />
                              <span className="text-xs font-bold text-gray-200">{name}</span>
                              {/* <span className="text-xs font-black text-indigo-400">{count}</span> -- User said convert text/number to pngs. */}
                            </div>
                          );
                        })}
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Score</span>
                        <span className="text-xl font-black text-white tracking-tight">{team.score}</span>
                      </div>
                    </div>

                    {/* Champions Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {team.champions.map((champ) => (
                        <div key={champ.id} className="group relative aspect-square">
                          <div className={`absolute inset-0 rounded-xl border-2 transition-all shadow-lg overflow-hidden bg-gray-800 ${champ.cost === 5 ? 'border-yellow-500/50 shadow-yellow-500/20' :
                            champ.cost === 4 ? 'border-purple-500/50 shadow-purple-500/20' :
                              'border-gray-700 group-hover:border-indigo-400'
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
                            <div className={`absolute top-0 right-0 px-1.5 py-0.5 rounded-bl-lg flex items-center justify-center ${champ.cost === 5 ? 'bg-yellow-500' :
                              champ.cost === 4 ? 'bg-purple-600' :
                                'bg-gray-700'
                              }`}>
                              <img
                                src="https://raw.communitydragon.org/latest/game/assets/ux/tft/regionportals/icon/gold.png"
                                alt="Gold"
                                className="w-2.5 h-2.5 mr-0.5"
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
