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
        return null;
    }

    return (
        <div className={`${className} relative inline-block align-middle`} style={{ width: '18px', height: '18px' }}> {/* Enforce dimensions if not provided, or rely on className */}
            {/* The actual image element handles loading and errors, but is hidden */}
            <img
                src={urls[currentUrlIndex]}
                alt={trait}
                className="absolute inset-0 w-full h-full opacity-0 z-0"
                onError={handleError}
            />
            {/* The visible element uses the image as a mask and takes the background color (currentColor) */}
            <div
                className="absolute inset-0 bg-current z-10"
                style={{
                    maskImage: `url(${urls[currentUrlIndex]})`,
                    WebkitMaskImage: `url(${urls[currentUrlIndex]})`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center'
                }}
            />
        </div>
    );
};

export default TraitIcon;
