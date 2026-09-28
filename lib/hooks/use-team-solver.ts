"use client";

import { useEffect, useRef, useState } from 'react';
import { solveTeams, type SolveRequest, type SolveResult } from '@/lib/solver';
import type { SolverRequestMessage, SolverResponseMessage } from '@/lib/solver/worker';

/** A result together with the request that produced it. */
export interface Solution {
    request: SolveRequest;
    result: SolveResult;
}

/** Recent results kept for instant back-and-forth (e.g. toggling the strategy). */
const CACHE_SIZE = 24;

interface Solved {
    /** Solutions by request key, oldest first. */
    cache: Map<string, Solution>;
    /** The most recent solution received, shown (dimmed) while the next one is computed. */
    last: Solution | null;
}

/**
 * Solves in a Web Worker so the page never freezes. While a request is running, only the newest
 * request waits behind it; intermediate ones are dropped. Falls back to the main thread when workers
 * are unavailable or crash.
 */
export function useTeamSolver(request: SolveRequest | null): { solution: Solution | null; solving: boolean } {
    const key = request ? JSON.stringify(request) : null;
    const [solved, setSolved] = useState<Solved>({ cache: new Map(), last: null });
    const worker = useRef<Worker | null>(null);
    const inFlight = useRef<SolverRequestMessage | null>(null);
    const queued = useRef<SolverRequestMessage | null>(null);
    const dispatch = useRef<() => void>(() => {});

    useEffect(() => {
        const finish = (response: SolverResponseMessage) => {
            const solution = { request: JSON.parse(response.key) as SolveRequest, result: response.result };
            inFlight.current = null;
            setSolved(prev => {
                const cache = new Map(prev.cache);
                cache.delete(response.key);
                cache.set(response.key, solution);
                while (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
                return { cache, last: solution };
            });
            dispatch.current();
        };
        const run = (message: SolverRequestMessage) => {
            inFlight.current = message;
            if (worker.current) worker.current.postMessage(message);
            else setTimeout(() => finish({ key: message.key, result: solveTeams(message.request) }), 0);
        };
        dispatch.current = () => {
            if (inFlight.current || !queued.current) return;
            const next = queued.current;
            queued.current = null;
            run(next);
        };

        try {
            const instance = new Worker(new URL('../solver/worker.ts', import.meta.url));
            instance.onmessage = (event: MessageEvent<SolverResponseMessage>) => finish(event.data);
            instance.onerror = () => {
                instance.terminate();
                worker.current = null;
                // Redo the lost request on the main thread
                const lost = inFlight.current;
                inFlight.current = null;
                if (lost) run(lost);
            };
            worker.current = instance;
        } catch {
            worker.current = null;
        }
        dispatch.current();

        return () => {
            worker.current?.terminate();
            worker.current = null;
            inFlight.current = null;
            queued.current = null;
        };
    }, []);

    useEffect(() => {
        if (!key || !request || solved.cache.has(key) || inFlight.current?.key === key) return;
        queued.current = { key, request };
        dispatch.current();
    }, [key, request, solved.cache]);

    const current = key ? solved.cache.get(key) : undefined;
    return {
        solution: key ? current ?? solved.last : null,
        solving: key !== null && current === undefined,
    };
}
