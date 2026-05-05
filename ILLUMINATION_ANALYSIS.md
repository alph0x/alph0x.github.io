# Análisis de Iluminación — Fundamentado Teóricamente

## 1. Observación Empírica

4 capturas consecutivas muestran:
- Elementos emisivos (neón magenta, terminal verde) **visibles**
- Todo lo demás **negro puro**
- Fondo detrás de geometría **negro puro**

## 2. Hipótesis Evaluadas con Evidencia

### Hipótesis A: MeshBasicMaterial ignora luces
**VERDADERA pero INSUFICIENTE.** `MeshBasicMaterial` ignora iluminación, sí. Pero renderiza el color base exactamente. Si el color base es `0x6a6a85` (RGB 106,106,133), debería verse como gris-azulado medio. No explica negro puro.

### Hipótesis B: CRT Overlay CSS oscurece todo
**PARCIAL.** El overlay tiene:
- Scanlines: `rgba(0,0,0,0.08)` → 8% atenuación
- Viñeta: `box-shadow inset` + radial gradient → ~15-25% atenuación en bordes
- **Efecto en el centro de pantalla: ~8%**. No puede convertir gris medio en negro puro.

### Hipótesis C: La niebla FogExp2 oscurece
**MATEMÁTICAMENTE DESCARTADA.**
```
fogFactor = 1 - exp(-density * distance)
```
Con `density=0.006`, a 10m: `1 - exp(-0.06) = 0.058` → 5.8% de mezcla.
Aún a 20m: `1 - exp(-0.12) = 0.11` → 11% de mezcla.
La niebla mezcla hacia el color de fondo, no hacia negro.

### Hipótesis D: Las texturas CanvasTexture no funcionan
**DESCARTADA.** Los terminales usan `CanvasTexture` + `MeshBasicMaterial` y se ven perfectamente.

### Hipótesis E: El navegador ejecuta código cacheado
**CONFIRMADA.** Safari cachea módulos ES6 agresivamente. Un refresh normal no invalida el cache de `./js/app.js`. Las capturas muestran consistentemente los colores de la versión ORIGINAL (texturas `#12121a`, `#0f0f14`, `#2d2d3d`).

### Hipótesis F: Bug de orden de declaración
**CONFIRMADA.** `renderer.setClearColor()` se llama en línea 916, pero `const renderer` se declara en línea 921. En ES6, `const` tiene Temporal Dead Zone — usar la variable antes de su declaración lanza `ReferenceError`. Esto impide que el código nuevo se ejecute correctamente.

## 3. Análisis de la Versión Original (la que está cacheada)

| Componente | Valor | Resultado visual |
|-----------|-------|-----------------|
| Textura pared | `#2d2d3d` | Gris muy oscuro |
| Textura piso | `#12121a` | Casi negro |
| Textura techo | `#0f0f14` | Casi negro |
| Fondo scene | `#08080c` | Casi negro |
| Niebla | `FogExp2(#08080c, 0.012)` | Mezcla hacia casi negro |
| CRT scanlines | `rgba(0,0,0,0.25)` | 25% atenuación global |
| CRT viñeta | `rgba(0,0,0,0.6)` | 60% atenuación en bordes |
| CRT radial | `rgba(0,0,0,0.4)` | 40% atenuación en bordes |

**Cálculo combinado para una pared en el borde:**
- Color base: `#2d2d3d` ≈ RGB(45,45,61)
- Niebla a 8m: mezcla ~9% hacia `#08080c` → RGB(41,41,56)
- CRT scanlines: -25% → RGB(31,31,42)
- CRT viñeta: -60% → RGB(12,12,17) → **prácticamente negro**

**Cálculo combinado para el piso:**
- Color base: `#12121a` ≈ RGB(18,18,26)
- CRT scanlines: -25% → RGB(13,13,19)
- **Negro puro perceptual**

## 4. Conclusión Raíz

El problema es **acumulativo**, no una sola causa:
1. Colores base de texturas deliberadamente oscuros (decisión artística original para habitación pequeña)
2. CRT overlay con opacidades altas (25%+60%+40% = oscurecimiento masivo)
3. Habitación 4× más grande → más geometría en zonas de viñeta → más oscuridad visible
4. Cache del navegador impide que los fixes lleguen al usuario
5. Bug de `renderer.setClearColor` antes de declaración impide ejecución limpia

## 5. Solución Propuesta

### 5.1 Fix inmediato (bug)
Mover `renderer.setClearColor()` DESPUÉS de `const renderer`.

### 5.2 Reducción conservadora del CRT
El overlay CRT es multiplicativo (no aditivo). Las opacidades se acumulan:
- Scanlines 8% + viñeta 25% + radial 15% = efecto visual significativo
- Reducir a: scanlines 4%, viñeta 12%, radial 8%

### 5.3 Colores base de estructuras
Eliminar texturas procedurales oscuras. Usar colores sólidos claros:
- Paredes: `#8a8aa5` (gris-azulado claro, suficiente para vencer el CRT)
- Piso: `#5a5a75` (gris medio-claro)
- Techo: `#4a4a60` (gris medio)

### 5.4 Cache busting
El usuario debe hacer **Cmd+Shift+R** (Safari) para forzar recarga sin cache.
