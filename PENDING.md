# Pendientes — BSc Portfolio

> Última actualización: 2026-05-08

---

## ✅ Completados en esta sesión

### P0: Lulú head tracking — FIXED
- **Cambios**:
  1. Agregada flecha roja `ArrowHelper` dentro del `head` group en `mini-schnauzer.js` para debug visual.
  2. Reescrita lógica de `updatePet` en `pet.js`:
     - Normalización de ángulo a `[-PI, PI]` para evitar giros de 350°.
     - Clamp a ±0.5 rad (~28°) — rango realista de cuello de perro.
     - Interpolación aumentada a `0.12` por frame (~0.8s para converger).
     - Retorno a neutral a `0.05` (~1.5s).
  3. Agregada animación **"excited"** cuando `dist < 1.0m`:
     - Tail wag más rápido (12Hz vs 7Hz) y mayor amplitud.
     - Ears más erguidas (rotación Z de -0.05 vs -0.2).
     - Respiración más pronunciada (amplitud 0.025 vs 0.015).
  4. Tests actualizados: `pet-animation.test.js` (9 tests).

### P1: Undo/Redo real — IMPLEMENTED
- **Cambios**:
  1. `FurnitureManager` ahora recibe `UndoManager` inyectado (DIP + SRP).
  2. Reemplazado `lastAction` (single-action undo) por stack multi-acción.
  3. Implementado `redo()` con `_applyForward()`.
  4. Acciones grabadas: `place`, `move` (con oldPos/newPos), `delete`, `rotate` (con oldRot/newRot).
  5. `clearAll()` limpia el undo stack.
  6. `loadFromSeed()` no registra acciones de undo.
  7. Agregado botón **Redo** en `editor.html` y bindings en `editor.js`.
  8. `InteractionManager` soporta `Ctrl+Shift+Z` y `Ctrl+Y` para redo.
  9. Tests: `undo-manager.test.js` (9 tests), `editor-furniture-manager.test.js` (+6 tests para redo).

### P1: AnimationSystem coverage — ADDED
- Creado `tests/animation-system.test.js` (3 tests): verifica orchestrator sin errores, con pet, y con mocks.

### P2: Lulú "excited" animation — ADDED
- Cuando el jugador está a < 1m: tail wag rápido, ears perky, breathing intensificado.
- Tests (+2 tests) en `pet-animation.test.js`.

### P2: Outline self-intersection tests — ALREADY COVERED
- `editor-outline-editor-drag.test.js` ya cubre rejection de vertex y edge drag que causa self-intersection.

### P3: Propiedad `name` en objetos del editor — ADDED
- **Cambios**:
  1. Campo `Name` en panel "Selected" del editor (`editor.html`).
  2. `FurnitureManager.setName()` para actualizar el nombre del item seleccionado.
  3. `placedList` muestra el nombre personalizado si existe.
  4. `selectionInfo` muestra nombre + tipo.
  5. `seed.js` serializa/deserializa `name` en el campo `n`.
  6. `loadFromSeed` preserva nombres al cargar.
  7. Tests: `editor-furniture-manager.test.js` (+2 tests).

### P3: Test E2E editor→seed→game — ADDED
- Creado `tests/e2e-editor-game.test.js` (4 tests):
  1. `DEFAULT_SEED` compatible con `buildLevel`.
  2. `buildLevel` sin errores.
  3. Round-trip serialize → deserialize.
  4. Collision walls desde furniture.

### P4: Sonido pasos / ambient room tone — ADDED
- **Cambios**:
  1. Creado `docs/js/systems/audio.js` — `AudioSystem` con Web Audio API.
  2. **Footsteps**: ruido blanco procedural + filtro lowpass + envelope de 80ms. Intervalo de ~0.42s entre pasos. Pitch varía ligeramente.
  3. **Ambient tone**: dos osciladores sine (55Hz + 110Hz) con modulación de volumen sutil. Volumen ~0.025.
  4. Lazy initialization de `AudioContext` + auto-resume en interacción del usuario (política de autoplay).
  5. Integrado en `Game`: `audio.update(delta)` en el loop, `audio.setMoving()` en `_updateMovement`, `audio.startAmbient()` en `start()`.
  6. Tests: `tests/audio-system.test.js` (9 tests) con mocks de `AudioContext`.

---

## 📊 Métricas

| Métrica | Valor |
|---|---|
| Tests | **305/305 pasando** (39 archivos) |
| Cobertura nuevas | UndoManager, AnimationSystem, E2E, pet excited, name, audio |

---

### P5: Estilo visual PSX low-poly — IMPLEMENTED
- **Cambios**:
  1. **Post-processing PSX**: `docs/js/renderer/psx-pass.js` — shader con:
     - Quantización de color a 32 niveles por canal (5 bits, como PSX real).
     - Dithering Bayer ordenado 4×4 para suavizar banding.
     - Scanlines horizontales sutiles (8% de intensidad).
     - Vignette ligero para enmarcar la imagen.
  2. **Renderizado a baja resolución**: `EffectComposer` renderiza a 640×360 con `NearestFilter`, luego upscalea a pantalla completa — pixelación nítida tipo PSX.
  3. **Materiales facetados**: Todos los `MeshStandardMaterial` PBR convertidos a:
     - `MeshLambertMaterial` con `flatShading: true` para estructuras (paredes, muebles, suelos).
     - `MeshBasicMaterial` para objetos emisivos (LEDs, pantallas, bombillas, neón).
  4. **Geometrías low-poly**: `CylinderGeometry`, `ConeGeometry`, `SphereGeometry` reducidos a 8 segmentos radiales / 6 verticales.
  5. **Sombras duras**: `shadowMap.type = THREE.BasicShadowMap` en lugar de `PCFSoftShadowMap`.
  6. **Sin HDR**: `toneMapping = THREE.NoToneMapping` — rango de color plano.
  7. **Bloom eliminado**: `UnrealBloomPass` removido del pipeline.
  8. **Texturas pixeladas**: `NearestFilter` ya estaba configurado en `textures.js`.
  9. **Parámetros PBR limpiados**: Eliminados `roughness`/`metalness` de ~40 llamadas a `makeStd`.
  10. Tests actualizados: `editor-room-builder.test.js` (espera `MeshLambertMaterial`).

> **Nota**: Todos los items de `PENDING.md` originales están completados. El proyecto está al día.
