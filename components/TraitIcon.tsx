"use client";

import React, { useState } from 'react';

const TraitIcon = ({ trait, className }: { trait: string, className?: string }) => {
    const normalizedTrait = trait.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Potential URL patterns based on user feedback and common CDragon patterns
    const urls = [
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_16_${normalizedTrait}.tft_set16.png`,
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_16_${normalizedTrait}.png`,
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_9_${normalizedTrait}.png`, // Specific case for Bilgewater/Legacy
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_4_${normalizedTrait}.png` // Generic fallback
    ];

    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (currentUrlIndex < urls.length - 1) {
            setCurrentUrlIndex(prev => prev + 1);
        } else {
            setHasError(true);
        }
    };

    if (hasError) {
        // Fallback UI or empty
        return null;
    }

    return (
        <img
            src={urls[currentUrlIndex]}
            alt={trait}
            className={className}
            onError={handleError}
        />
    );
};

export default TraitIcon;
