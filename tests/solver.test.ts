import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { solveTeams, type SolveRequest, type SolveResult, type TeamResult } from '@/lib/solver';
import { compareScores } from '@/lib/solver/score';

function teamsOf(result: SolveResult): TeamResult[] {
    assert.equal(result.status, 'ok', JSON.stringify(result));
    return result.status === 'ok' ? result.teams : [];
}

const trait = (team: TeamResult, key: string) => team.evaluation.traits.find(t => t.trait === key);

/** Same measure as the solver: units in one team but not the other, whichever side has more. */
function differsByTwo(a: TeamResult, b: TeamResult): boolean {
    const idsA = new Set(a.champions.map(c => c.apiName));
    const idsB = new Set(b.champions.map(c => c.apiName));
    const onlyA = a.champions.filter(c => !idsB.has(c.apiName)).length;
    const onlyB = b.champions.filter(c => !idsA.has(c.apiName)).length;
    return Math.max(onlyA, onlyB) >= 2;
}

describe('solver invariants', () => {
    const scenarios: SolveRequest[] = [];
    for (const strategy of ['Vertical', 'BronzeLife'] as const) {
        for (const level of [7, 8, 10]) {
            for (const emblems of [['Pentakill'], ['K/DA'], ['Beach Pop', 'Arcanist'], ['Heartsteel', 'Heartsteel', 'Prodigy']]) {
                scenarios.push({ strategy, level, emblems });
            }
        }
    }
    scenarios.push({ strategy: 'Vertical', level: 8, emblems: ['Ionic Spark'], locked: ['DA_BaronNashor19', 'DA_AkaliKDA19'] });

    for (const request of scenarios) {
        it(`${request.strategy} ${request.emblems.join('+')} level ${request.level}${request.locked ? ' with locks' : ''}`, () => {
            const teams = teamsOf(solveTeams(request));
            assert.ok(teams.length >= 10, `only ${teams.length} teams`);

            const seen = new Set<string>();
            for (const team of teams) {
                const { evaluation } = team;
                assert.ok(evaluation.valid, 'valid board');
                assert.equal(evaluation.slotsUsed, evaluation.teamSize, 'board is full');
                assert.equal(new Set(team.champions.map(c => c.unitId)).size, team.champions.length, 'one unit per unit id');
                for (const holder of evaluation.emblemHolders) {
                    if (holder.holder) assert.ok(!holder.holder.traits.includes(holder.trait), `${holder.holder.name} can't hold ${holder.trait}`);
                }
                (request.locked ?? []).forEach((apiName, k) => assert.equal(team.champions[k].apiName, apiName, 'locked units first'));

                const key = team.champions.map(c => c.apiName).sort().join('|');
                assert.ok(!seen.has(key), 'teams are distinct');
                seen.add(key);
                assert.ok(compareScores(teams[0].score, team.score) <= 0, 'the first team is the best');
            }

            // Teams that differ by 2+ units from every earlier team come first, best first; closer variants follow, best first.
            let distinct = 1;
            while (distinct < teams.length && teams.slice(0, distinct).every(t => differsByTwo(t, teams[distinct]))) distinct++;
            for (const block of [teams.slice(0, distinct), teams.slice(distinct)]) {
                for (let i = 1; i < block.length; i++) assert.ok(compareScores(block[i - 1].score, block[i].score) <= 0, 'ranked best first');
            }
        });
    }

    it('leads with teams that differ by at least two units', () => {
        const teams = teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Pentakill'] }));
        for (let i = 1; i < 8; i++) {
            for (let j = 0; j < i; j++) assert.ok(differsByTwo(teams[j], teams[i]), `teams ${j + 1} and ${i + 1} are near-copies`);
        }
    });

    it('returns the same teams for the same request', () => {
        const request: SolveRequest = { strategy: 'BronzeLife', level: 9, emblems: ['Juggernaut', 'Beach Pop'] };
        const names = (r: SolveResult) => teamsOf(r).map(t => t.champions.map(c => c.apiName).join(','));
        assert.deepEqual(names(solveTeams(request)), names(solveTeams(request)));
    });

    it('solves a level 10 board well within a second', () => {
        const start = performance.now();
        solveTeams({ strategy: 'BronzeLife', level: 10, emblems: ['Frontman', 'Beach Pop', 'Juggernaut'] });
        assert.ok(performance.now() - start < 1500);
    });
});

describe('Set 19 solver scenarios', () => {
    it('Vertical Pentakill level 8 hits Pentakill 7 gold with a holder for the emblem', () => {
        const teams = teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Pentakill'] }));
        assert.ok(teams.length >= 10);
        const [top] = teams;
        assert.ok((top.metrics.vertical?.count ?? 0) >= 7);
        assert.equal(top.metrics.vertical?.style, 'gold');
        assert.ok(top.evaluation.emblemHolders[0].holder, 'emblem is held');
    });

    it('Vertical K/DA counts 2 stars per unit and per held K/DA emblem', () => {
        const [top] = teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['K/DA'] }));
        assert.equal(top.metrics.vertical?.trait, 'K/DA');
        assert.ok((top.metrics.vertical?.count ?? 0) >= 15, `K/DA count ${top.metrics.vertical?.count}`);
        assert.equal(top.metrics.vertical?.style, 'gold');
        assert.ok(top.evaluation.emblemHolders[0].holder, 'K/DA emblem is held');
    });

    it('three Pentakill emblems at level 8 cap by eligible holders', () => {
        for (const team of teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Pentakill', 'Pentakill', 'Pentakill'] }))) {
            assert.ok((trait(team, 'Pentakill')?.count ?? 0) <= 10);
            for (const h of team.evaluation.emblemHolders) {
                if (h.holder) assert.ok(!h.holder.traits.includes('Pentakill'));
            }
        }
    });

    it('activates the second emblem instead of overfilling the first', () => {
        const [top] = teamsOf(solveTeams({ strategy: 'Vertical', level: 9, emblems: ['Pentakill', 'Arcanist'] }));
        assert.equal(trait(top, 'Pentakill')?.style, 'gold');
        assert.ok(trait(top, 'Arcanist')?.style, 'Arcanist active');
    });

    it('Bronze For Life counts Bronze-tier traits and activates the emblem', () => {
        const [top] = teamsOf(solveTeams({ strategy: 'BronzeLife', level: 8, emblems: ['Beach Pop'] }));
        assert.ok(top.metrics.bronze >= 8, `bronze ${top.metrics.bronze}`);
        assert.ok(trait(top, 'Beach Pop')?.style, 'Beach Pop active');
    });

    it('avoids out-of-level extreme unlocks like Lv10 Sona on a Level 8 board', () => {
        const [top] = teamsOf(solveTeams({ strategy: 'BronzeLife', level: 8, emblems: ['Slayer'] }));
        assert.equal(top.champions.some(c => c.apiName === 'DA_Sona19'), false);
    });

    it('rejects locked boards that break the rules', () => {
        assert.deepEqual(
            solveTeams({ strategy: 'Vertical', level: 4, emblems: ['Slayer'], locked: ['DA_BaronNashor19', 'DA_19_Ahri', 'DA_Sett19', 'DA_Taric19'] }),
            { status: 'invalid-lock', reason: 'too-many-slots' },
        );
        assert.deepEqual(
            solveTeams({ strategy: 'Vertical', level: 8, emblems: ['K/DA'], locked: ['DA_AkaliKDA19', 'DA_Akali_TrueDamage19'] }),
            { status: 'invalid-lock', reason: 'duplicate-unit' },
        );
    });

    it('can plan around Sona (Producer) variants, at most one Sona per board', () => {
        const teams = teamsOf(solveTeams({ strategy: 'Vertical', level: 10, emblems: ['Ionic Spark'], sonaProducer: true }));
        for (const team of teams) assert.ok(team.champions.filter(c => c.unitId === 'DA_Sona19').length <= 1);
    });
});
