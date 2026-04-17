# 🏥 ClinicBoard — Brand Identity MVP

> **Producto:** SaaS de gestión de pacientes, citas, clínicas y encuentros médicos
> **Etapa:** MVP · Primera versión pública

---

## 1. 🎨 Sistema de Color

### Paleta de Marca (Core Brand)

La identidad de Clinicboard se define por un azul tecnológico y profesional, complementado con tonos clínicos de alta precisión.

| Nombre | Token | Valor HEX | Valor OKLCH | Rol |
| :--- | :--- | :--- | :--- | :--- |
| **Azul Primario** | `--primary` | `#3981f6` | `oklch(0.597 0.197 262)` | Acción principal, confianza, UI activa. |
| **Índigo Profundo** | `--secondary` | `#4045ba` | `oklch(0.432 0.215 271)` | Detalles de marca, acento de identidad. |
| **Menta Salud** | `--brand-mint` | `#90e2bc` | `oklch(0.843 0.097 155)` | Estado estable, éxito clínico, balance. |
| **Rojo Clínico** | `--destructive` | `#e64343` | `oklch(0.561 0.215 25)` | Alertas críticas, errores, riesgo. |

### Arquitectura de Superficies (Neutral Dark Mode)

Clinicboard utiliza un sistema de capas basado en **grises neutros absolutos** (Chroma 0) para evitar tintes azulejos o verdosos, siguiendo la jerarquía visual de Supabase.

| Nivel | Rol | Valor HEX | Valor OKLCH | Componentes |
| :--- | :--- | :--- | :--- | :--- |
| **L1 (Base)** | `--sidebar-background` | `#171717` | `oklch(0.21 0 0)` | Rail, Sidebars, Header, fondo de Tablas. |
| **L2 (Canvas)** | `--background` | `#1c1c1c` | `oklch(0.24 0 0)` | Fondo principal de la App, Paneles de detalle. |
| **L3 (Surface)** | `--muted` / `--card` | `#262626` | `oklch(0.31 0 0)` | Tabs, Sub-headers, Cards de información. |
| **L4 (Elevated)** | `--popover` | `#313131` | `oklch(0.38 0 0)` | Modales, Menús, Popovers, Hover states. |

> ⚠️ **Nota de diseño:** Los bordes se aplican con `--border: oklch(0.28 0 0)` y se suavizan habitualmente con una opacidad del 40% (`border-border/40`) para lograr líneas finas y sutiles.

### Paleta Semántica (Estados)

| Estado | Token | Valor OKLCH | Aplicación |
| :--- | :--- | :--- | :--- |
| **Estable** | `--clinical-stable` | `oklch(0.843 0.097 155)` | Paciente sano, cita completada. |
| **Pendiente** | `--clinical-pending` | `oklch(0.650 0.140 75)` | En espera, resultados pendientes. |
| **Crítico** | `--clinical-critical` | `oklch(0.561 0.215 25)` | Alerta médica, cita cancelada. |
| **Inactivo** | `--clinical-inactive` | `oklch(0.58 0 0)` | Registro archivado, sin actividad. |

---

## 2. 🔤 Tipografía

### Familia Principal: **Inter**

| Rol                          | Peso         | Tamaño sugerido  |
|------------------------------|--------------|------------------|
| Display / Hero               | `700–800`    | `2xl–4xl`        |
| Headings                     | `600–700`    | `lg–2xl`         |
| Body / Labels                | `400–500`    | `sm–base`        |
| Badges / Captions            | `500–600`    | `2xs–xs`         |
| Monospace (datos clínicos)   | JetBrains Mono `400` | `xs–sm`  |

> ✅ **Regla de oro:** Nunca mezclar más de 3 pesos en la misma pantalla.
> Los números clínicos (dosis, edades, fechas) van siempre en **JetBrains Mono** para legibilidad y autenticidad médica.

---

## 3. 🖼️ Iconografía y Logo

### Base: Lucide `Stethoscope`

- **Edición para autenticidad:** Rediseñar el SVG con un auricular de curva más orgánica o añadir un pulso/latido sobre el diafragma.
- **Variantes a producir:**
  - `logo-mark.svg` — solo el icono (cuadrado, para favicons y apps)
  - `logo-full-horizontal.svg` — icono + wordmark horizontal
  - `logo-full-stacked.svg` — icono + wordmark apilado (splash screens)

### Logo Mark (icono solo)

- **Forma contenedora:** Cuadrado con `border-radius: 20–25%` (suave, no circular)
- **Fondo:** `--primary` en gradiente diagonal hacia `--brand-indigo`
- **Icono:** Blanco `oklch(1 0 0)` al 100%
- **Tamaños mínimos:** 16px (favicon), 32px (sidebar), 256px (marketing)

### Wordmark

- **Fuente:** `Inter 700`
- **"Clinic":** color `--primary`
- **"Board":** color `--brand-indigo` o `oklch(0.20 0 0)` según fondo
- **Letter-spacing:** `-0.02em` (tracking tight para marca tech)

---

## 4. 📐 Identidad Visual

### Shape Language

- **Border radius UI:** `0.375rem` (actual) — para tarjetas de marketing usar `0.75rem`
- **Estilo:** Curvas suaves — precisión sin frialdad quirúrgica
- **Evitar:** esquinas pill en elementos de datos clínicos (confunde jerarquía)

### Espaciado

- **Escala:** múltiplos de `4px`
- **Densidad:** moderada — el dato clínico requiere aire para ser legible

### Sombras / Elevación

- Light mode: `--shadow-sm` y `--shadow-md` (casi imperceptibles)
- Dark mode: opacidad `0.30–0.45` para mayor profundidad

---

## 5. ✍️ Voz y Tono de Marca

| Atributo       | Descripción                                                                 |
|----------------|-----------------------------------------------------------------------------|
| **Confiable**  | Lenguaje preciso — los médicos tienen tolerancia cero al error              |
| **Eficiente**  | Frases cortas en UI, sin palabras de relleno                                |
| **Humano**     | El paciente es una persona, no un expediente                                |
| **No alarmista** | Errores en tono calmado, orientados a solución                            |

### Microcopy — ejemplos

- ✅ `"Cita registrada para el martes 8 a las 10:00 AM"` → específico y tranquilizador
- ❌ `"Operación completada exitosamente"` → genérico y frío
- ✅ `"No se encontraron pacientes. Puedes agregar uno ahora."` → orientado a acción
- ❌ `"Error 404: recurso no encontrado"` → inapropiado para clínicos

---

## 6. 📦 Assets a Producir (checklist MVP)

### Identidad Base
- [x] `logo-mark.svg` (isotipo oficial extraído del diseño del usuario)
- [x] `logo-full-horizontal.svg` (isotipo + wordmark con colores brand)
- [x] `logo-full-dark.svg` (wordmark blanco para modo oscuro)
- [x] Favicons (set completo 16x16 hasta 512x512)
- [x] OG Image (generado profesionalmente: `public/brand/og-image.png`)

### Sistema de Color
- [x] Tokens CSS en `globals.css` (primary, rose, indigo, danger)
- [x] Integración con Tailwind CSS config

### Componentes UI
- [ ] Botón primario con focus ring en `--primary`
- [ ] Badge de estado de cita (paleta semántica)
- [ ] Avatar de paciente / placeholder con iniciales en `--primary`
- [ ] Empty states con icono del estetoscopio adaptado
- [ ] Loading spinner con color primario

### Comunicación
- [ ] Template de email — confirmación de cita
- [ ] Plantilla de notificación push / SMS
- [ ] Template de onboarding (welcome screen)

### Documentación
- [ ] Styleguide (Notion o Storybook) — paleta + tipografía + componentes
- [ ] README de marca con reglas de uso del logo

---

## 7. 🚫 Brand Don'ts

- No estirar ni distorsionar el logotipo en ningún eje
- No usar el logo sobre fondos con contraste < 4.5:1 (WCAG AA)
- No cambiar colores del wordmark fuera de las variantes oficiales
- No combinar más de 3 colores semánticos en la misma vista
- No usar fuentes distintas a Inter y JetBrains Mono en la interfaz
- No usar amarillo puro — siempre el ámbar calibrado `oklch(0.75 0.14 75)`

---

## 8. ♿ Accesibilidad

- **WCAG AA** en todos los textos sobre fondos de color (ratio ≥ 4.5:1)
- **WCAG AAA** en áreas críticas: alertas de medicación, confirmaciones clínicas
- **Daltonismo:** nunca depender solo del color — usar icon + color + label
- **Tamaño mínimo:** `14px` en cualquier dato clínico visible
- **Modo oscuro verificado:** `oklch(0.92 0 0)` sobre `oklch(0.20 0 0)` ✅

---

> 📌 **Prioridad MVP:** Logo mark → Favicon → Brand tokens CSS → OG Image → Microcopy guide
