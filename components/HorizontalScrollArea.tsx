"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useScrollThumb } from '@/lib/hooks/use-scroll-thumb';

interface HorizontalScrollAreaProps {
    children: React.ReactNode;
    className?: string;
}

export default function HorizontalScrollArea({ children, className = '' }: HorizontalScrollAreaProps) {
    const { viewportRef, trackRef, thumbRef, isDragging, thumbHandlers } = useScrollThumb('x');
    const [isHovering, setIsHovering] = useState(false);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    }, []);

    return (
        <div
            className={`relative overflow-visible ${className}`}
            onMouseEnter={() => {
                if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }
                setIsHovering(true);
            }}
            onMouseLeave={() => {
                hoverTimeout.current = setTimeout(() => setIsHovering(false), 150);
            }}
        >
            <div ref={viewportRef} className="h-full w-full overflow-x-auto scrollbar-none flex items-center">
                {children}
            </div>

            {/* Invisible hover-extension zone below the content to bridge gap to scrollbar */}
            <div className="absolute left-0 right-0 top-full h-[34px]" style={{ pointerEvents: 'auto' }} />

            {/* Scrollbar Track/Thumb */}
            <div
                ref={trackRef}
                style={{ display: 'none' }}
                className={`absolute bottom-[-22px] left-0 h-3 w-full transition-opacity duration-200 ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'}`}
            >
                <div
                    ref={thumbRef}
                    {...thumbHandlers}
                    className={`h-full rounded-full cursor-pointer touch-none hover:bg-white/30 ${isDragging ? 'bg-white/40' : 'bg-white/20'}`}
                    style={{ transition: isDragging ? 'none' : 'transform 0.05s linear' }}
                />
            </div>
        </div>
    );
}
