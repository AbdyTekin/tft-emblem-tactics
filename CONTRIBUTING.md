# Contributing

Thanks for helping out! Issues and pull requests are welcome.

## Setup

- Node 24 (see `.nvmrc`; Node 20.9+ works)
- `npm install`
- `npm run dev`

## Before opening a pull request

Run `npm run check`. It runs lint, typecheck, tests and the production build, the same as CI.

## Changing game rules

- Game data is generated, so don't hand-edit `lib/data/` or `public/assets/`. Use `npm run data:update` and `npm run assets:update`.
- Mechanics the data can't express belong in `lib/game/rules.ts`. Quote the in-game text you're following next to the rule.
- Add or adjust a test in `tests/` for every rule change (`rules.test.ts`, `evaluate.test.ts`, `traits.test.ts`).

## Changing the solver

- Keep `lib/solver/score.ts` (exact ranking) and `Search#score` in `lib/solver/search.ts` (fast ranking) in step.
- `tests/solver-quality.test.ts` compares the solver with brute force. If you change the beam heuristic, check the quality test and the timing test still pass.

## UI text

UI strings live in `messages/en.json` and `messages/tr.json`; add every key to both. Champion and trait names come from the game data, not from the message files.
