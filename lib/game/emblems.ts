import { MAX_ITEMS_PER_UNIT } from '@/lib/game/rules';
import type { Champion } from '@/lib/game/types';

/**
 * Chooses a holder for every emblem, or null when none can take it.
 *
 * An emblem only adds its trait on a unit that doesn't already have that trait, a unit counts once per
 * trait (so two copies of one emblem need two holders), and a unit holds at most three items.
 * This is a flow problem (emblem traits -> eligible units -> item slots). Emblems are placed in order,
 * rerouting earlier ones when that frees a holder, so the result places as many emblems as possible
 * and, among those placements, prefers emblems that come first in `emblems`.
 */
export function assignEmblems(team: readonly Champion[], emblems: readonly string[]): (number | null)[] {
    const traits = [...new Set(emblems)];
    const T = traits.length;
    const U = team.length;
    // Node ids: 0 = source, 1..T = emblem traits, T+1..T+U = units, T+U+1 = sink
    const size = T + U + 2;
    const sink = size - 1;
    const capacity = Array.from({ length: size }, () => new Array<number>(size).fill(0));

    traits.forEach((trait, t) => {
        team.forEach((unit, u) => {
            if (!unit.traits.includes(trait)) capacity[1 + t][1 + T + u] = 1;
        });
    });
    team.forEach((_, u) => { capacity[1 + T + u][sink] = MAX_ITEMS_PER_UNIT; });

    const flow = Array.from({ length: size }, () => new Array<number>(size).fill(0));
    const residual = (a: number, b: number) => capacity[a][b] - flow[a][b];

    // Breadth-first search for a path from `start` to the sink in the residual graph.
    const augmentFrom = (start: number): boolean => {
        const parent = new Array<number>(size).fill(-1);
        parent[start] = start;
        const queue = [start];
        while (queue.length) {
            const node = queue.shift()!;
            for (let next = 1; next < size; next++) {
                if (parent[next] !== -1 || residual(node, next) <= 0) continue;
                parent[next] = node;
                if (next === sink) {
                    for (let v = sink; v !== start; v = parent[v]) {
                        flow[parent[v]][v] += 1;
                        flow[v][parent[v]] -= 1;
                    }
                    return true;
                }
                queue.push(next);
            }
        }
        return false;
    };

    const placed = new Map<string, number>();
    for (const trait of emblems) {
        if (augmentFrom(1 + traits.indexOf(trait))) placed.set(trait, (placed.get(trait) ?? 0) + 1);
    }

    // Hand out the chosen holders to the emblems, in order
    const holders = new Map(traits.map((trait, t) => [
        trait,
        team.map((_, u) => u).filter(u => flow[1 + t][1 + T + u] > 0),
    ]));
    return emblems.map(trait => {
        const left = placed.get(trait) ?? 0;
        if (left === 0) return null;
        placed.set(trait, left - 1);
        return holders.get(trait)!.shift() ?? null;
    });
}
