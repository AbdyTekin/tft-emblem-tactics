// Web Worker entry: runs the solver off the main thread (see lib/hooks/use-team-solver.ts).
import { solveTeams, type SolveRequest, type SolveResult } from '@/lib/solver';

export interface SolverRequestMessage {
    key: string;
    request: SolveRequest;
}

export interface SolverResponseMessage {
    key: string;
    result: SolveResult;
}

const scope = self as unknown as {
    onmessage: ((event: MessageEvent<SolverRequestMessage>) => void) | null;
    postMessage(message: SolverResponseMessage): void;
};

scope.onmessage = event => {
    const { key, request } = event.data;
    scope.postMessage({ key, result: solveTeams(request) });
};
