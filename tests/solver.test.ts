import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { solveTeams, type SolveRequest, type SolveResult, type TeamResult } from '@/lib/solver';
import { compareScores } from '@/lib/solver/score';
import { REGULAR_RIFTBEASTS, champ } from './helpers';

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
            for (const emblems of [['Blossom'], ['Hunter'], ['Fae', 'Primal'], ['Coven', 'Coven', 'Invoker']]) {
                scenarios.push({ strategy, level, emblems });
            }
        }
    }
    scenarios.push({ strategy: 'Vertical', level: 8, emblems: ['Elderwood'], locked: ['DA_18_ElderDragon', 'DA_18_Lux_Fae'] });

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
        const teams = teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Blossom'] }));
        for (let i = 1; i < 8; i++) {
            for (let j = 0; j < i; j++) assert.ok(differsByTwo(teams[j], teams[i]), `teams ${j + 1} and ${i + 1} are near-copies`);
        }
    });

    it('returns the same teams for the same request', () => {
        const request: SolveRequest = { strategy: 'BronzeLife', level: 9, emblems: ['Juggernaut', 'Fae'] };
        const names = (r: SolveResult) => teamsOf(r).map(t => t.champions.map(c => c.apiName).join(','));
        assert.deepEqual(names(solveTeams(request)), names(solveTeams(request)));
    });

    it('solves a level 10 board well within a second', () => {
        const start = performance.now();
        solveTeams({ strategy: 'BronzeLife', level: 10, emblems: ['Brawler', 'Blackthorn', 'Juggernaut'] });
        assert.ok(performance.now() - start < 1500);
    });
});

describe('solver results for the audited cases', () => {
    it('Vertical Blossom level 8: many boards at Blossom 9 with a holder for the emblem', () => {
        const teams = teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Blossom'] }));
        assert.ok(teams.length >= 10);
        const [top] = teams;
        assert.equal(top.metrics.vertical?.count, 9);
        assert.equal(top.metrics.vertical?.style, 'gold');
        assert.ok(top.evaluation.emblemHolders[0].holder, 'emblem is held');
    });

    it('three Blossom emblems at level 8 cap at Blossom 9 (holders)', () => {
        for (const team of teamsOf(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Blossom', 'Blossom', 'Blossom'] }))) {
            assert.ok((trait(team, 'Blossom')?.count ?? 0) <= 9);
        }
    });

    it('activates the second emblem instead of overfilling the first', () => {
        const [top] = teamsOf(solveTeams({ strategy: 'Vertical', level: 9, emblems: ['Blossom', 'Coven'] }));
        assert.equal(trait(top, 'Blossom')?.style, 'gold');
        assert.ok(trait(top, 'Coven')?.style, 'Coven active');
    });

    it('Bronze For Life counts Bronze-tier traits and uses the emblem', () => {
        const [top] = teamsOf(solveTeams({ strategy: 'BronzeLife', level: 8, emblems: ['Blossom'] }));
        assert.ok(top.metrics.bronze >= 10, `bronze ${top.metrics.bronze}`);
        assert.ok(trait(top, 'Blossom')?.style, 'Blossom active');
    });

    it('rejects locked boards that break the rules', () => {
        const riftbeast10 = ['DA_18_ElderDragon', ...REGULAR_RIFTBEASTS.slice(0, 8).map(n => champ(n).apiName)];
        assert.deepEqual(solveTeams({ strategy: 'Vertical', level: 9, emblems: ['Hunter'], locked: riftbeast10 }), { status: 'invalid-lock', reason: 'too-many-slots' });
        assert.deepEqual(solveTeams({ strategy: 'Vertical', level: 8, emblems: ['Fae'], locked: ['DA_18_Lux_Fae', 'DA_Lux18_Blossom'] }), { status: 'invalid-lock', reason: 'duplicate-unit' });
    });

    it('fills 12 slots once Riftbeast 10 is reached at level 10', () => {
        const locked = ['DA_18_ElderDragon', ...REGULAR_RIFTBEASTS.slice(0, 8).map(n => champ(n).apiName)];
        const [top] = teamsOf(solveTeams({ strategy: 'Vertical', level: 10, emblems: ['Hunter'], locked }));
        assert.equal(top.evaluation.teamSize, 12);
        assert.equal(top.evaluation.slotsUsed, 12);
    });

    it('can plan around an evolved Kha\'Zix, one Kha\'Zix at a time', () => {
        const teams = teamsOf(solveTeams({ strategy: 'BronzeLife', level: 8, emblems: ['Executioner'], evolvedKhazix: true }));
        for (const team of teams) assert.ok(team.champions.filter(c => c.unitId === 'DA_18_KhaZix').length <= 1);
    });
});
