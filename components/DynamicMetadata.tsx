"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

/** Keeps the document language, title and description in sync with the selected UI language. */
export default function DynamicMetadata() {
    const t = useTranslations('metadata');
    const locale = useLocale();

    useEffect(() => {
        // Screen readers and CSS text-transform (Turkish dotted İ) depend on the document language
        document.documentElement.lang = locale;
        document.title = t('title');

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', t('description'));
        }
    }, [t, locale]);

    return null;
}
