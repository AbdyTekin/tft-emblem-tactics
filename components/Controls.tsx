"use client";

import React from 'react';
import { SolverStrategy } from '@/lib/solver';

interface ControlsProps {
    level: number;
    setLevel: (level: number) => void;
    strategy: SolverStrategy;
    setStrategy: (strategy: SolverStrategy) => void;
}

export default function Controls({ level, setLevel, strategy, setStrategy }: ControlsProps) {
    return (
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
            <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strategy</span>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        {
                            id: 'RegionRyze',
                            label: 'Region Ryze',
                            desc: 'Prioritize regional traits',
                            icon: (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )
                        },
                        {
                            id: 'BronzeLife',
                            label: 'Bronze for Life',
                            desc: 'Maximize active traits count',
                            icon: (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            )
                        },
                    ].map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setStrategy(option.id as SolverStrategy)}
                            className={`relative flex items-center w-full p-2.5 rounded-xl border transition-all duration-300 group text-left
                ${strategy === option.id
                                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-800/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] translate-x-1'
                                    : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5 hover:translate-x-0.5'
                                }
              `}
                        >
                            <div className={`p-2 rounded-lg mr-3 transition-colors duration-300 ${strategy === option.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-800 group-hover:text-gray-300'
                                }`}>
                                {option.icon}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${strategy === option.id ? 'text-indigo-200' : 'text-gray-400 group-hover:text-gray-200'
                                    }`}>
                                    {option.label}
                                </span>
                                <span className="text-[10px] text-gray-600 font-medium truncate group-hover:text-gray-500 transition-colors">
                                    {option.desc}
                                </span>
                            </div>
                            {strategy === option.id && (
                                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,1)] animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
