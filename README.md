# TFT Emblem Tactics

Build the best Teamfight Tactics **Set 18** boards around the emblems you hold.

[**Live site**](https://tft-emblem-tactics.vercel.app/)

## Features

- **Two strategies**
  - **Vertical**: push your first emblem's trait as high as it can go, then your next emblems, then as many other traits as fit.
  - **Bronze For Life**: activate every emblem trait, then as many Bronze-tier traits as possible (what the Bronze For Life augments count).
- **Game-accurate rules** (see [Set 18 rules](#set-18-rules))
  - Emblems only count on units that can hold them.
  - Lux counts her trait twice.
  - Elder Dragon takes two slots.
  - Riftbeast 10 adds two team slots.
  - Rival exclusivity and bonus team size are handled too.
- **20 distinct teams per search**
  - Each team shows its tier-colored traits and which unit holds each emblem.
  - Copy any team straight into the in-game Team Planner.
- **Lock champions** you already own; the picker only allows boards that fit.
- **Fast and private**: the solver runs in a Web Worker (~100 ms). The site is fully static and serves every image itself.
- **English and Turkish** UI, with champion and trait names from the game.

## Set 18 rules

The data comes from [CommunityDragon](https://communitydragon.org/) (see [Game data](#game-data)). Rules the data can't express live in `lib/game/rules.ts`, each with the in-game text it follows.

| Rule | Details |
|---|---|
| Trait tiers | Bronze, silver, gold, prismatic and unique come from the game data, not from the breakpoint's position. |
| Bronze-tier traits | A trait counts while its active tier is bronze (e.g. Juggernaut 2–3). Solar's only tier is gold. |
| Emblems | 20 traits have emblems; Riftbeast, Solar, Summoner, Adaptor and unique traits don't. An emblem only counts on a unit without that trait, and a unit holds at most three. |
| Lux (Avatar) | One Lux per board; her trait counts twice. |
| Elder Dragon | Takes 2 team slots and adds +2 Riftbeast. |
| Riftbeast | Comes only from units (9 regulars + Elder Dragon = 11 max). At 10 it adds +2 team size, but only if the units reaching 10 already fit on the board. |
| Team size | Your level, plus Tactician's Cape/Crown/Shield (+1 each) or Cursed Crown (+2). |
| Rival | Active with exactly one of Rengar/Kha'Zix, unless you have the Unrivaled augment. |
| Kha'Zix | Can be planned as evolved (extra Executioner, Rapidfire, Ravager or Spellweaver). |
| Team Planner code | 10 units max, codes from the live team planner data. |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Static export into `out/` |
| `npm run preview` | Serves `out/` with the production security headers from `vercel.json` |
| `npm test` | Rules, data, solver and solver-quality tests (`node:test` via `tsx`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run check` | All of the above plus the build (what CI runs) |
| `npm run data:update` | Regenerates `lib/data/set18.json` from CommunityDragon |
| `npm run data:check` | Fails if the committed data no longer matches the live game |
| `npm run assets:update` | Downloads and converts champion, trait and emblem images into `public/assets` |

## Game data

`scripts/update-data.mjs` builds `lib/data/set18.json` from CommunityDragon's live data:

- champions: with Turkish names and Team Planner codes
- traits: breakpoints, tier styles, icons and emblems
- the Riftbeast team-size bonus

It validates everything and fails loudly. A weekly CI job runs `data:check`, so patch-day changes don't go unnoticed.

After a patch:

```bash
npm run data:update     # regenerate the data
npm run assets:update   # fetch images for any new champion, trait or emblem
npm test                # rules and data tests catch anything that changed shape
```

For a new set:

1. Run the scripts with `--set=<number>` (`--pbe` works for the PBE).
2. Update `KINDS` and `EXCLUDED_CHAMPIONS` in `scripts/update-data.mjs`.
3. Review the special mechanics in `lib/game/rules.ts`.

## How the solver works

`lib/solver` runs a beam search over sets of units:

- It never tries the same set in a different order.
- It updates trait counts incrementally and keeps the 250 most promising partial boards per step.
- A progress term rewards traits that can still reach a breakpoint.
- The best finished boards get a one-unit-swap polish, then are re-scored with the exact emblem-holder assignment.

`tests/solver-quality.test.ts` checks the solver against brute force on random smaller pools.

## Project structure

- `app/`: Next.js App Router page and layout (static export)
- `components/`: UI components
- `lib/game/`: game data access, Set 18 rules, team evaluation, team codes
- `lib/solver/`: search, scoring, and the Web Worker entry
- `lib/hooks/`: client hooks (worker solver, scrollbars, names)
- `lib/data/`: generated game data (don't edit by hand)
- `public/assets/`: generated images (don't edit by hand)
- `messages/`: UI strings (English, Turkish)
- `scripts/`: data and asset generators, local preview server
- `tests/`: `node:test` suites

## Security

- The site is a static export, so there's no server code in production.
- `vercel.json` sets a strict Content Security Policy and other hardening headers; `npm run preview` serves the same headers locally.
- CI audits production dependencies on every push, and Dependabot keeps packages and GitHub Actions up to date.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
