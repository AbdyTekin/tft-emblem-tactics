"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HoverCardProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string; // For trigger wrapper
}

export default function HoverCard({ trigger, children, className = "" }: HoverCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
            >
                {trigger}
            </div>

            {mounted && isOpen && createPortal(
                <div
                    style={tooltipStyle}
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
