"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import enChampions from '@/lib/set16-champions.json';
import enMessages from '@/messages/en.json';
import trMessages from '@/messages/tr.json';
import { Champion } from '@/types/tft';

type Language = 'en' | 'tr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    champions: Champion[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const messages = {
    en: enMessages,
    tr: trMessages,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('tr');

    const champions = enChampions as unknown as Champion[];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, champions }}>
            <NextIntlClientProvider locale={language} messages={messages[language]} timeZone="UTC">
                {children}
            </NextIntlClientProvider>
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
