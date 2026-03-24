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
