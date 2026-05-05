# Plan de Renovación — Night City Apartment

## 1. Tamaño de la habitación

**De 16×12m a 12×8m.** Razonamiento: 
- 16×12 = 192m² es un hangar industrial. Para que se sienta "cozy", necesitamos ~60-80m².
- 12×8 = 96m² es un loft grande pero acogible, proporcional a la cantidad de muebles que podemos generar.

## 2. Fix técnico — Canvas

**Problema:** Three.js `setSize()` establece atributos HTML `width`/`height` del canvas. Safari los respeta por encima del CSS.

**Solución:** `renderer.setSize(w, h, false)` — el tercer parámetro `false` evita que Three.js toque el CSS del canvas. Luego CSS controla el tamaño visual: `position: fixed; inset: 0; width: 100%; height: 100%;`.

## 3. Iluminación PS1 correcta

**Fundamento:** Los juegos PS1 usaban iluminación por vértice (Gouraud shading) con `MeshLambertMaterial`. Esto crea variación de tonos natural — zonas cerca de luces = más claras, zonas lejanas = más oscuras.

| Superficie | Material | Razón |
|-----------|----------|-------|
| Paredes, piso, techo | `MeshLambertMaterial` | Reciben luz, variación de tonos |
| Muebles | `MeshLambertMaterial` | Reciben luz, integración visual |
| Terminales, neón, posters | `MeshBasicMaterial` | Siempre brillantes, emisivos |

## 4. Paleta de colores — más cálida/cozy

El gris frío actual hace que todo se sienta clínico. Cambio a tonos cálidos:
- Paredes: gris-beige cálido (`#7a7a85` → base marrón-grisácea)
- Piso: madera oscura con grid cálido
- Techo: gris oscuro con ruido sutil
- Fondo/niebla: azul-medianoche muy oscuro pero no negro (`#0f0f1a`)

## 5. Detalles para hacerla cozy

### Muebles nuevos
- Alfombra en el área del sofá
- Mesa de noche junto a la cama
- Estantería adicional con más objetos
- Silla de escritorio detallada
- Nevera mini en la cocina
- Espejo en el baño
- Cuadros/pósters adicionales (más de 6)

### Gadgets / artifacts
- Cables en el suelo (tubes/torus geometries)
- Cajas de cartón apiladas
- Bolsas de basura
- Latas de CHOOH2 (bebida cyberpunk)
- Dron pequeño en una mesa
- Router/servidor con luces parpadeantes
- Teclado y mouse en el escritorio
- Taza de café
- Pistola en la mesa (decorativa)

### Detalles ambientales
- Ventana más detallada con gotas de lluvia
- Persiana parcialmente bajada
- Humo/steam más denso cerca de la cocina
- Partículas de polvo flotando en rayos de luz

### Iluminación más cálida
- Lámparas del techo con tono cálido amarillo-naranja
- Luces de navidad/cadena en la ventana
- Vela/velón en la mesa de noche
- Pantalla del TV con glow más intenso

## 6. CRT Overlay — opcional o muy sutil

El CRT actual está oscureciendo y añadiendo ruido visual. Propuesta:
- Scanlines: 3% opacidad (casi imperceptible)
- Viñeta: 10% en bordes
- Radial: 5%
- O eliminar completamente y dejar el look pixelado puro

## 7. Ejecución secuencial

1. Fix canvas + reducir habitación a 12×8
2. Cambiar materiales a Lambert + colores cálidos
3. Ajustar iluminación para 12×8
4. Añadir nuevos muebles y gadgets
5. Añadir detalles ambientales (cables, cajas, etc.)
6. Ajustar CRT overlay
7. Test final
