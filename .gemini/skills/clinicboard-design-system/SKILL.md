---
name: clinicboard-design-system
description: Procedural guide for maintaining and implementing the ClinicBoard visual identity (Clinical Teal + Slate Frío). Use when Gemini CLI needs to build new UI components, refactor existing styles, or ensure consistency with the established Tailwind config and design tokens.
---

# ClinicBoard Design System (Clinical Teal + Slate Frío)

This skill ensures all UI development aligns with the ClinicBoard "Supabase-clinical" aesthetic.

## Core Visual Identity

- **Colors**: Clinical Teal (Brand) + Slate Frío (Neutral).
- **Typography**: Outfit (Sans-serif, 1:1.2 scale) + IBM Plex Mono (Monospace).
- **Radius**: Consistent `rounded-md` (6px) for cards, `rounded-full` for status.
- **Shaders**: Border-first approach, minimal shadows.

## Tailwind Integration

Always prefer Tailwind classes over arbitrary CSS variables.

### 1. Color Scales
- **Brand (Teal)**: `brand-1` to `brand-12`. `brand-8` is the primary action color.
- **Neutral (Slate)**: `neutral-1` to `neutral-12`. `neutral-1` is page bg, `neutral-12` is ink.

### 2. Badges / Pills (Status)
The "Pill" system is the standard for clinical and workflow statuses.

**Visual Rules**:
- **Background**: 10% opacity of the semantic color.
- **Border**: 30% opacity of the semantic color.
- **Indicator**: A 6px solid dot (`::before`) of the semantic color at the start.
- **Text**: Small (`11px`), medium weight, semantic color (darker for readability).

**Implementation**:
Use the `Badge` component with these variants:
- `pill-success`: Active, Fulfilled, Stable (Teal).
- `pill-warning`: Pending, Arrived, Low Risk (Amber).
- `pill-danger`: Critical, Canceled, No-show (Red).
- `pill-info`: In Progress, Booked (Blue).
- `pill-neutral`: Resolved, Inactive, Proposed (Gray).

*Note: Avoid adding manual Tailwind padding or font classes; the `.pill` class in globals.css handles the layout.*

### 3. Inputs & Forms
Standardize all data entry points to minimize visual noise.

**Visual Rules**:
- **Focus State**: Always use Teal (`brand-8`) for border and a 10% opacity ring (`ring-brand-8/10`).
- **Placeholder**: Use `text-neutral-8` (Slate Muted).
- **Radius**: Consistent `rounded-md`.
- **Affixes**: 
    - ❌ No decorative icons (e.g., mail icon in email field).
    - ✓ Use functional text affixes (e.g., "+58" for phone, "ID" for identification).

**Implementation**:
Use the `Input` or `InputGroup` components. For groups, use `InputGroupAddon` with text instead of icons.

### 4. Typography
Standard classes:
- `text-xs`: 12px (Secondary info).
- `text-sm`: 13px (Default text/labels).
- `text-base`: 15px (Body copy).

### 5. Components
- **Buttons**: Use `Button` with `size="xs"|"sm"|"md"|"lg"`. Avoid elevation shadows.
- **Cards**: `border border-border bg-card`.

## Workflow for New UI

1. **Verify Config**: Use semantic roles (`success`, `warning`, `info`) mapped in `tailwind.config.ts`.
2. **Pill Usage**: For any status indicator, use `Badge variant="pill-*"` without extra classes.
3. **Accessibility**: Ensure `DialogTitle` (can be `sr-only`) is present in all Dialogs.
