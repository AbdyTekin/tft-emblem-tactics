"use client";

import { useState } from 'react';

const TraitIcon = ({ trait, className }: { trait: string, className?: string }) => {
    const normalizedTrait = trait.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Potential URL patterns based on CDragon Set 17 paths
    const customIconNames: Record<string, string> = {
        'anima': 'trait_icon_17_animatech.tft_set17.png',
        'psionic': 'trait_icon_17_psyops.tft_set17.png',
        'sniper': 'trait_icon_6_sniper.png',
        'vanguard': 'trait_icon_12_vanguard.tft_set12.png',
        'eradicator': 'trait_icon_17_singularity.tft_set17.png',
        'marauder': 'trait_icon_16_slayer.png',
        'brawler': 'trait_icon_brawler.png',
        'meeple': 'trait_icon_17_astronaut.tft_set17.png',
        'conduit': 'trait_icon_17_channeler.tft_set17.png',
        'oracle': 'trait_icon_12_arcana.tft_set12.png'
    };

    let urls: string[] = [];
    if (customIconNames[normalizedTrait]) {
        urls.push(`https://raw.communitydragon.org/latest/game/assets/ux/traiticons/${customIconNames[normalizedTrait]}`);
    }

    urls.push(
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_17_${normalizedTrait}.tft_set17.png`,
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_17_${normalizedTrait}.png`,
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_16_${normalizedTrait}.png`, // Legacy fallback
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_9_${normalizedTrait}.png` // Generic fallback
    );

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
        <div className={`${className} relative inline-block align-middle`} style={{ width: '20px', height: '20px' }}> {/* Enforce dimensions if not provided, or rely on className */}
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
