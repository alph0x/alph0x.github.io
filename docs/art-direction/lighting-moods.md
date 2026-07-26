# Lighting moods — ghibli-restyle (P-01, contract §4)

Mood targets for the three `TimeOfDayPreset`s (`level/lighting.ts:30-58`, interface unchanged). Colors are binding; intensities are STARTING HINTS — P-06 owns final values after seeing them against toon materials (toon responds flatter than PBR; expect lower intensity needs).

## morning — BOTW bright meadow daylight (boards/room-daylight.jpg)

| Slot | Value |
|---|---|
| key.color | `sunlightWarm` `#ffd9a0` — intensity hint 2.5-3.5 |
| fill.color | `skyFillBlue` `#9fc8e0` — hint 1.2-1.8 |
| windowGlow.color | `#ffe8c0` (warm morning shaft) — hint 3-5 |
| fog base | `fogHaze` `#cfe4da` |
| scene.background / clear | `#a8d4e0` (soft sky blue) |
| practicals | lamps OFF or minimal; city windows dim (cityEmissiveMultiplier ≤ 0.5) |

Mood: high-key, airy, long soft shadows; the room reads sunlit even with lights off.

## afternoon — warm golden hour (boards/room-golden-hour.jpg)

| Slot | Value |
|---|---|
| key.color | `#ffc27a` — hint 3-4 |
| fill.color | `#b0a8c8` (warm-violet bounce) — hint 1.0-1.5 |
| windowGlow.color | `duskAmber` `#f5a54a` — hint 5-7 (strong amber shaft) |
| fog base | `#e8cfae` |
| scene.background / clear | `#e0b184` |
| practicals | lamps warming up; city windows amber (multiplier ~1.0) |

Mood: amber window wash across wood floor, violet-ish shade side, peak coziness.

## night — indigo dusk with Sheikah practicals (boards/room-night.jpg)

| Slot | Value |
|---|---|
| key.color | `#ffb36b` (warm lamp as key) — hint 1.5-2.2 |
| fill.color | `#3a4a72` (indigo moon fill) — hint 0.4-0.7 |
| windowGlow.color | `#4460a8` (cool moonlight) — hint 4-6 |
| fog base | `nightIndigo` `#333f63` |
| scene.background / clear | `#232c48` |
| practicals | `sheikahTeal` `#3ec8ae` (PC/monitor/terminal) + `ancientAmber` `#ff9e44` (lamps, fairy lights, city) — multiplier 1.2-1.5 |

Mood: cozy, NOT dark-club. Indigo room wash; every glow is teal or amber, nothing magenta.

## Cross-preset

- HDRI: keep `dusk_1k.hdr` (warm dusk IBL fits all three moods); P-06 may recommend swap only if morning reads muddy against it.
- Dust/shaft color follows `windowGlow.color` per preset (already wired, `atmosphere.ts:53,114`).
- Fog lerps toward `fill.color` as today (`atmosphere.ts:134-135`), with the bases above replacing `0x1a1a2e`.
