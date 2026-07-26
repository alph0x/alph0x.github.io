# Type & spacing scale — ghibli-restyle (P-01, contract §7)

Becomes `--*` properties in `docs/styles/tokens.css` (P-03). Values are CSS-ready.

## Type voices (dual, from the boards)

- **UI chrome (HUD, panels, prompts): warm humanist sans.** System stack — zero new assets:
  `--font-ui: ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif;`
  Replaces `'Press Start 2P'` in the HUD (`index.html:46`): pixel font fights the painterly world.
- **Sheikah-tech voice (terminal screens, boot, code):** keep monospace —
  `--font-tech: ui-monospace, "SF Mono", Menlo, monospace;`
  `'Press Start 2P'` survives ONLY inside in-world terminal/monitor textures if already baked there; it leaves all DOM UI.

## Type scale (1.25 minor-third on 16px base)

| Token | Value | Use |
|---|---|---|
| `--text-xs` | `0.75rem` (12px) | hud-label, captions |
| `--text-sm` | `0.875rem` (14px) | secondary values |
| `--text-base` | `1rem` (16px) | body, hud-value |
| `--text-lg` | `1.25rem` (20px) | panel titles |
| `--text-xl` | `1.5rem` (24px) | section headers |
| `--text-2xl` | `2rem` (32px) | rare display moments |

Labels: `letter-spacing: 0.08em; text-transform: uppercase;` at `--text-xs` only. No text-shadow glows — replaced by 1px borders + soft tint shadows (per design-taste: no neon outer glows).

## Spacing scale (4px grid)

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` · `--space-5: 24px` · `--space-6: 32px` · `--space-7: 48px` · `--space-8: 64px`

HUD height 72px → `--space-8 + --space-2`; panel padding `--space-4`/`--space-5`.

## Radius (one system, from hud-ui board — soft rounded paper)

`--radius-sm: 6px` (chips, small panels) · `--radius-md: 10px` (panels, HUD blocks) · `--radius-lg: 16px` (modals, info panels). Sharp corners only on `crt-overlay` scanline edges (if kept).

## Elevation (tinted, never black-on-light)

`--shadow-panel: 0 2px 12px rgb(51 63 99 / 0.18);` (nightIndigo-tinted) ·
`--shadow-pop: 0 8px 32px rgb(51 63 99 / 0.28);`
