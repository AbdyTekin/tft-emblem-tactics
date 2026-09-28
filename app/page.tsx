"use client";

import React, { useState, useMemo, useDeferredValue } from 'react';
import { solveTeams, type SolveResult, type Strategy } from '@/lib/solver';
import { EMBLEM_TRAITS } from '@/lib/game/data';
import { Champion } from '@/types/tft';
import Header from '@/components/Header';
import Controls from '@/components/Controls';
import TraitList from '@/components/TraitList';
import ChampionSelector from '@/components/ChampionSelector';
import TeamRecommendations from '@/components/TeamRecommendations';
import ScrollArea from '@/components/ScrollArea';

function MainLayout() {
  const [selectedEmblems, setSelectedEmblems] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(8);
  const [strategy, setStrategy] = useState<Strategy>('BronzeLife');
  const [initialTeam, setInitialTeam] = useState<Champion[]>([]);

  // Defer heavy calculation inputs to prevent UI blocking
  const deferredSelectedEmblems = useDeferredValue(selectedEmblems);
  const deferredLevel = useDeferredValue(level);
  const deferredStrategy = useDeferredValue(strategy);
  const deferredInitialTeam = useDeferredValue(initialTeam);

  const availableTraits = EMBLEM_TRAITS as string[];

  const result = useMemo<SolveResult | null>(() => {
    // No emblems selected: nothing to build around, even when champions are locked.
    if (deferredSelectedEmblems.length === 0) return null;

    return solveTeams({
      emblems: deferredSelectedEmblems,
      level: deferredLevel,
      strategy: deferredStrategy,
      locked: deferredInitialTeam.map(c => c.apiName),
    });
  }, [deferredSelectedEmblems, deferredLevel, deferredStrategy, deferredInitialTeam]);

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
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden flex-col bg-gray-900 text-gray-100 font-sans">
      <Header />

      <main className="flex-1 min-h-0 flex flex-col">
        <div className="container mx-auto max-w-6xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-full lg:min-h-0 h-auto">

          {/* Left Panel */}
          <div className="lg:col-span-3 lg:h-full lg:min-h-0 flex items-start lg:items-center justify-center">
            <div className="flex flex-col gap-6 w-full lg:h-full lg:min-h-0 lg:overflow-hidden justify-center">
              <Controls
                level={level}
                setLevel={setLevel}
                strategy={strategy}
                setStrategy={setStrategy}
              />

              <ChampionSelector
                initialTeam={initialTeam}
                setInitialTeam={setInitialTeam}
                currentLevel={level}
              />

              <TraitList
                availableTraits={availableTraits}
                selectedEmblems={selectedEmblems}
                addEmblem={addEmblem}
                removeEmblem={removeEmblem}
                resetEmblems={() => setSelectedEmblems([])}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-9 lg:h-full lg:min-h-0 h-auto">
            <ScrollArea className="h-auto lg:h-full pr-1 [&>div]:!h-auto lg:[&>div]:!h-full">
              <div className="flex flex-col gap-4 h-full">
                <TeamRecommendations
                  result={result}
                  strategy={deferredStrategy}
                  selectedEmblems={deferredSelectedEmblems}
                  level={deferredLevel}
                  isGenerating={selectedEmblems.length > 0 && (selectedEmblems !== deferredSelectedEmblems || level !== deferredLevel || strategy !== deferredStrategy || initialTeam !== deferredInitialTeam)}
                />
              </div>
            </ScrollArea>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <MainLayout />;
}
