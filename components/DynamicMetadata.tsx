"use client";

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function DynamicMetadata() {
    const t = useTranslations('metadata');

    useEffect(() => {
        document.title = t('title');

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', t('description'));
        }
    }, [t]);

    return null;
}
