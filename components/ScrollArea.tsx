"use client";

import React, { useState } from 'react';
import { useScrollThumb } from '@/lib/hooks/use-scroll-thumb';

interface ScrollAreaProps {
    children: React.ReactNode;
    className?: string;
    /** Sizing classes for the scrolling viewport. */
    viewportClassName?: string;
    /** Positioning classes for the scrollbar track. */
    trackClassName?: string;
}

export default function ScrollArea({
    children,
    className = '',
    viewportClassName = 'h-full w-full',
    trackClassName = 'right-[-15px]',
}: ScrollAreaProps) {
    const { viewportRef, trackRef, thumbRef, isDragging, thumbHandlers } = useScrollThumb('y');
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div
            className={`relative overflow-visible ${className}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div ref={viewportRef} className={`${viewportClassName} overflow-y-auto scrollbar-none`}>
                {children}
            </div>

            {/* Scrollbar Track/Thumb */}
            <div
                ref={trackRef}
                style={{ display: 'none' }}
                className={`absolute top-0 w-3 h-full transition-opacity duration-200 ${trackClassName} ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'}`}
            >
                <div
                    ref={thumbRef}
                    {...thumbHandlers}
                    className={`w-full rounded-full cursor-pointer touch-none hover:bg-white/30 ${isDragging ? 'bg-white/40' : 'bg-white/20'}`}
                    style={{ transition: isDragging ? 'none' : 'transform 0.05s linear' }}
                />
            </div>
        </div>
    );
}
