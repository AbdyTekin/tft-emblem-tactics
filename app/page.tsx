"use client";

import React, { useState, useMemo } from 'react';
import type { SolveRequest, Strategy } from '@/lib/solver';
import { EMBLEM_TRAITS } from '@/lib/game/data';
import { useTeamSolver } from '@/lib/hooks/use-team-solver';
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
  const [bonusTeamSize, setBonusTeamSize] = useState<number>(0);
  const [strategy, setStrategy] = useState<Strategy>('BronzeLife');
  const [rivalsAugment, setRivalsAugment] = useState(false);
  const [evolvedKhazix, setEvolvedKhazix] = useState(false);
  const [initialTeam, setInitialTeam] = useState<Champion[]>([]);

  const request = useMemo<SolveRequest | null>(() => {
    // No emblems selected: nothing to build around, even when champions are locked.
    if (selectedEmblems.length === 0) return null;
    return {
      emblems: selectedEmblems,
      level,
      bonusTeamSize,
      strategy,
      locked: initialTeam.map(c => c.apiName),
      rivalsAugment,
      evolvedKhazix,
    };
  }, [selectedEmblems, level, bonusTeamSize, strategy, initialTeam, rivalsAugment, evolvedKhazix]);

  // Solved in a Web Worker; the previous result stays on screen (dimmed) until the new one arrives.
  const { solution, solving } = useTeamSolver(request);

  const addEmblem = (trait: string) => {
    setSelectedEmblems(prev => [...prev, trait]);
  };

  const removeEmblem = (trait: string) => {
    setSelectedEmblems(prev => {
      const index = prev.lastIndexOf(trait);
      return index === -1 ? prev : [...prev.slice(0, index), ...prev.slice(index + 1)];
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
                bonusTeamSize={bonusTeamSize}
                setBonusTeamSize={setBonusTeamSize}
                strategy={strategy}
                setStrategy={setStrategy}
                rivalsAugment={rivalsAugment}
                setRivalsAugment={setRivalsAugment}
                evolvedKhazix={evolvedKhazix}
                setEvolvedKhazix={setEvolvedKhazix}
              />

              <ChampionSelector
                initialTeam={initialTeam}
                setInitialTeam={setInitialTeam}
                boardSize={{ level, bonusTeamSize }}
                evolvedKhazix={evolvedKhazix}
              />

              <TraitList
                availableTraits={EMBLEM_TRAITS}
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
                  solution={solution}
                  solving={solving}
                  level={level}
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
