"use client";

import React, { useState, useMemo, useDeferredValue } from 'react';
import { LanguageProvider, useTFT } from '@/context/language-context';
import { solveTeamComp, SolverStrategy } from '@/lib/solver';
import { getEmblemTraits } from '@/lib/trait-rules';
import Header from '@/components/Header';
import Controls from '@/components/Controls';
import TraitList from '@/components/TraitList';
import TeamRecommendations from '@/components/TeamRecommendations';
import ScrollArea from '@/components/ScrollArea';

function MainLayout() {
  const { champions } = useTFT();

  const [selectedEmblems, setSelectedEmblems] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(8);
  const [strategy, setStrategy] = useState<SolverStrategy>('RegionRyze');

  // Defer heavy calculation inputs to prevent UI blocking
  const deferredSelectedEmblems = useDeferredValue(selectedEmblems);
  const deferredLevel = useDeferredValue(level);
  const deferredStrategy = useDeferredValue(strategy);

  const availableTraits = useMemo(() => {
    const traits = getEmblemTraits();
    return traits.sort();
  }, []);

  const teamRecommendations = useMemo(() => {
    if (deferredSelectedEmblems.length === 0) return [];

    const activeEmblems: Record<string, number> = {};
    deferredSelectedEmblems.forEach(e => activeEmblems[e] = (activeEmblems[e] || 0) + 1);

    return solveTeamComp(champions, activeEmblems, deferredLevel, deferredStrategy);
  }, [champions, deferredSelectedEmblems, deferredLevel, deferredStrategy]);

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
        <div className="container mx-auto max-w-7xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-full lg:min-h-0 h-auto">

          {/* Left Panel */}
          <div className="lg:col-span-3 flex flex-col gap-6 lg:h-full lg:min-h-0 lg:overflow-hidden">
            <Controls
              level={level}
              setLevel={setLevel}
              strategy={strategy}
              setStrategy={setStrategy}
            />

            <TraitList
              availableTraits={availableTraits}
              selectedEmblems={selectedEmblems}
              addEmblem={addEmblem}
              removeEmblem={removeEmblem}
              resetEmblems={() => setSelectedEmblems([])}
            />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-9 lg:h-full lg:min-h-0 h-auto">
            <ScrollArea className="h-auto lg:h-full pr-1 [&>div]:!h-auto lg:[&>div]:!h-full">
              <div className="flex flex-col gap-4 h-full">
                <TeamRecommendations
                  teamRecommendations={teamRecommendations}
                  selectedEmblems={deferredSelectedEmblems}
                  level={deferredLevel}
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
  return (
    <LanguageProvider>
      <MainLayout />
    </LanguageProvider>
  );
}
