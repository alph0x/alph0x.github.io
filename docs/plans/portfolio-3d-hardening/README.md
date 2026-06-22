# Portfolio 3D Hardening — Tackle Plan

> Initiative: `portfolio-3d-hardening`  
> Status: 🟡 planned, not started  
> Owner: agent + user  

## Goal

Leave the 3D FPS portfolio in a state that is cheap to iterate on: typed, lean, well-tested, performant, and with a few concrete product features that make the editor and AlphGPT assistant actually useful.

## Non-goals

- No full visual redesign (the PSX look stays).
- No backend or paid APIs.
- No new rooms/locations beyond the single gamer room.

## Top 5 Features

1. **TypeScript migration** — Convert `docs/js/` to TypeScript with a minimal build step and type the seed/core/domain layers first.
2. **Dead-code & legacy cleanup** — Delete unused post-processing, legacy decoration system, unused builders, and duplicated room-geometry logic.
3. **Runtime quality & performance** — Deterministic textures, real loading progress, configurable pixel ratio / quality preset, and resize-safe rendering.
4. **Shareable room seeds** — Load seed from URL query param and save/load named slots in `localStorage` from the editor.
5. **AlphGPT intelligence layer** — Context memory, fuzzy intent matching, game-state-aware answers, and richer fallback behavior.

## Cross-cutting tasks

- **AGENTS.md refresh** — Rewrite root `AGENTS.md` to a one-page agent brief: project context, conventions, key commands, and file map.
- **Test consolidation** — Add coverage, deduplicate pet/editor tests, remove unused Playwright dependency or wire it up.

## Layout

```
docs/plans/portfolio-3d-hardening/
├── README.md          (this file)
├── spec.md            (detailed scope & acceptance criteria)
├── board.md           (status board)
├── tasks.md           (per-point tasks & done-signals)
├── decisions.md       (architectural decisions)
├── questions.md       (open questions for the user)
└── log.md             (session log)
```

## How to continue

1. Review `spec.md` and `questions.md`.
2. Add any extra features the user wants manually.
3. Run `/tackle-implement` or pick the first ready point from `board.md`.
