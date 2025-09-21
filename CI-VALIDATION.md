# 🚀 CI Validation Tools

Este proyecto incluye herramientas avanzadas de validación para evitar fallos en GitHub Actions antes de hacer push.

## 🛠️ Herramientas Disponibles

### 1. Pre-push Hook Mejorado (`hooks/pre-push`)

**Validaciones automáticas en cada push:**
- ✅ Compatibilidad de versiones Swift (Package.swift vs GitHub Actions vs Docker)
- ✅ Compatibilidad de versiones Vapor con Swift
- ✅ Formato de `Package.resolved` (evita errores de "unknown PinsStorage version")
- ✅ Patrones conocidos de fallos en CI
- ✅ Build exitoso
- ✅ Tests esenciales
- ✅ Generación de sitio estático
- ✅ Capacidad de inicio del servidor

### 2. Script de Validación Manual (`validate-ci-compatibility.sh`)

**Ejecuta validaciones completas sin hacer push:**
```bash
./validate-ci-compatibility.sh
```

## 🔧 Instalación

```bash
# Instalar hooks de Git
./install-hooks.sh

# Hacer script de validación ejecutable
chmod +x validate-ci-compatibility.sh
```

## 📊 Validaciones Implementadas

### Compatibilidad de Versiones Swift

| Archivo | Versión Esperada | Propósito |
|---------|------------------|-----------|
| `Package.swift` | `5.9` | Tools version |
| `.github/workflows/ci.yml` | `5.9.2` + `macos-13` + `Xcode 15.4` | GitHub Actions |
| `web.Dockerfile` | `5.9.2` | Docker build |

### Configuración GitHub Actions

**Runner**: `macos-13` (evita macOS 15.5 SDK incompatible)  
**Xcode**: `15.4` (SDK compatible con Swift 5.9.2)  
**Swift**: `5.9.2` (versión estable disponible)

### Compatibilidad de Dependencias

- **Vapor 4.106.0+** requiere Swift 5.9+
- **Package.resolved** debe usar formato version 2 (no 3)

### Patrones de Fallos Conocidos

- ❌ `unknown PinsStorage version 3` → Package.resolved de Swift 6.0
- ❌ `could not build module 'DarwinFoundation'` → Incompatibilidad Swift 5.9.2 + macOS 15.5 SDK
- ❌ `Assertion failed: ProtocolConformance.cpp` → Swift compiler bug con SDK recientes
- ⚠️ `Application()` deprecated → Warnings pero no falla CI

### Solución SDK Incompatible

**Problema**: Swift 5.9.2 + macOS 15.5 SDK (Xcode 16.4) = Compiler crash  
**Solución**: 
- `runs-on: macos-13` (en lugar de `macos-latest`)
- `sudo xcode-select -s /Applications/Xcode_15.4.app` (SDK compatible)

## 🚦 Estados de Validación

### ✅ PASS - Todo correcto
- Versiones compatibles
- Build exitoso
- Tests pasan

### ⚠️ WARN - Revisar recomendado
- APIs deprecadas (causan warnings)
- Potenciales problemas de memoria
- Código específico de macOS

### ❌ FAIL - Debe corregirse
- Versiones incompatibles
- Package.resolved incorrecto
- Build falla

## 🛠️ Solución de Problemas Comunes

### Error: "unknown PinsStorage version 3"
```bash
rm Package.resolved
swift package resolve
```

### Error: Vapor version incompatible
```bash
# En Package.swift, usar versión compatible:
.package(url: "https://github.com/vapor/vapor.git", from: "4.106.0")
```

### Error: Swift version mismatch
```bash
# Actualizar todas las configuraciones:
# Package.swift: swift-tools-version:5.9
# .github/workflows/ci.yml: swift-version: '5.9.2'
# web.Dockerfile: FROM swift:5.9.2-jammy
```

## 🎯 Flujo de Trabajo Recomendado

1. **Antes de desarrollar:**
   ```bash
   ./validate-ci-compatibility.sh
   ```

2. **Durante desarrollo:**
   - Los hooks pre-push se ejecutan automáticamente

3. **Si hay problemas:**
   ```bash
   # Validar manualmente
   ./validate-ci-compatibility.sh
   
   # Corregir issues
   # ... hacer cambios ...
   
   # Re-validar
   ./validate-ci-compatibility.sh
   ```

4. **Push seguro:**
   ```bash
   git push  # Pre-push hook valida automáticamente
   ```

## 📈 Beneficios

- **⚡ Velocidad**: Evita ciclos de push → fallo → fix → push
- **💰 Costo**: Reduce uso de minutos de GitHub Actions
- **🎯 Eficiencia**: Detecta problemas localmente antes que en CI
- **📊 Visibilidad**: Reportes detallados de compatibilidad

## 🔄 Actualizaciones

Este sistema de validación se actualiza automáticamente cuando:
- Se agregan nuevas versiones de Swift a GitHub Actions
- Se detectan nuevos patrones de fallos
- Se identifican incompatibilidades de dependencias

¡Mantén tus pushes limpios y tus CI builds verdes! 🟢
