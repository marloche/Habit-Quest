# Habit-Quest (repo)

This project's notes, decisions, and rules live in my Obsidian vault. Read these before working. Claude Code loads them automatically; other tools should open them.

@C:/ObsidianVault/CLAUDE.md
@C:/ObsidianVault/10-Projects/Apps/CLAUDE.md
@C:/ObsidianVault/10-Projects/Apps/Habit-Quest/CLAUDE.md

Inside this repo, the vault's folder and naming rules don't apply, but its safety rules and my preferences do. Record decisions in `C:/ObsidianVault/10-Projects/Apps/Habit-Quest/Habit-Quest-Log.md`.

## Repo specifics
- Language / framework: TypeScript + Vite, no UI framework. Installable PWA.
- Install: `npm install`
- Run: `npm run dev` (no service worker in dev); `npm run build && npm run preview` for the real thing
- Test: `npm test` (Vitest; game logic in `src/logic/` is pure and fully unit-tested)
- Lint / format: none yet; `tsc --noEmit` runs as part of `npm run build`
- Release / deploy: push to `main` triggers `.github/workflows/pages.yml` (always needs my OK)

## Conventions
- Code style: keep scoring rules in `src/logic/` as pure functions; XP, levels and streaks are derived from the log, never stored.
- Art is drawn in code (`src/sprites.ts`), sound is synthesized (`src/audio.ts`). No downloaded art or audio.
- Bump `v` in the save format only with a migration in `src/store.ts`.
- Branches and commits: `main` only for now.

<!-- Setup: this assumes the vault is at C:/ObsidianVault. If it moves,
     update the paths above to match.
     The first time Claude Code sees these imports, it asks you to approve them. -->
