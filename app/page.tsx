"use client";

import React, { useMemo } from 'react';
import type { SolveRequest } from '@/lib/solver';
import { EMBLEM_TRAITS } from '@/lib/game/data';
import { usePlannerState } from '@/lib/hooks/use-planner-state';
import { useTeamSolver } from '@/lib/hooks/use-team-solver';
import Header from '@/components/Header';
import Controls from '@/components/Controls';
import TraitList from '@/components/TraitList';
import ChampionSelector from '@/components/ChampionSelector';
import TeamRecommendations from '@/components/TeamRecommendations';
import ScrollArea from '@/components/ScrollArea';

function MainLayout() {
  // Settings live in the URL, so every setup is a shareable link
  const [planner, update] = usePlannerState();
  const { emblems, level, bonusTeamSize, strategy, locked, rivalsAugment, evolvedKhazix } = planner;

  const request = useMemo<SolveRequest | null>(() => {
    // No emblems selected: nothing to build around, even when champions are locked.
    if (emblems.length === 0) return null;
    return {
      emblems,
      level,
      bonusTeamSize,
      strategy,
      locked: locked.map(c => c.apiName),
      rivalsAugment,
      evolvedKhazix,
    };
  }, [emblems, level, bonusTeamSize, strategy, locked, rivalsAugment, evolvedKhazix]);

  // Solved in a Web Worker; the previous result stays on screen (dimmed) until the new one arrives.
  const { solution, solving } = useTeamSolver(request);

  const addEmblem = (trait: string) => update(s => ({ emblems: [...s.emblems, trait] }));

  const removeEmblem = (trait: string) => update(s => {
    const index = s.emblems.lastIndexOf(trait);
    return index === -1 ? {} : { emblems: [...s.emblems.slice(0, index), ...s.emblems.slice(index + 1)] };
  });

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
                setLevel={value => update({ level: value })}
                bonusTeamSize={bonusTeamSize}
                setBonusTeamSize={value => update({ bonusTeamSize: value })}
                strategy={strategy}
                setStrategy={value => update({ strategy: value })}
                rivalsAugment={rivalsAugment}
                setRivalsAugment={value => update({ rivalsAugment: value })}
                evolvedKhazix={evolvedKhazix}
                setEvolvedKhazix={value => update(s => ({
                  evolvedKhazix: value,
                  // Evolved variants only exist while the option is on
                  locked: value ? s.locked : s.locked.filter(c => !c.apiName.includes(':')),
                }))}
              />

              <ChampionSelector
                initialTeam={locked}
                setInitialTeam={team => update({ locked: team })}
                boardSize={{ level, bonusTeamSize }}
                evolvedKhazix={evolvedKhazix}
              />

              <TraitList
                availableTraits={EMBLEM_TRAITS}
                selectedEmblems={emblems}
                addEmblem={addEmblem}
                removeEmblem={removeEmblem}
                resetEmblems={() => update({ emblems: [] })}
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
