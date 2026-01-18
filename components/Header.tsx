"use client";

import React from 'react';
import { useTFT } from '@/context/language-context';

export default function Header() {
    const { language, setLanguage } = useTFT();

    return (
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
    );
}
