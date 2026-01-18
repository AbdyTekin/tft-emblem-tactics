"use client";

import React, { useState, useMemo } from 'react';
import { LanguageProvider, useTFT } from '@/context/language-context';
import { solveTeamComp, SolverStrategy } from '@/lib/solver';
import { getEmblemTraits } from '@/lib/trait-rules';
import Header from '@/components/Header';
import Controls from '@/components/Controls';
import TraitList from '@/components/TraitList';
import TeamRecommendations from '@/components/TeamRecommendations';

function MainLayout() {
  const { champions } = useTFT();

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
      <Header />

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Panel: Emblem Selector */}
        <div className="lg:col-span-3 flex flex-col gap-4">
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

        {/* Right Panel: Team Recommendations */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <TeamRecommendations
            teamRecommendations={teamRecommendations}
            selectedEmblems={selectedEmblems}
            level={level}
          />
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
