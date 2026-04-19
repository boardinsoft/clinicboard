# CLAUDE.md — Clinicboard

Guía de contexto para Claude Code. Léela antes de hacer cualquier cambio.

---

## Qué es este proyecto

**Clinicboard** es un sistema de gestión clínica web (SaaS) orientado a médicos especialistas independientes y pequeños centros médicos en Venezuela. Está en **fase de prototipo funcional** (MVP).

Su propuesta de valor central: un expediente médico digital FHIR-nativo, ágil y sin fricción, que reemplaza el papel en consultorios privados.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) |
| Lenguaje | TypeScript 5 |
| UI | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| Formularios | React Hook Form + Zod v4 |
| Estado global | Zustand v5 |
| Estándar clínico | FHIR R4 |
| Despliegue | Vercel |

---

## Arquitectura

```
src/
├── app/
│   ├── (auth)/login/          # Ruta pública de login
│   ├── (dashboard)/           # Rutas protegidas (layout con auth check)
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── appointments/      # Agenda de citas (Kanban + Timeline + Walk-ins)
│   │   ├── patients/          # Gestión de pacientes (CRUD + búsqueda fuzzy)
│   │   ├── history/           # Historia clínica / Encuentros
│   │   └── prescriptions/     # Recetas médicas (en desarrollo)
│   └── layout.tsx             # Root layout (ThemeProvider, fuente Inter)
├── actions/                   # Server Actions de Next.js (lógica de negocio)
│   ├── appointments.ts        # CRUD citas + transiciones de estado FHIR
│   ├── encounters.ts          # Encuentros/consultas SOAP
│   ├── patients.ts            # Pacientes + búsqueda RPC
│   ├── prescriptions.ts       # Recetas
│   ├── conditions.ts          # Condiciones médicas CIE-10
│   ├── allergies.ts           # Alergias
│   ├── diagnoses.ts           # Diagnósticos
│   ├── auth.ts                # Autenticación
│   └── search.ts              # Búsqueda global
├── components/
│   ├── ui/                    # Componentes base de shadcn/ui + personalizados
│   ├── clinical/              # Componentes clínicos (DiagnosisSearch)
│   └── patients/              # Componentes de pacientes (PatientSearchField)
├── lib/
│   ├── schemas/               # Schemas Zod de validación
│   ├── fhir/types.ts          # Tipos FHIR R4
│   ├── supabase/              # Clients de Supabase (client.ts / server.ts)
│   ├── crypto/aes256.ts       # Encriptación AES-256-GCM para PHI
│   ├── date-utils.ts          # Utilidades de fecha (timezone Venezuela -04:00)
│   └── appointments/appointment-rules.ts  # Reglas de negocio de citas
├── store/                     # Zustand stores (layout, tabs)
├── types/database.types.ts    # Tipos auto-generados de Supabase
└── proxy.ts                   # Middleware de autenticación (Next.js 16 usa proxy.ts, no middleware.ts)
```

---

## Base de datos (Supabase)

### Tablas principales

| Tabla | Descripción |
|---|---|
| `practitioners` | Médicos. `auth_user_id` linkea con Supabase Auth |
| `patients` | Pacientes. Multi-tenant: `practitioner_id` aisla datos por médico |
| `appointments` | Citas. Estados FHIR: `proposed→pending→booked→arrived→fulfilled/cancelled/noshow` |
| `encounters` | Encuentros/consultas. SOAP notes + signos vitales + diagnósticos |
| `conditions` | Condiciones médicas (CIE-10) |
| `allergy_intolerances` | Alergias e intolerancias |
| `medication_requests` | Recetas médicas (FHIR MedicationRequest) |
| `cie10` | Catálogo de diagnósticos CIE-10 (fulltext search) |
| `appointment_audit_log` | Auditoría de cambios de estado de citas |
| `encounter_audit_log` | Auditoría de cambios de estado de encuentros |
| `encounter_addenda` | Notas adicionales a encuentros finalizados (inmutables) |

### RPC Functions
- `search_patients_v2(p_id, search_term)` — Búsqueda fuzzy de pacientes por nombre e identificador
- `search_patients_fuzzy(p_id, search_term)` — Variante fuzzy con similarity score

### Multi-tenancy
Todos los datos del paciente están aislados por `practitioner_id`. Las queries SIEMPRE deben incluir `.eq('practitioner_id', user.id)` (RLS como segunda línea de defensa).

---

## Convenciones clave

### Server Actions
- Todos los archivos en `src/actions/` usan `'use server'`
- Patrón de respuesta: `{ data } | { error: string | object }`
- SIEMPRE verificar auth al inicio: `await supabase.auth.getUser()`
- SIEMPRE validar con Zod antes de escribir a la DB
- SIEMPRE llamar `revalidatePath()` tras mutaciones

### Transiciones de estado (State Machine FHIR)
Las transiciones de `appointments` y `encounters` están controladas por máquinas de estado en `src/actions/appointments.ts` y `src/actions/encounters.ts`. **Nunca** cambiar el estado directamente sin pasar por `validateTransition()`.

### Timezone
- La app opera en Venezuela (UTC-4, sin DST)
- Usar `nowInVE()` y `toISODate()` de `src/lib/date-utils.ts` para fechas locales
- Los filtros de Supabase usan offset `-04:00` explícito, no UTC

### Encriptación PHI
- Notas sensibles se encriptan con AES-256-GCM vía `src/lib/crypto/aes256.ts`
- Requiere `ENCRYPTION_KEY` en variables de entorno
- El campo `encrypted_notes` en `patients` es el principal destinatario

### Schemas Zod
- Están en `src/lib/schemas/`
- Las citas requieren intervalos de 15 minutos exactos en `start_time` y `end_time`
- Los IDs de paciente y profesional deben ser UUIDs válidos

---

## Design System (Clinicboard)

### Paleta de Colores

**Neutral Scale (Slate Frío):**
- Light: `n-1` (#fbfcfd) a `n-12` (#0f141e) — grises neutros
- Dark: `n-1` (#0b0f15) a `n-12` (#eef1f5) — grises invertidos
- Uso: Backgrounds, borders, text hierarchy

**Brand Scale (Clinical Teal):**
- Light: `b-1` (#f0fbf8) a `b-12` (#03271f) — teal claro a oscuro
- Dark: `b-8` brightness aumentado a #1fd4a8 para better contrast
- Uso: Botones primarios, acciones, estados activos
- Primario: `b-8` = #0ca488 (light) / #1fd4a8 (dark)

**Colores Semánticos:**
- Success: #0ca488 (teal, mismo que primario)
- Warning: #c98618 (naranja)
- Danger: #d24848 (rojo)
- Info: #2f7cf6 (azul)
- Neutral: #5a6478 (gris)
- Cada uno tiene: `--s-{color}` (text), `--s-{color}-bg` (background), `--s-{color}-br` (border)

### Tipografía

**Familias:**
- Sans (Outfit): Body text, headers, UI
- Mono (IBM Plex Mono): Code, medical identifiers, timestamps

**Escala de Tamaños:**
- Body: 15px / 1.55 line-height (base)
- h1: 32px / 700 weight
- h2: 28px / 600 weight
- h3: 24px / 600 weight
- h4: 20px / 500 weight
- h5-h6: 18px-16px / 500 weight

### Espaciado

**Sistema de espaciado:**
- Tokens: 1-12 (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px...)
- Usado en Tailwind: `gap-1`, `p-2`, `mx-3`, etc.

**Border Radius:**
- Base: 8px (`--radius`)
- Variantes: md (6px), sm (4px)
- Usualmente `rounded-[5px]` (custom) en header/componentes

### Modo Dark

- CSS class-based: `.dark` en `<html>`
- Implementado con `next-themes`
- Toggle en user dropdown menu
- **CRÍTICO**: Verificar contraste en ambos modos (WCAG AA mínimo 4.5:1)
- Override dark: usar `dark:class-name` en Tailwind

### Ubicaciones Clave

- `src/app/globals.css` — Variables CSS, paleta, componentes base (pills, cards, tabla clínica)
- `tailwind.config.ts` — Config de Tailwind, fonts, spacing, dark mode
- `src/components/ui/` — Componentes shadcn/ui personalizados

---

## Reglas de Accesibilidad (WCAG AA)

### Contraste de Texto

**Requerimientos:**
- Normal text (< 18px): Mínimo 4.5:1 de contraste
- Large text (≥ 18px bold or ≥ 24px): Mínimo 3:1
- Separadores/borders: Mínimo 3:1 (pueden ser menores si decorativos)
- Gráficos/icons: Mínimo 3:1 contra fondo adyacente

**Verificación:**
- Usar [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- DevTools: Element → Accessibility → Color contrast
- Probar en LIGHT Y DARK mode siempre

### ARIA Labels

**Reglas obligatorias:**
- Botones SIN texto visible: deben tener `aria-label="..."`
- Iconos sólos (Help, Bell, etc.): `aria-label` requerido
- Dropdowns: Radix UI maneja automáticamente `role="menu"`
- Inputs: Usar `<label>` o `aria-label` (nunca solo placeholder)
- Tooltips: `aria-describedby` o usar Radix `<Tooltip>`

**Ejemplo:**
```tsx
<button aria-label="Abrir búsqueda global (⌘K)" onClick={handleSearch}>
  <SearchIcon size={16} />
</button>
```

### Navegación por Teclado

**Requerimientos:**
- Tab order: Izquierda → derecha, top → bottom (lógico)
- Focus ring: Siempre visible (no remover con `outline: none` sin alternativa)
- Dropdown items: Navegables con Arrow keys (Radix maneja)
- Escape: Cierra modals, dropdowns, tooltips

**Focus Ring Estándar:**
```tsx
className="focus:ring-2 focus:ring-b-8 focus:outline-none"
```

### Elementos Específicos

**Workspace Header (AppShell):**
- Header border visible en dark mode (no opacity < 100%)
- Plan Badge: Contraste mínimo 4.5:1 en ambos modos, usando bg-n-3 (neutral) en lugar de colores semánticos
- Search pill: Keyboard shortcut (⌘K) debe tener contraste 4.5:1+
- Dropdown items: text-n-10 en light, `dark:text-n-11` en dark
- Separadores: `bg-n-4 dark:bg-n-5` (visible en ambos)
- Icons en dropdowns: mínimo 3:1 contra fondo
- Avatar button: Usa bg-n-3/n-5 (neutral) en lugar de gradiente de brand, text-n-11/n-12
- Avatar profile header: bg-n-2/n-4 (neutral), initials en text-n-10/n-11
- Logout button: Usa colores neutros (text-n-10/n-11, hover:bg-n-3/n-2) en lugar de colores semánticos destructive

**Formularios:**
- Labels siempre visibles (no confiar en placeholder solo)
- Error messages: color + icon, no color sólo
- Required fields: * más aria-required o aria-label

**Tablas:**
- Headers: `<th scope="col">` o `scope="row"`
- Datos: Contraste 4.5:1 contra fondo
- Hover states: Visible, no confiar en color sólo

### Testing de Accesibilidad

**Herramientas:**
1. **axe DevTools** (Chrome/Firefox plugin) — Scans automáticos WCAG
2. **Lighthouse** (Chrome DevTools) — Built-in accessibility audit
3. **NVDA** (Windows) o **VoiceOver** (Mac) — Screen readers
4. **Keyboard-only testing** — Tab, Arrow keys, Enter, Escape sin mouse

**Checklist pre-commit:**
- [ ] Contraste 4.5:1 en light mode (WebAIM)
- [ ] Contraste 4.5:1 en dark mode (WebAIM)
- [ ] Todos los buttons/icons tienen aria-label
- [ ] Tab order es lógico (testing con Tab key)
- [ ] Focus ring visible en todos los elementos
- [ ] Dropdowns navegables con arrow keys
- [ ] Escape cierra overlays

### Documentación de Auditoría

Auditoría más reciente: **2026-04-18** (Continuación)

**Contraste Reduction Phase 2** (Avatar & Logout):
- Cambio de avatar trigger: `bg-gradient-to-tr from-b-3 to-b-8` → `bg-n-3 dark:bg-n-5`
- Cambio de avatar text: `text-white` → `text-n-11 dark:text-n-12`
- Cambio de profile avatar: `bg-gradient-to-tr from-b-3 to-b-8` → `bg-n-2 dark:bg-n-4`
- Cambio de logout button: `text-destructive hover:bg-s-danger-bg` → `text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2`
- Objetivo: Reducir fatiga visual eliminando altos contrastes de colores de marca en interactivos
- Cumplimiento: ✓ WCAG AA (4.5:1 mantenido en todos los elementos)

**Contraste Reduction Phase 3** (Text & Icon Calibration):
- Icons en dropdowns: `text-n-8` → `text-n-9 dark:text-n-10`
- Dropdown headers: `text-n-8` → `text-n-9 dark:text-n-10`
- Status indicators (● Conectado/Offline): `text-n-8 dark:text-n-9` → `text-n-9 dark:text-n-10`
- Secondary buttons (Agregar clínica): `text-b-8 hover:bg-b-1` → `text-n-10 dark:text-n-11 hover:bg-n-3`
- Primary text (Feedback): `text-n-10 dark:text-n-11` → `text-n-11 dark:text-n-12`
- Search pill: `text-n-8` → `text-n-9 dark:text-n-10` + icon y badge badge same
- All dropdown items: agregado dark mode variants para consistencia
- Objetivo: Jerarquía de contraste más sutil, reducción de fatiga visual
- Cumplimiento: ✓ WCAG AA (4.5:1+ en todos los elementos de texto)

---

## Comandos de desarrollo

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # ESLint
npm run db:migrate   # Push de migraciones a Supabase
npm run db:reset     # Reset de base de datos (¡DESTRUCTIVO!)
```

---

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=           # Para encriptación AES-256 de notas PHI
```

---

## Problemas conocidos y deuda técnica

1. ~~**`src/proxy.ts` debería ser `src/middleware.ts`**~~ — Next.js 16 usa `proxy.ts` como convención (no `middleware.ts`). El archivo ya tiene el nombre correcto.

2. **Datos mock en Dashboard** — Los stats de "Recetas Hoy" (hardcoded '4') y "Tiempo Promedio" ('15m') son valores ficticios. Pendiente conectar a datos reales.

3. **Gráfico de actividad semanal** — Usa datos mock hardcoded. Pendiente query real a Supabase.

4. **`src/app/dashboard/page.tsx`** — Página de ejemplo de shadcn en ruta `/dashboard`. Debe eliminarse (ruta huérfana).

5. **`src/components/examples/`** — Componente de calendario de ejemplo. Sin uso real. Debe eliminarse.

6. **`zod-test.js`** en raíz — Script de prueba de desarrollo. Debe eliminarse del repositorio.

7. **Módulo de Recetas** — La página `/prescriptions` está vacía. Pendiente implementar UI.

8. **Rollback en `startConsultationFromAppointment`** — Si falla la creación del Encounter, la cita ya quedó como 'fulfilled' sin rollback. Pendiente implementar transacción atómica.

---

## Seguridad y restricciones

- **NUNCA** usar el `service_role` key en el cliente (browser)
- **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- **NUNCA** saltarse la validación Zod antes de insertar/actualizar
- **NUNCA** hardcodear UUIDs o credenciales en el código
- Las rutas del dashboard están protegidas a nivel de Layout (`src/app/(dashboard)/layout.tsx`)
- El middleware (`proxy.ts`) protege a nivel de edge

---

## Mercado objetivo

- **Primario**: Médicos especialistas independientes en Venezuela
- **Secundario**: Pequeñas clínicas y consultorios privados
- Identificación de pacientes: Cédula venezolana (sistema `venezuela-ci`)
- Idioma de la UI: Español

---

## Filosofía de desarrollo

- **FHIR R4 como estándar**: El modelo de datos sigue FHIR R4. Cada recurso tiene `fhir_id` como identificador interoperable.
- **Seguridad primero**: Datos de salud (PHI) requieren encriptación en reposo y auditoría.
- **Multi-tenant implícito**: Un médico solo ve sus propios pacientes. No hay super-admin aún.
- **Sin over-engineering**: El código debe ser simple, directo y fácil de mantener.
