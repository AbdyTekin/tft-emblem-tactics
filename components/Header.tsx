"use client";

import { useState } from 'react';
import { useTFT } from '@/context/language-context';
import { useTranslations } from 'next-intl';

export default function Header() {
    const { language, setLanguage } = useTFT();
    const t = useTranslations();
    const [linkCopied, setLinkCopied] = useState(false);

    // The URL holds the whole setup (emblems, level, strategy, locked units)
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            // Clipboard unavailable: the address bar already holds the link
        }
    };

    return (
        <header className="w-full border-b border-white/10 bg-black/20 backdrop-blur-md">
            <div className="container mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 select-none">
                    <div className="size-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                        <span className="font-bold text-indigo-400">TFT</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {t('team_generator')}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={copyLink}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${linkCopied
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-gray-800 border-white/10 text-gray-400 hover:text-indigo-300 hover:border-indigo-500/40'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        {linkCopied ? t('copied') : t('share_link')}
                    </button>

                    <button
                        onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                        aria-label={t('switch_language')}
                        className="relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full bg-gray-800 border border-white/10 transition-colors ring-1 ring-gray-800 ring-offset-[1px] ring-offset-gray-900"
                    >
                        <span
                            className={`${language === 'tr' ? 'translate-x-[33px]' : 'translate-x-[5px]'
                                } inline-block h-6 w-6 transform rounded-full bg-indigo-500 transition-transform shadow-lg`}
                        />
                        <span aria-hidden="true" className={`absolute left-2.5 text-xs font-medium ${language === 'en' ? 'text-white' : 'text-gray-500'}`}>EN</span>
                        <span aria-hidden="true" className={`absolute right-2.5 text-xs font-medium ${language === 'tr' ? 'text-white' : 'text-gray-500'}`}>TR</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
