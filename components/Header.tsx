"use client";

import { useTFT } from '@/context/language-context';
import { useTranslations } from 'next-intl';

export default function Header() {
    const { language, setLanguage } = useTFT();
    const t = useTranslations();

    return (
        <header className="w-full border-b border-white/10 bg-black/20 backdrop-blur-md">
            <div className="container mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                        <span className="font-bold text-indigo-400">TFT</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {t('team_generator')}
                    </h1>
                </div>

                <button
                    onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                    className="relative inline-flex h-10 w-20 cursor-pointer items-center rounded-full bg-gray-800 border border-white/10 transition-colors ring-2 ring-gray-800 ring-offset-[1.5px] ring-offset-gray-900"
                >
                    <span className="sr-only">Toggle Language</span>
                    <span
                        className={`${language === 'tr' ? 'translate-x-[43px]' : 'translate-x-1'
                            } inline-block h-8 w-8 transform rounded-full bg-indigo-500 transition-transform shadow-lg`}
                    />
                    <span className={`absolute left-3 text-xs font-medium ${language === 'en' ? 'text-white' : 'text-gray-500'}`}>EN</span>
                    <span className={`absolute right-3 text-xs font-medium ${language === 'tr' ? 'text-white' : 'text-gray-500'}`}>TR</span>
                </button>
            </div>
        </header>
    );
}
