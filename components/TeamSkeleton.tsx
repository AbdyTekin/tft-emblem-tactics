"use client";

import React from 'react';

export default function TeamSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden backdrop-blur-sm shadow-xl p-4 animate-pulse">
                    {/* Synergies & Score Row Skeleton */}
                    <div className="mb-4 flex items-start justify-between gap-4">
                        {/* Synergies Skeleton */}
                        <div className="flex flex-wrap gap-2 flex-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-6 w-16 bg-white/5 rounded-full border border-white/5"></div>
                            ))}
                        </div>

                        {/* Score Skeleton */}
                        <div className="h-8 w-32 bg-white/5 rounded-lg border border-white/5"></div>
                    </div>

                    {/* Champions Grid Skeleton */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/5"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
