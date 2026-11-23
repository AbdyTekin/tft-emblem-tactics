import type { TeamEvaluation } from '@/lib/game/evaluate';
import type { Champion, TierStyle } from '@/lib/game/types';

export type Strategy = 'Vertical' | 'BronzeLife';

export interface SolveRequest {
    /** One entry per emblem owned, in the order they were picked (the first is the vertical trait). */
    emblems: readonly string[];
    level: number;
    /** Tactician's items and augments that raise team size. */
    bonusTeamSize?: number;
    strategy: Strategy;
    /** apiNames of units that must be on the board. */
    locked?: readonly string[];
    /** Plan for Sona (Producer) featuring one of her 5 band traits. */
    sonaProducer?: boolean;
    /** Number of teams to return (default 20). */
    limit?: number;
    /** Candidate pool override, for tests. Defaults to every Set 19 champion. */
    pool?: readonly Champion[];
}

export interface TeamMetrics {
    /** Active traits whose current tier is bronze (what Bronze For Life counts). */
    bronze: number;
    /** Active origin/class traits. */
    activeTraits: number;
    /** Active origin/class traits at gold or prismatic. */
    goldPlus: number;
    /** Distinct emblem traits that are active. */
    emblemTraitsActive: number;
    /** The first emblem's trait, for the Vertical strategy. */
    vertical: { trait: string; count: number; style: TierStyle | null } | null;
    /** Sum of estimated unlock hardness across unlockable champions on the board (0 when all are base shop units). */
    unlockDifficulty: number;
    cost: number;
}

export interface TeamResult {
    /** Locked units first, then by cost (highest first) and name. */
    champions: Champion[];
    evaluation: TeamEvaluation;
    metrics: TeamMetrics;
    /** Compared element by element, higher is better (see score.ts). */
    score: number[];
}

export type SolveResult =
    | { status: 'ok'; teams: TeamResult[] }
    | { status: 'invalid-lock'; reason: 'duplicate-unit' | 'too-many-slots' };
