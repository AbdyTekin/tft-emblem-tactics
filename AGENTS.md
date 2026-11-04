# AGENTS.md

Instructions for AI coding agents.

[README.md](README.md) covers the game rules, scripts and project layout, and [CONTRIBUTING.md](CONTRIBUTING.md) covers how to change rules, the solver and UI text. Follow both. This file only adds what they leave out.

## Working with other agents

- Several agents work on this repo, and they don't share chats or private memory. If the next agent needs to know something, put it in this file, the README or a code comment.
- This repo is public and stays general. Personal preferences, machine details and unfixed security findings stay local, in your tool's own config or notes.
- Run `git status` before you start. Another agent may have left uncommitted work, so don't revert changes you didn't make.
- Keep shared instructions here. Claude Code stops reading this file once a `CLAUDE.md` exists, so a `CLAUDE.md` must start with `@AGENTS.md`.

## Game accuracy

The site is only useful if it matches the live game, and mechanics change with every set, so don't rely on what you remember about TFT.

- Check mechanics against `lib/data/set18.json`, `lib/game/rules.ts` and the README's rules table. If they don't settle it, ask.
- CommunityDragon is the only game data source. New-set data can reach it days after the set hits PBE, so wait for it. Ask before adding another source, such as MetaTFT.

## Constraints

- **Static site**: `output: "export"` rules out server code (API routes, server actions, middleware). Response headers live in `vercel.json`, because `headers()` in `next.config.ts` is ignored.
- **No third-party requests**: the CSP only allows same-origin resources, so images, fonts and data ship with the site. Its `'unsafe-inline'` is there for the inline scripts Next.js writes into the static HTML.
- **Solver off the main thread**: keep the `new Worker(new URL(...))` call in `lib/hooks/use-team-solver.ts` as it is, and keep `lib/solver` out of the page bundle (the fallback imports it lazily).
- **Browser state**: the lint rules reject `setState` in effects. Follow the `useSyncExternalStore` pattern in `context/language-context.tsx` and `lib/hooks/`.
- **Share links**: URL parameters are untrusted input. `lib/planner-url.ts` drops anything that doesn't match the game data, and new parameters need the same treatment.
- **Tailwind**: it only sees literal class names, so don't build them from variables. Use a lookup like `COST_DOT` in `components/ChampionSelector.tsx`.
- **Accessibility**: icon-only controls need an `aria-label`, toggles need `aria-pressed` or `aria-expanded`, tooltips must open on keyboard focus, and decorative images stay hidden from screen readers.
- **Language**: the static HTML is Turkish on purpose (`<html lang="tr">`). After load the site uses the saved language, then the browser's. `components/DynamicMetadata.tsx` keeps `lang` in sync, which Turkish uppercase letters depend on.
- **CI**: GitHub Actions are pinned to commit SHAs, so keep new ones pinned.

## Checking your work

- Run `npm run check` before calling anything done.
- `npm run dev` doesn't apply the CSP. If you touch images, workers or anything loaded at runtime, also run `npm run build`, then `npm run preview` (http://127.0.0.1:4173).

## Git

Commit or push only when asked. Pushing `master` deploys to production through Vercel.

## Open items

- Do copied Team Planner codes import correctly in the TFT client? This hasn't been confirmed, so if you change `lib/game/team-code.ts`, ask for an in-game check.
- Comparing or pinning teams and adding strategies were left out because they need a product decision. Ask before building them.
