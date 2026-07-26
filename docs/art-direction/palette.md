# Palette — ghibli-restyle (P-01, from approved boards)

Values extracted from `boards/` (room-daylight / room-golden-hour / room-night / furniture-accents / hud-ui). Token names are binding per `design-contract.md` §1; these are the values every consumer point uses.

## Base surfaces

| Token | Hex | From board | Use |
|---|---|---|---|
| `paperWhite` | `#f4ecd8` | hud-ui panels, daylight walls in direct light | warm paper white — never pure white |
| `plasterCream` | `#e6dbc2` | room walls in soft shade | wall/plaster base |
| `woodHoney` | `#b98a52` | desk, floor, shelves | wood surfaces |
| `fabricSage` | `#8ba888` | rug, curtains, chair fabric | fabric/plant-adjacent surfaces |
| `metalSoft` | `#98a2a6` | PC case, keyboard, headset metal | warm-grey metal, never cold chrome |
| `shadowLavender` | `#7c7fa0` | shaded wall/floor zones at daylight | shadow tint on lit surfaces |

## Light

| Token | Hex | From board | Use |
|---|---|---|---|
| `sunlightWarm` | `#ffd9a0` | morning key light, window shaft | key light color |
| `skyFillBlue` | `#9fc8e0` | sky through window, cool fill | fill light color |
| `duskAmber` | `#f5a54a` | golden-hour window, lamp glow | golden hour + practical lamps |
| `nightIndigo` | `#333f63` | night window, dusk sky | night base / deep surfaces |
| `fogHaze` | `#cfe4da` | atmospheric haze at daylight | fog base, far-depth tint |

## Accents (Sheikah-tech — the ONLY emissive hues, contract §6)

| Token | Hex | From board | Use |
|---|---|---|---|
| `sheikahTeal` | `#3ec8ae` | monitor/terminal glow, PC vents, HUD icons | emissive tech accents |
| `ancientAmber` | `#ff9e44` | fairy lights, lamp cores, golden HUD marks | emissive warm accents |

## Legacy token disposition (`core.ts:51-61`)

| Legacy | Disposition |
|---|---|
| `accent` `0x7c3aed` | REMOVE (neon purple) — importers → `sheikahTeal` or `ancientAmber` per owning point |
| `cyan` `0x06b6d4` | REMOVE — → `sheikahTeal` |
| `magenta` `0xec4899` | REMOVE — → `ancientAmber` |
| `green` `0x10b981` | REMOVE — → `sheikahTeal` |
| `orange` `0xf59e0b` | REMOVE — superseded by `ancientAmber` |
| `warm` `0xf5f5f4` | REMOVE — superseded by `paperWhite` |
| `metal` `0x44403c` | REMOVE — superseded by `metalSoft` |
| `bone` `0xe7e5e4` | REMOVE — superseded by `paperWhite` |
| `panel` `0x1c1917` | REMOVE — panels go cream-paper (`paperWhite`/`plasterCream`); dark panels use `nightIndigo` |
| `dim` `0x57534e` | KEEP — muted text/borders (warm grey, fits palette) |
| `void` `0x0c0a09` | KEEP — deepest shadow/base only |

Net: 4 neon + 5 superseded removed, 2 kept, 13 new. `COLORS` final size: 15 tokens.
