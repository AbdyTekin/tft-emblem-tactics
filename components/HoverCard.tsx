"use client";

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from '@/lib/hooks/use-is-client';

interface HoverCardProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string; // For trigger wrapper
}

export default function HoverCard({ trigger, children, className = "" }: HoverCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const isClient = useIsClient();

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Calculate center top position
            setCoords({
                top: rect.top + window.scrollY - 8, // 8px Offset above
                left: rect.left + window.scrollX + (rect.width / 2)
            });
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        setIsOpen(false);
    };

    // calculate position style
    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translate(-50%, -100%)', // Center horizontally, move above
        zIndex: 9999, // Ensure it's on top of everything
        pointerEvents: 'none', // Cannot hover the tooltip itself
    };

    return (
        <>
            <div
                ref={triggerRef}
                className={`relative flex items-center justify-center ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleMouseEnter}
                onBlur={handleMouseLeave}
            >
                {trigger}
            </div>

            {isClient && isOpen && createPortal(
                <div
                    style={tooltipStyle}
                    role="tooltip"
                    className="transition-opacity duration-200 ease-out"
                >
                    <div className="bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg shadow-xl px-3 py-2 whitespace-nowrap relative mb-0">
                        {children}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
