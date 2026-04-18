---
name: clinicboard-design-system
description: Procedural guide for maintaining and implementing the ClinicBoard visual identity (Clinical Teal + Slate Frío). Use when Gemini CLI needs to build new UI components, refactor existing styles, or ensure consistency with the established Tailwind config and design tokens.
---

# ClinicBoard Design System (Clinical Teal + Slate Frío)

This skill ensures all UI development aligns with the ClinicBoard "Supabase-clinical" aesthetic.

## Core Visual Identity

- **Colors**: Clinical Teal (Brand) + Slate Frío (Neutral).
- **Typography**: Outfit (Sans-serif, 1:1.2 scale) + IBM Plex Mono (Monospace).
- **Radius**: Consistent `rounded-md` (6px).
- **Shaders**: Border-first approach, minimal shadows.

## Tailwind Integration

Always prefer Tailwind classes over arbitrary CSS variables or inline styles.

### 1. Color Scales
- **Brand (Teal)**: `brand-1` to `brand-12`. `brand-8` is the primary action color.
- **Neutral (Slate)**: `neutral-1` to `neutral-12`. `neutral-1` is page bg, `neutral-12` is ink.
- **Semantic Roles**:
  - Success: `bg-success` (mapped to Teal/Brand).
  - Warning: `bg-warning` (Amber).
  - Danger: `bg-destructive` (Red).
  - Info: `bg-info` (Blue).

### 2. Typography
Use these standard classes which are pre-mapped in `globals.css`:
- `text-xs`: 12px / Leading 16px
- `text-sm`: 13px / Leading 18px
- `text-base`: 15px / Leading 22px (Default)
- `text-lg`: 16px / Leading 24px
- `text-5xl`: 32px / Leading 40px (Hero)

### 3. Components
- **Buttons**: Use the refactored `Button` component with `size="xs"|"sm"|"md"|"lg"`.
- **Containers**: Use `border border-border` for card definitions.
- **Dark Mode**: Use `dark:` prefix with `neutral` scales (e.g., `dark:bg-neutral-2`).

## Workflow for New UI

1. **Verify Config**: Check `tailwind.config.ts` for established color mappings.
2. **Use Semantic Classes**: Use `text-foreground`, `bg-background`, `border-border` first.
3. **Escalate to Scales**: If specific depth is needed, use `neutral-X` or `brand-X`.
4. **Validation**: Ensure contrast accessibility (OKLCH based) and responsive density.

Refer to `references/tokens.md` for exact HEX/OKLCH mappings if building complex SVG or custom CSS components.
