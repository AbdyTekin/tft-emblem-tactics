"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import enChampions from '@/lib/set16-champions-en.json';
import trChampions from '@/lib/set16-champions-tr.json';
import { Champion } from '@/types/tft';

type Language = 'en' | 'tr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    champions: Champion[];
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        search: "Search",
        team_generator: "Team Generator",
        traits: "Traits",
        cost: "Cost",
        reset: "Reset",
    },
    tr: {
        search: "Ara",
        team_generator: "Takım Oluşturucu",
        traits: "Özellikler",
        cost: "Bedel",
        reset: "Sıfırla",
    }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const champions = language === 'en' ? (enChampions as unknown as Champion[]) : (trChampions as unknown as Champion[]);

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, champions, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTFT() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTFT must be used within a LanguageProvider');
    }
    return context;
}
