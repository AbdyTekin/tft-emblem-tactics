"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ScrollAreaProps {
    children: React.ReactNode;
    className?: string;
}

export default function ScrollArea({ children, className = '' }: ScrollAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartScrollTop = useRef(0);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

        if (scrollHeight <= clientHeight) {
            setThumbHeight(0);
            return;
        }

        const newThumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 20);
        const maxTop = clientHeight - newThumbHeight;
        const scrollRatio = scrollTop / (scrollHeight - clientHeight);

        setThumbHeight(newThumbHeight);
        setThumbTop(scrollRatio * maxTop);
    }, []);

    const handleDragStart = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartScrollTop.current = scrollRef.current.scrollTop;
        e.preventDefault(); // Prevent text selection
    };

    useEffect(() => {
        const handleDragMove = (e: MouseEvent) => {
            if (!isDragging || !scrollRef.current) return;

            const deltaY = e.clientY - dragStartY.current;
            const { scrollHeight, clientHeight } = scrollRef.current;
            const maxScrollTop = scrollHeight - clientHeight;

            // Calculate how much we should scroll based on how much the thumb moved
            const maxThumbTop = clientHeight - thumbHeight;
            if (maxThumbTop <= 0) return;

            const scrollRatio = deltaY / maxThumbTop;
            const scrollAmount = scrollRatio * maxScrollTop;

            scrollRef.current.scrollTop = dragStartScrollTop.current + scrollAmount;
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
    }, [isDragging, thumbHeight]);

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
            className={`relative overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                ref={scrollRef}
                className="h-full w-full overflow-y-auto scrollbar-none"
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
            {thumbHeight > 0 && (
                <div
                    className={`absolute right-1 top-0 w-1.5 h-full transition-opacity duration-200 ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div
                        className={`w-full bg-white/20 rounded-full cursor-pointer hover:bg-white/30 active:bg-white/40 transition-colors ${isDragging ? 'bg-white/40' : ''}`}
                        style={{
                            height: `${thumbHeight}px`,
                            transform: `translateY(${thumbTop}px)`,
                            transition: isDragging ? 'none' : 'transform 0.05s linear'
                        }}
                        onMouseDown={handleDragStart}
                    />
                </div>
            )}
        </div>
    );
}
