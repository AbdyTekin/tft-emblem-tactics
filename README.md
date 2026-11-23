# TFT Emblem Tactics

Build the best Teamfight Tactics **Set 19: Prismatic Tour** boards around the emblems you hold.

[**Live site**](https://tft-emblem-tactics.vercel.app/)

## Features

- **Two strategies**
  - **Vertical**: push your first emblem's trait as high as it can go, then your next emblems, then as many other traits as fit.
  - **Bronze For Life**: activate every emblem trait, then as many Bronze-tier traits as possible (what the Bronze For Life augments count).
- **Game-accurate rules** (see [Set 19 rules](#set-19-rules))
  - Emblems only count on units that can hold them.
  - All 94 champions (including the 32 unlockables) are supported; unlock conditions and estimated difficulty appear on hover/focus and factor into recommendations.
  - K/DA counts total star levels (2★ assumed per unit and held emblem).
  - Baron Nashor takes two team slots.
  - K/DA Akali and True Damage Akali are mutually exclusive, and Sona (Producer) band variants are available in Advanced.
- **20 distinct teams per search**
  - Each team shows its tier-colored traits and which unit holds each emblem.
  - Copy any team straight into the in-game Team Planner.
- **Lock champions** you already own; the picker only allows boards that fit.
- **Share** any setup: the link holds your emblems, level, strategy and locked champions.
- **Next steps at a glance**: each team shows the traits that are one unit short of activating.
- **Fast and private**: the solver runs in a Web Worker (~100 ms). The site is fully static and serves every image itself.
- **English and Turkish** UI, with champion, trait and unlock quest text from the game.

## Set 19 rules

Generated Set 19 data lives in `lib/data/set19.json` (see [Game data](#game-data)). Rules the data can't express live in `lib/game/rules.ts`, each with the in-game text it follows.

| Rule | Details |
|---|---|
| Trait tiers | Bronze, silver, gold, prismatic and unique come from the game data. Quest-only Prismatic tiers (Heartsteel, Pentakill, True Damage) use their base Gold breakpoint; Ionic Spark 10 and K/DA 21★ are Prismatic. |
| Bronze-tier traits | A trait counts while its active tier is bronze (e.g. Juggernaut 2–3, Heartsteel 1–2, R&B 1). EDM's only tier is gold. |
| Emblems | 22 traits have emblems (16 craftable, 6 elusive); Collab, EDM, Encore, Gu Feng, R&B, Trickshot and unique traits don't. An emblem only counts on a unit without that trait, and a unit holds at most three. |
| Unlockable champions | 32 of the 94 champions start locked behind an in-game quest. Each carries an estimated unlock hardness (1–4, plus +3 when the quest requires a higher level than the board) that slightly discounts secondary traits (`0.15` per hardness point) without blocking emblem verticals. |
| K/DA | Counts total star levels (`3★ / 5★ / 7★ / 10★ / 13★ / 15★ / 21★`). The planner assumes 2★ late-game boards, so each K/DA unit and held K/DA Emblem contributes 2. |
| Baron Nashor | Takes 2 team slots (`One Monster Band`). |
| Akali | `Akali (K/DA)` and `Akali (True Damage)` share a `unitId` and cannot be fielded together (mutually exclusive unlocks). |
| Sona (Producer) | Can optionally be planned with her chosen band (`Heartsteel`, `Ionic Spark`, `K/DA`, `Pentakill` or `True Damage`); at most one Sona per board. |
| Team size | Your level, plus Tactician's Cape/Crown/Shield (+1 each) or Cursed Crown (+2). |
| Team Planner code | 10 units max, encoded as `02<10×3-hex>TFTSet19`. |

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
| `npm run data:update` | Regenerates `lib/data/set19.json` from Set 19 lookups and CommunityDragon TFT assets |
| `npm run data:check` | Fails if the committed data no longer matches upstream |
| `npm run assets:update` | Downloads and converts champion, trait and emblem images into `public/assets` |

## Game data

Starting with the standalone Unreal Engine TFT client, CommunityDragon's new TFT export (`explore.communitydragon.org/tft/`) provides textures and localization, while structured Set 19 data isn't exported there yet. `scripts/update-data.mjs` therefore builds `lib/data/set19.json` at update time from MetaTFT's Set 19 lookups (`en_us` and `tr_tr`) and resolves every icon path against `explore.communitydragon.org/tft/`, so the deployed site has **zero** third-party runtime dependencies:

- champions: 94 units (including 7-costs, unlock conditions and Team Planner codes) with Turkish names
- traits: 47 traits with normalized breakpoints, tier styles, icons and 22 emblems (with recipes)

It validates everything and fails loudly. A weekly CI job runs `data:check`, so patch-day changes don't go unnoticed.

After a patch:

```bash
npm run data:update     # regenerate lib/data/set19.json (pass --latest once live)
npm run assets:update   # fetch images for any new champion, trait or emblem
npm test                # rules and data tests catch anything that changed shape
```

For a new set:

1. Run the scripts with `--set=<number>` (`--latest` for live, PBE is default while on PBE).
2. Update `KINDS`, `UNLOCK_DIFFICULTY` and `EXCLUSIVE_VARIANTS` in `scripts/update-data.mjs`.
3. Review the special mechanics in `lib/game/rules.ts`.

## How the solver works

`lib/solver` runs a beam search over sets of units:

- It never tries the same set in a different order.
- It updates trait counts and unlock hardness incrementally and keeps the 250 most promising partial boards per step.
- A progress term rewards traits that can still reach a breakpoint.
- The best finished boards get a one-unit-swap polish, then are re-scored with the exact emblem-holder assignment.

`tests/solver-quality.test.ts` checks the solver against brute force on random smaller pools.

## Project structure

- `app/`: Next.js App Router page and layout (static export)
- `components/`: UI components
- `lib/game/`: game data access, Set 19 rules, team evaluation, team codes
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
