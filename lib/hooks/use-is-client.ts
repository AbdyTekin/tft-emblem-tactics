"use client";

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False during static prerender and hydration, true afterwards. Use it to guard `document`-only code such as portals. */
export function useIsClient(): boolean {
    return useSyncExternalStore(subscribe, () => true, () => false);
}
