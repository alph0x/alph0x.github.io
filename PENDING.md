# Pendientes — BSc Portfolio

> Última actualización: 2026-05-06

## 🔴 Bloqueante / Visibilidad

### Lulú head tracking — sigue sin mirar al jugador
- **Síntoma**: la cabeza gira pero "se va de lado" en vez de apuntar al jugador.
- **Cambios aplicados**:
  1. Agrupé cabeza + faciales en un `THREE.Group` (`mini-schnauzer.js`).
  2. Corregí `Math.atan2(dx, dz)` → `Math.atan2(dz, dx)` en `updatePet` para alinearse con el forward +X del modelo.
- **Tests**: 7 tests en `pet-animation.test.js` pasan (convergencia matemática verificada).
- **Posibles causas restantes**:
  1. **Forward axis del modelo**: el schnauzer tiene el cuerpo en X, pero tal vez la "cara" realmente mira hacia -X o Z. Necesito verificar con una flecha de debug o rotar el modelo 90°.
  2. **Escala del grupo principal**: `g.scale.set(1.6, 1.6, 1.6)`. Si la escala no es uniforme en algún padre intermedio, las rotaciones locales podrían distorsionarse.
  3. **Caché del navegador**: el usuario podría estar viendo una versión antigua de `pet.js`.
  4. **Interpolación muy lenta**: `0.05` por frame (~3s para convergir) y `0.3` clamp hacen el giro casi imperceptible.
- **Siguiente paso recomendado**: agregar una flecha roja (`THREE.ArrowHelper`) como hijo del `head` group para visualizar su forward local, o aumentar temporalmente el factor a `0.8` y `0.2` para hacer el giro obvio.

## 🟡 Mejoras / Polish

### Editor
- [ ] Outline self-intersection tests en resize (estaba en progreso, pausado por el bug de Lulú).
- [ ] Propiedad `name` en objetos del editor para identificación legible.
- [ ] Undo/redo stack para el editor (ahora solo hay `delete`).

### Juego
- [ ] Lulú podría tener una animación de "excited" cuando el jugador se acerca mucho (< 1m).
- [ ] Sonido pasos o ambient room tone.

### Tests
- [ ] Coverage de `systems/animation/index.js` (AnimationSystem orchestrator).
- [ ] Test de integración end-to-end para el ciclo completo: editor → seed → game load.
