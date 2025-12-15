# Design System & Component Library

This document outlines the design system for Emulsion, serving as a reference for UI consistency across the application.

## DESIGN MODE

**Rule**: We avoid one-off styling inside individual pages (including `DesignSystemPage.jsx`). Instead, we define reusable, global foundations (tokens + base styles + component utilities) that can be applied across the whole site.

## Design Style: Contemporary Film Craft (Light Mode)

### 1) Design Philosophy
This style blends **cinematic warmth with streamlined utility** for film inventory management. It celebrates the craft of analog photography while ensuring every interface decision serves clarity and workflow efficiency. Think of it as a well-stocked studio—organized, inspiring, and invitingly practical.

**Core Vibe**: craft-conscious yet accessible, thoughtfully efficient, visually engaging without distraction, warm professionalism.

**Principles**:
- **Clarity first, warmth always**: Every interface element serves the workflow with professional clarity, enhanced by warm, inviting color temperatures and tactile interactions
- **Restrained craft**: Celebrate analog photography through subtle texture and considered details, not decoration for decoration's sake
- **Responsive tactility**: Interactions should feel physically satisfying—hover states, transitions, and drag operations provide immediate, delightful feedback
- **Functional beauty**: Design decisions balance aesthetic appeal with workflow efficiency; beauty emerges from purposeful, well-executed functionality
- **Generous breathing room**: Whitespace and padding create a calm, uncluttered studio environment where content can shine

### 2) Design Tokens (Light Mode)

**Colors**:

*Base Neutrals (Film Lab Foundation)*:
- `--color-bg-base`: `#F8F7F5` (off-white, slight warm tint)
- `--color-bg-elevated`: `#FFFFFF` (pure white for cards/modals)
- `--color-bg-subtle`: `#EFEEEC` (lighter warmth for hover states)
- `--color-text-primary`: `#2D2D2D` (charcoal, primary text)
- `--color-text-secondary`: `#6B6660` (warm gray, secondary text)
- `--color-text-tertiary`: `#8B8680` (lighter gray, hints/metadata)
- `--color-border-subtle`: `#E5E5E5` (silver, gentle dividers)
- `--color-border-strong`: `#D9D9D9` (stronger borders when needed)

*Accent Colors (Film Process Inspired)*:
- **Primary (C41 Orange)**: `#F0732A` (energetic, film base orange)
  - Hover: `#D96520`
  - Light: `#FFF4ED` (background tint)
- **Secondary (Cyan/Teal)**: `#06B6D4` (cool technical, reminiscent of color negative film)
  - Hover: `#0891B2`
  - Light: `#ECFEFF` (background tint)
- **Accent (Purple)**: `#9333EA` (creative, sophisticated)
  - Hover: `#7C3AED`
  - Light: `#FAF5FF` (background tint)
- **Success (Green)**: `#10B981` (positive actions)
- **Warning (Amber)**: `#F59E0B` (caution)
- **Error (Red)**: `#DC2626` (darkroom red safelight)

*Semantic Usage*:
- Primary actions & highlights: C41 Orange
- Data/stats/informational: Cyan
- Creative/special features: Purple
- Use Success/Warning/Error sparingly for feedback only

**Typography**:

*Font Stack (Native System)*:
- `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- Leverages native SF Pro on macOS for optimal readability and system integration

*Type Scale*:
- **Display** (Hero headings): `font-size: 2.5rem` (40px), `font-weight: 700`, `line-height: 1.1`
- **H1**: `font-size: 2rem` (32px), `font-weight: 700`, `line-height: 1.2`
- **H2**: `font-size: 1.5rem` (24px), `font-weight: 600`, `line-height: 1.3`
- **H3**: `font-size: 1.25rem` (20px), `font-weight: 600`, `line-height: 1.4`
- **Body Large**: `font-size: 1rem` (16px), `font-weight: 400`, `line-height: 1.6`
- **Body** (default): `font-size: 0.875rem` (14px), `font-weight: 400`, `line-height: 1.5`
- **Body Small**: `font-size: 0.75rem` (12px), `font-weight: 400`, `line-height: 1.4`
- **Caption**: `font-size: 0.6875rem` (11px), `font-weight: 400`, `line-height: 1.3`

*Weight Guidelines*:
- Regular (400): Body text, descriptions
- Medium (500): Subtle emphasis, nav items
- Semibold (600): Subheadings, card titles
- Bold (700): Primary headings, key data points

**Radius & Shapes**:

*Border Radius Scale*:
- `--radius-sm`: `0.375rem` (6px) - small tags, badges
- `--radius-md`: `0.5rem` (8px) - buttons, inputs
- `--radius-lg`: `0.75rem` (12px) - standard cards
- `--radius-xl`: `1rem` (16px) - prominent cards, modals
- `--radius-2xl`: `1.25rem` (20px) - film roll cards (current style)
- `--radius-full`: `9999px` - pills, rounded buttons

*Shape Philosophy*:
- Generous rounded corners (12px+) create approachable, tactile feel
- Consistent radius within component families (all cards use same radius)
- Larger elements can use larger radius for visual hierarchy
- Avoid mixing radii within single components

**Shadows** (soft, diffused):

*Elevation Scale*:
- `--shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` - subtle lift, input focus
- `--shadow-base`: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` - resting cards
- `--shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` - hover state, dropdowns
- `--shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` - modals, popovers
- `--shadow-xl`: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` - dragging cards

*Shadow Philosophy*:
- Soft, natural shadows (low opacity blacks, never harsh)
- Use shadows to communicate interactivity (elevation on hover)
- Dragging state gets strongest shadow for depth
- Avoid shadows on shadows (no stacking modals with heavy shadows)

**Texture Overlay**:

*Contextual Grain Application*:
- **Film roll cards**: Subtle grain overlay (2-3% opacity) via CSS pseudo-element
- **Modals & large panels**: Light grain (2% opacity) for depth
- **Background**: Clean, no texture - let content breathe
- **Buttons on hover**: Optional very light grain (1-2% opacity) for tactility

*Implementation*:
```css
/* Grain texture pseudo-element */
.texture-grain::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  border-radius: inherit;
  mix-blend-mode: multiply;
}
```

*Philosophy*:
- Texture should enhance, never distract
- Apply strategically to tactile interactive elements
- Background stays clean for professional clarity

### 3) Component Guidelines

**Buttons**:

*Primary Button*:
- Background: C41 Orange (#F0732A)
- Text: White, font-weight: 600
- Padding: `0.75rem 1.5rem` (12px 24px)
- Border-radius: `--radius-md` (8px)
- Hover: Darken to #D96520, subtle scale (1.02), slight shadow lift
- Active: Scale down (0.98)
- Min-height: 44px (touch-friendly)
- Transition: all 200ms ease

*Secondary Button*:
- Background: Transparent
- Border: 2px solid #D9D9D9
- Text: Charcoal (#2D2D2D), font-weight: 500
- Same padding/radius as primary
- Hover: Background to #F8F7F5, border to C41 Orange
- Active: Background to #EFEEEC

*Ghost/Text Button*:
- Background: Transparent, no border
- Text: C41 Orange, font-weight: 500
- Padding: `0.5rem 1rem`
- Hover: Background to orange-light (#FFF4ED)

*Icon Buttons*:
- Min size: 44x44px (touch-friendly)
- Padding: 10px
- Border-radius: `--radius-md` or `--radius-full` for circular
- Hover: Background to #EFEEEC

*Button Philosophy*:
- Clear visual hierarchy (primary stands out)
- All interactive states have smooth transitions
- Touch-friendly sizing (44px minimum)
- Icon-only buttons must have aria-labels

**Cards**:

*Standard Card*:
- Background: White (#FFFFFF) on base background
- Border: 1px solid #E5E5E5
- Border-radius: `--radius-xl` (16px)
- Padding: `1.5rem` (24px)
- Shadow: `--shadow-base` at rest
- Hover: Shadow lifts to `--shadow-md`, border subtle highlight

*Film Roll Card* (Interactive/Draggable):
- Background: White (#FFFFFF)
- Border: 1px solid #D9D9D9
- Border-radius: `--radius-2xl` (20px)
- Padding: `0.5rem` (8px) - compact for density
- Shadow: `--shadow-base` at rest
- Texture: Subtle grain overlay (2-3% opacity) via pseudo-element
- Hover: Border to Cyan (#06B6D4), shadow to `--shadow-md`, cursor: grab
- Dragging: Shadow to `--shadow-xl`, opacity: 0.5, cursor: grabbing
- Transition: all 200ms ease-in-out

*Stat Card*:
- Background: Color-coded light backgrounds (orange-light, cyan-light, purple-light)
- Border: 2px solid corresponding accent color (25% opacity)
- Border-radius: `--radius-xl` (16px)
- Padding: `1.5rem` (24px)
- Hover: Slight shadow lift, border full opacity

*Card Philosophy*:
- Draggable cards have stronger visual affordance (thicker borders, rounded corners)
- Texture overlay reinforces tactility on interactive cards
- Generous padding creates breathing room
- Hover states communicate interactivity clearly

**Inputs & Forms**:

*Text Input / Textarea / Select*:
- Background: White (#FFFFFF)
- Border: 1.5px solid #D9D9D9
- Border-radius: `--radius-md` (8px)
- Padding: `0.625rem 0.875rem` (10px 14px)
- Text: Charcoal (#2D2D2D), font-size: 14px
- Placeholder: #8B8680 (tertiary text)
- Min-height: 44px (touch-friendly)
- Focus: Border to C41 Orange, shadow: 0 0 0 3px #FFF4ED (orange-light ring)
- Error: Border to Red (#DC2626), shadow: error ring
- Transition: border 150ms, shadow 150ms

*Labels*:
- Font-size: 14px, font-weight: 500
- Color: #2D2D2D (primary text)
- Margin-bottom: 6px
- Required indicator: Orange asterisk

*Checkbox / Radio*:
- Size: 20x20px (touch-friendly)
- Border: 2px solid #D9D9D9
- Border-radius: 4px (checkbox) / 50% (radio)
- Checked: Background C41 Orange, white checkmark
- Focus: Orange ring (3px)

*Form Groups*:
- Vertical spacing between fields: 1rem (16px)
- Group related fields with subtle background (#F8F7F5) and padding

*Form Philosophy*:
- Clear focus states with color-coded rings
- Consistent 44px minimum height for accessibility
- Labels always visible (no floating labels)
- Error states are obvious but not alarming

**Data Display**:

*Tables*:
- Header: Background #F8F7F5, text: Charcoal, font-weight: 600, padding: 12px
- Row: Background white, border-bottom: 1px solid #E5E5E5, padding: 12px
- Row hover: Background #F8F7F5
- Zebra striping: Optional alternate rows with #FAFAFA
- Border-radius on table container: `--radius-lg` (12px)

*Badges / Tags*:
- Small tags: Background #EFEEEC, text: #2D2D2D, padding: 4px 8px
- Border-radius: `--radius-sm` (6px)
- Font-size: 11px, font-weight: 500
- Color-coded variants: Use light accent backgrounds (orange-light, cyan-light, purple-light)
- Icon tags: Include 12px icon with 4px gap

*Rating Stars*:
- Size: 16px
- Filled: #F59E0B (amber/gold)
- Empty: #E5E5E5 (silver)
- Interactive hover: Scale 1.1, fill color preview

*Metadata / Captions*:
- Font-size: 12px
- Color: #6B6660 (secondary text)
- Icon + text: 12px icon with 4px gap
- Use bullet separators (•) for inline metadata lists

*Thumbnails & Images*:
- Border-radius: `--radius-md` (8px) minimum
- Images should have aspect-ratio hints to prevent layout shift
- Film stock images: Maintain packaging design, consider drop shadow for depth

*Philosophy*:
- Info-dense displays use clear hierarchy and generous spacing
- Color coding enhances scannability (but never as sole indicator)
- Icons paired with text for clarity
- Hover states on interactive data elements

### 4) Constraints
- **Do not modify** `frontend/src/components/stats/cards/FilmStockGalleryCard.jsx`

## Implementation Plan

We will evolve the global design system by:
0. Creating a design system test page that features all components across the site.
1. Centralizing design tokens (CSS variables / Tailwind extensions)
2. Adding global base styles (fonts, background, texture overlay)
3. Creating reusable utility classes for buttons, cards, and inputs

### Route
`/design-system` (Temporary route for development/testing)
