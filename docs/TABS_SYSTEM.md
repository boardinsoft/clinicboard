# Sistema de Pestañas (Tabs) - Clinicboard

## 📋 Resumen

Este documento describe las mejoras implementadas en el sistema de pestañas de Clinicboard, enfocadas en estabilidad, prevención de duplicados y mejor experiencia de usuario.

## 🎯 Problemas Resueltos

### 1. **Duplicación de Pestañas** ✅
- **Antes**: Diferentes rutas con el mismo prefijo creaban pestañas duplicadas
- **Después**: IDs únicos basados en URLs normalizadas previenen duplicados
- **Ejemplo**: `/patients`, `/patients/123`, `/patients/new` ahora tienen IDs únicos

### 2. **Sincronización Inconsistente** ✅
- **Antes**: Lógica compleja de sincronización con múltiples effects
- **Después**: Método centralizado `syncWithRouter()` en el store
- **Beneficio**: Single source of truth entre router y estado de pestañas

### 3. **Pérdida de Scroll Position** ✅
- **Antes**: Al cambiar entre pestañas se perdía la posición de scroll
- **Después**: TabContentManager preserva scroll con refs y Map
- **Beneficio**: Mejor UX, navegación fluida entre pestañas

### 4. **Gestión de Cierre Mejorada** ✅
- **Antes**: `setTimeout` hacky, navegación impredecible
- **Después**: Cierre sincrónico con navegación determinística
- **Extra**: Context menu con opciones (cerrar otras, cerrar todas, etc.)

### 5. **Límite de Pestañas** ✅
- **Antes**: Sin límite, posible degradación de performance
- **Después**: Máximo 10 pestañas, cierre automático de la más antigua
- **Configuración**: `TAB_CONFIG.MAX_TABS` en `tabs-utils.ts`

## 🏗️ Arquitectura

```
src/
├── lib/
│   └── tabs-utils.ts              # Utilidades centralizadas
│       ├── generateTabId()        # Genera IDs únicos por URL
│       ├── normalizeTabUrl()      # Normalización de URLs
│       ├── getTabTitle()          # Títulos contextuales
│       ├── isSameTab()            # Comparación de URLs
│       └── TAB_CONFIG             # Configuración global
│
├── store/
│   └── useTabStore.ts             # Store de Zustand refactorizado
│       ├── addTab()               # Validación + deduplicación
│       ├── removeTab()            # Navegación automática
│       ├── syncWithRouter()       # Sincronización centralizada
│       ├── findTabByUrl()         # Búsqueda normalizada
│       ├── closeAllTabs()         # Gestión bulk
│       ├── closeOtherTabs()       # Gestión contextual
│       └── loadPersistedTabs()    # Persistencia localStorage
│
├── hooks/
│   └── useTabSync.ts              # Hook de sincronización
│       ├── useTabSync()           # Sincronización completa
│       ├── useAutoTab()           # Auto-creación de pestañas
│       └── useSyncOnly()          # Solo sincronización
│
└── components/ui/
    ├── TabBar.tsx                 # Barra de pestañas mejorada
    │   ├── Context menu           # Click derecho con opciones
    │   ├── Indicador isDirty      # Círculo si hay cambios sin guardar
    │   └── Cierre sincrónico      # Sin setTimeout
    │
    └── TabContentManager.tsx      # Gestor de contenido optimizado
        ├── Refs por pestaña       # Preservación de DOM
        └── Scroll preservation    # Map de posiciones
```

## 🔧 API Principal

### `useTabStore`

```typescript
import { useTabStore } from '@/store/useTabStore';

// En un componente
function MyComponent() {
  const { tabs, activeTabId, addTab, removeTab } = useTabStore();

  // Agregar nueva pestaña
  addTab({
    title: 'Nueva Pestaña',
    url: '/patients/123',
  });

  // Cerrar pestaña
  removeTab(tabId);

  // Marcar como "dirty" (cambios sin guardar)
  useTabStore.getState().setTabDirty(tabId, true);
}
```

### `useTabSync` Hook

```typescript
import { useTabSync } from '@/hooks/useTabSync';

// Sincronización automática con creación de pestaña
function PatientPage({ patient }) {
  useTabSync({
    autoCreateTab: true,
    context: { patient },
  });

  return <div>Patient Detail</div>;
}

// Solo sincronización (sin auto-crear)
function SettingsPage() {
  useSyncOnly();
  return <div>Settings</div>;
}
```

### Utilidades

```typescript
import {
  generateTabId,
  normalizeTabUrl,
  getTabTitle,
  isSameTab,
} from '@/lib/tabs-utils';

// Generar ID único
const tabId = generateTabId('/patients/123'); // '/patients/123'

// Normalizar URL
const normalized = normalizeTabUrl('/patients/'); // '/patients'

// Obtener título contextual
const title = getTabTitle('/patients/123', { patient });
// → "Juan Pérez" (si patient está presente)

// Comparar URLs
const same = isSameTab('/patients/', '/patients'); // true
```

## 📊 Flujos de Navegación

### Flujo 1: Usuario hace clic en navegación lateral

```
Usuario → IconRail.onClick()
  ↓
addTab({ title, url }) → Validación + deduplicación
  ↓
router.push(url)
  ↓
useEffect en AppShell → syncWithRouter()
  ↓
Pestaña activa + navegación completa
```

### Flujo 2: Usuario cierra pestaña

```
Usuario → TabBar.handleCloseTab()
  ↓
Verificar isDirty → Advertencia si hay cambios
  ↓
removeTab(id) → Calcular nueva pestaña activa
  ↓
router.push(nextTab.url) → Navegar
  ↓
Estado consistente
```

### Flujo 3: Navegación programática

```
router.push('/patients/123')
  ↓
pathname cambia → useEffect en AppShell
  ↓
syncWithRouter(pathname)
  ↓
Buscar pestaña existente → Activar
  ↓
Si no existe → Log debug (no auto-crear)
```

## 🎨 Mejoras UX

### Context Menu (Click Derecho)
- **Cerrar**: Cierra la pestaña actual
- **Cerrar otras**: Mantiene solo la pestaña actual
- **Cerrar a la derecha**: Cierra todas las pestañas posteriores
- **Cerrar todas**: Limpia todas las pestañas y va al tablero

### Indicador Visual
- **Círculo azul**: Pestaña tiene cambios sin guardar (`isDirty`)
- **Tooltip**: Muestra URL completa al hacer hover
- **Título truncado**: Máximo 200px con ellipsis

### Persistencia
- **localStorage**: Guarda estado de pestañas entre sesiones
- **Versión**: Sistema de migración si cambia estructura
- **TTL**: Pestañas antiguas (>7 días) se eliminan al cargar

## 🧪 Testing

### Escenarios de Prueba

1. **Duplicados**
   ```
   ✓ Navegar a /patients dos veces → Solo 1 pestaña
   ✓ Navegar a /patients/ y /patients → Misma pestaña
   ✓ /patients?q=juan y /patients?q=maria → Pestañas diferentes
   ```

2. **Scroll Preservation**
   ```
   ✓ Hacer scroll en pestaña A → Cambiar a B → Volver a A
   ✓ Posición de scroll preservada
   ```

3. **Límite de Pestañas**
   ```
   ✓ Abrir 10 pestañas → OK
   ✓ Intentar abrir 11ª → Cierra la más antigua
   ```

4. **Context Menu**
   ```
   ✓ Click derecho → Menú contextual visible
   ✓ "Cerrar otras" → Solo queda la seleccionada
   ✓ "Cerrar todas" → Vuelta al tablero
   ```

5. **Persistencia**
   ```
   ✓ Abrir pestañas → Recargar página
   ✓ Pestañas restauradas correctamente
   ✓ Orden preservado
   ```

## ⚙️ Configuración

### `src/lib/tabs-utils.ts`

```typescript
export const TAB_CONFIG = {
  MAX_TABS: 10,                    // Máximo de pestañas abiertas
  DEFAULT_TAB_ID: '/',             // ID de la pestaña por defecto
  DEFAULT_TAB_TITLE: 'Tablero',    // Título por defecto
  STORAGE_KEY: 'clinicboard:tabs:state',  // Clave localStorage
  STORAGE_VERSION: 1,              // Versión de persistencia
} as const;
```

## 🔍 Debugging

### Logs Disponibles

```javascript
// En consola del navegador
console.log('[TabStore]', mensaje);  // Operaciones del store
console.warn('[TabStore]', advertencia);  // Validaciones fallidas
console.debug('[TabStore]', debug);  // Sincronización
```

### Inspeccionar Estado

```javascript
// En consola del navegador
useTabStore.getState().tabs;  // Ver todas las pestañas
useTabStore.getState().activeTabId;  // Ver pestaña activa

// Persistencia
localStorage.getItem('clinicboard:tabs:state');  // Ver estado guardado
```

## 🚀 Próximas Mejoras (Futuro)

1. **Drag & Drop** para reordenar pestañas
2. **Confirmación modal** antes de cerrar pestañas dirty
3. **Animaciones** de transición entre pestañas
4. **Atajos de teclado**:
   - `Cmd/Ctrl + W`: Cerrar pestaña activa
   - `Cmd/Ctrl + Tab`: Siguiente pestaña
   - `Cmd/Ctrl + Shift + Tab`: Pestaña anterior
5. **Pin tabs**: Pestañas fijas que no se cierran con "cerrar otras"
6. **Iconos personalizados** por tipo de pestaña

## 📝 Notas de Implementación

- **React 19 Strict Mode**: Todos los effects son idempotentes
- **Next.js App Router**: Compatible con navegación client-side
- **Performance**: Solo renderiza contenido de pestaña activa
- **Accesibilidad**: Soporte de teclado en todos los controles
- **Responsive**: Scroll horizontal en móvil si hay muchas pestañas

## 🐛 Troubleshooting

### Problema: Pestañas duplicadas después de actualizar

**Solución**: Limpiar localStorage y recargar:
```javascript
localStorage.removeItem('clinicboard:tabs:state');
location.reload();
```

### Problema: Scroll no se preserva

**Verificar**: El contenedor debe tener `overflow: auto` y altura fija.
El TabContentManager gestiona esto automáticamente.

### Problema: Pestaña activa no coincide con URL

**Causa**: Navegación programática sin pasar por addTab()
**Solución**: Siempre usar `addTab()` + `router.push()` juntos

## 📚 Referencias

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Context Menu](https://ui.shadcn.com/docs/components/context-menu)
