"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface HorizontalScrollAreaProps {
    children: React.ReactNode;
    className?: string;
}

export default function HorizontalScrollArea({ children, className = '' }: HorizontalScrollAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [thumbWidth, setThumbWidth] = useState(0);
    const [thumbLeft, setThumbLeft] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartScrollLeft = useRef(0);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        if (scrollWidth <= clientWidth) {
            setThumbWidth(0);
            return;
        }

        const newThumbWidth = Math.max((clientWidth / scrollWidth) * clientWidth, 20);
        const maxLeft = clientWidth - newThumbWidth;
        const scrollRatio = scrollLeft / (scrollWidth - clientWidth);

        setThumbWidth(newThumbWidth);
        setThumbLeft(scrollRatio * maxLeft);
    }, []);

    const handleDragStart = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        dragStartX.current = e.clientX;
        dragStartScrollLeft.current = scrollRef.current.scrollLeft;
        e.preventDefault(); // Prevent text selection
    };

    useEffect(() => {
        const handleDragMove = (e: MouseEvent) => {
            if (!isDragging || !scrollRef.current) return;

            const deltaX = e.clientX - dragStartX.current;
            const { scrollWidth, clientWidth } = scrollRef.current;
            const maxScrollLeft = scrollWidth - clientWidth;

            // Calculate how much we should scroll based on how much the thumb moved
            const maxThumbLeft = clientWidth - thumbWidth;
            if (maxThumbLeft <= 0) return;

            const scrollRatio = deltaX / maxThumbLeft;
            const scrollAmount = scrollRatio * maxScrollLeft;

            scrollRef.current.scrollLeft = dragStartScrollLeft.current + scrollAmount;
        };

        const handleDragEnd = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        } else {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, thumbWidth]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        // Initial calculation
        handleScroll();

        // Recalculate on resize
        const observer = new ResizeObserver(handleScroll);
        observer.observe(element);
        element.addEventListener('scroll', handleScroll);

        return () => {
            observer.disconnect();
            element.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll, children]);

    return (
        <div
            className={`relative overflow-visible ${className}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                ref={scrollRef}
                className="h-full w-full overflow-x-auto scrollbar-none flex items-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Hide webkit scrollbar */}
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {children}
            </div>

            {/* Scrollbar Track/Thumb */}
            {thumbWidth > 0 && (
                <div
                    className={`absolute bottom-[-22px] left-0 h-3 w-full transition-opacity duration-200 ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div
                        className={`h-full bg-white/20 rounded-full cursor-pointer hover:bg-white/30 active:bg-white/40 transition-colors ${isDragging ? 'bg-white/40' : ''}`}
                        style={{
                            width: `${thumbWidth}px`,
                            transform: `translateX(${thumbLeft}px)`,
                            transition: isDragging ? 'none' : 'transform 0.05s linear'
                        }}
                        onMouseDown={handleDragStart}
                    />
                </div>
            )}
        </div>
    );
}
