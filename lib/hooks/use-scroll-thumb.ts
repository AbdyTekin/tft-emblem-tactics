"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';

type Axis = 'x' | 'y';

/**
 * Drives a custom scrollbar thumb for a native scroll container.
 * Thumb size and position are written straight to the DOM, so scrolling never re-renders the owner.
 * The track starts hidden (render it with `display: none`) and is shown only when the content overflows.
 */
export function useScrollThumb(axis: Axis) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ active: false, pointer: 0, scroll: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const update = useCallback(() => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        const thumb = thumbRef.current;
        if (!viewport || !track || !thumb) return;

        const size = axis === 'y' ? viewport.clientHeight : viewport.clientWidth;
        const total = axis === 'y' ? viewport.scrollHeight : viewport.scrollWidth;
        const offset = axis === 'y' ? viewport.scrollTop : viewport.scrollLeft;

        if (total <= size) {
            track.style.display = 'none';
            return;
        }
        track.style.display = '';

        const thumbSize = Math.max((size / total) * size, 20);
        const thumbOffset = (offset / (total - size)) * (size - thumbSize);
        if (axis === 'y') {
            thumb.style.height = `${thumbSize}px`;
            thumb.style.transform = `translateY(${thumbOffset}px)`;
        } else {
            thumb.style.width = `${thumbSize}px`;
            thumb.style.transform = `translateX(${thumbOffset}px)`;
        }
    }, [axis]);

    // Re-measure after every render: content can grow without resizing any observed element
    // (e.g. a child sized to 100% of the viewport whose own content overflows).
    useLayoutEffect(update);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        // ResizeObserver covers later size changes: window resizes, fonts and images loading, and child growth.
        const resizeObserver = new ResizeObserver(update);
        const observeAll = () => {
            resizeObserver.disconnect();
            resizeObserver.observe(viewport);
            for (const child of Array.from(viewport.children)) resizeObserver.observe(child);
        };
        observeAll();
        const mutationObserver = new MutationObserver(observeAll);
        mutationObserver.observe(viewport, { childList: true });
        viewport.addEventListener('scroll', update, { passive: true });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            viewport.removeEventListener('scroll', update);
        };
    }, [update]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        e.preventDefault();
        // Capture keeps the drag going when the pointer leaves the thumb
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStart.current = {
            active: true,
            pointer: axis === 'y' ? e.clientY : e.clientX,
            scroll: axis === 'y' ? viewport.scrollTop : viewport.scrollLeft,
        };
        setIsDragging(true);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const viewport = viewportRef.current;
        if (!viewport || !dragStart.current.active) return;

        const size = axis === 'y' ? viewport.clientHeight : viewport.clientWidth;
        const total = axis === 'y' ? viewport.scrollHeight : viewport.scrollWidth;
        const thumbSize = axis === 'y' ? e.currentTarget.offsetHeight : e.currentTarget.offsetWidth;
        const trackLength = size - thumbSize;
        if (trackLength <= 0) return;

        const delta = (axis === 'y' ? e.clientY : e.clientX) - dragStart.current.pointer;
        const next = dragStart.current.scroll + (delta / trackLength) * (total - size);
        if (axis === 'y') viewport.scrollTop = next;
        else viewport.scrollLeft = next;
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        dragStart.current.active = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        setIsDragging(false);
    };

    return {
        viewportRef,
        trackRef,
        thumbRef,
        isDragging,
        thumbHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onLostPointerCapture: endDrag,
        },
    };
}
