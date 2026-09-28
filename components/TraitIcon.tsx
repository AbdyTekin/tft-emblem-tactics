"use client";

import { useState } from 'react';

const TraitIcon = ({ trait, className }: { trait: string, className?: string }) => {
    const normalizedTrait = trait.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Custom Icon file mappings based on CDragon Set 18 paths
    const customIconNames: Record<string, string> = {
        'blackthorn': 'trait_icon_18_oldgod.png',
        'thornmaiden': 'trait_icon_18_zyraorigin.png',
    };

    const urls: string[] = [];
    if (customIconNames[normalizedTrait]) {
        urls.push(`https://raw.communitydragon.org/latest/game/assets/ux/traiticons/${customIconNames[normalizedTrait]}`);
    }

    urls.push(
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_${normalizedTrait}.png`,
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_${normalizedTrait}.tft_set18.png`,
        `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_${normalizedTrait}.png`
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
        <div className={`${className} relative inline-block align-middle`} style={{ width: '20px', height: '20px' }}>
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
