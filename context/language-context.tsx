"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { CHAMPIONS } from '@/lib/game/data';
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

// Language preference: the player's choice (saved), else the browser language. The static page is
// rendered in Turkish and switches right after hydration when the preference differs.
const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE: Language = 'tr';
const listeners = new Set<() => void>();
let chosen: Language | null = null; // survives when storage is unavailable (private mode)

function readLanguage(): Language {
    if (chosen) return chosen;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'tr') return saved;
    } catch {
        // Storage blocked: fall through to the browser language
    }
    return navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

function writeLanguage(language: Language) {
    chosen = language;
    try {
        localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // Not persisted; the in-memory choice still applies
    }
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const language = useSyncExternalStore(subscribe, readLanguage, () => DEFAULT_LANGUAGE);

    const champions = CHAMPIONS as Champion[];

    return (
        <LanguageContext.Provider value={{ language, setLanguage: writeLanguage, champions }}>
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
