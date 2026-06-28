# Board — Portfolio 3D Hardening

| Point | Phase | Status | Owner | Done signal |
|-------|-------|--------|-------|-------------|
| UI quick wins (HUD, loading text, Esc, focus, reduced motion) | Foundation | 🟢 done | agent | HP/MP gone, loading says `LOADING...`, panels close with Esc/outside/close button, focus visible |
| AGENTS.md refresh | Foundation | 🟢 done | agent | `AGENTS.md` reviewed and under 2 min to read |
| Ponytail cleanup | Foundation | 🟢 done | agent | dead files/exports removed, `npm test` green |
| TypeScript toolchain | Foundation | 🟢 done | agent | `tsconfig.json`, `npm run typecheck`, CI typecheck job green |
| TypeScript: full migration | Foundation | 🟢 done | agent | zero .js files under docs/js/, npm run typecheck green |
| Shared room geometry | Cleanup | 🟢 done | agent | single wall/opening builder used by game + editor |
| Visual fidelity: infrastructure | Product | 🟢 done | agent | new primitives + deterministic pixel-art textures + PBR materials |
| Visual fidelity: core furniture | Product | 🟢 done | agent | bed/desk/nightstand/TV/macbook/gaming-pc/monitor rebuilt, AABB preserved |
| Visual fidelity: fixtures | Product | 🟢 done | agent | ceiling-lamp/door/window/posters/fairy-lights rebuilt |
| Visual fidelity: Lulú | Product | 🟢 done | agent | mini-schnauzer no longer looks like stacked boxes |
| Visual fidelity: room shell | Product | 🟢 done | agent | walls/floor/ceiling have better materials and trim |
| Career Skyline window | Product | 🟢 done | agent | window view shows personalized career skyline |
| Rendering quality + loading | Core | 🟢 done | agent | default quality raised, deterministic textures, real loading |
| Shareable seeds | Product | 🟢 done | agent | `?seed=` loads, editor saves/loads 3 local slots |
| Mobile touch FPS controls | Product | 🟢 done | agent | on-screen move + look controls work |
| Portfolio Tour | Product | 🟢 done | agent | scripted tour runs and opens panels at stops |
| Dynamic time of day | Product | 🟢 done | agent | lighting changes with user's local time |
| Dynamic screen reflections | Product | 🔴 not started | agent | screens reflect room/player with render targets |
| AlphGPT MacBook terminal mode | Product | 🔴 not started | agent | camera zooms to laptop, terminal UI renders on screen |
| In-game object labels | Product | 🔴 not started | agent | hover prompt shows furniture name |
| Editor grid snap toggle | Product | 🔴 not started | agent | snap setting persists and applies to placement/move |
| Lightweight PWA | Product | 🔴 not started | agent | manifest + SW registered, offline shell works |
| Keyboard shortcut legend | Product | 🔴 not started | agent | in-game and editor legends toggle with key |
| UI snapshot testing | Verification | 🔴 not started | agent | snapshots for loading/start/room/editor/viewer pass in CI |
| Test consolidation + E2E smoke | Verification | 🔴 not started | agent | coverage configured, duplicates merged, E2E smoke green |

## Dependency graph

```
Foundation (UI quick wins, AGENTS.md, Ponytail cleanup, TS toolchain, TS migration)
    ↓
Cleanup (shared room geometry)
    ↓
Core (rendering quality, real loading)
    ↓
Visual (fidelity infrastructure → core furniture → fixtures → Lulú → room shell → Career Skyline)
    ↓
Product (shareable seeds, mobile touch, Portfolio Tour, time of day, reflections, AlphGPT terminal, labels, grid snap, PWA, legends)
    ↓
Verification (snapshots, tests, coverage, E2E smoke, CI)
```

## Legend

- 🔴 not started
- 🟡 in progress
- ⏸ blocked
- 🟢 done
