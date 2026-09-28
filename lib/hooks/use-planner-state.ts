"use client";

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { parsePlannerState, serializePlannerState, type PlannerState } from '@/lib/planner-url';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener('popstate', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('popstate', listener);
    };
}

type Change = Partial<PlannerState> | ((current: PlannerState) => Partial<PlannerState>);

/**
 * Planner settings stored in the URL query (shareable links). The static page renders the defaults,
 * then picks up the link's settings right after hydration.
 */
export function usePlannerState(): [PlannerState, (change: Change) => void] {
    const search = useSyncExternalStore(subscribe, () => window.location.search, () => '');
    const state = useMemo(() => parsePlannerState(search), [search]);

    const update = useCallback((change: Change) => {
        const current = parsePlannerState(window.location.search);
        const next = { ...current, ...(typeof change === 'function' ? change(current) : change) };
        const query = serializePlannerState(next);
        window.history.replaceState(window.history.state, '', query ? `?${query}` : window.location.pathname);
        listeners.forEach(listener => listener());
    }, []);

    return [state, update];
}
