---
name: deplayer
description: A local-first music player for focused listening and personal library control.
colors:
  primary-sky: "#0ea5e9"
  primary-light: "#0284c7"
  secondary-amber: "#eab308"
  accent-slate: "#cbd5e0"
  dark-canvas: "#101b26"
  dark-surface: "#1e293b"
  dark-elevated: "#334155"
  dark-content: "#bae6fd"
  light-canvas: "#ffffff"
  light-surface: "#f1f5f9"
  light-content: "#0f172a"
  teenage-orange: "#ff5b00"
  cassette-cyan: "#00e5ff"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-sky}"
    textColor: "{colors.dark-canvas}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1rem"
  menu-surface:
    backgroundColor: "{colors.dark-elevated}"
    textColor: "{colors.dark-content}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  visualizer-panel:
    backgroundColor: "{colors.dark-surface}"
    rounded: "{rounded.md}"
    width: "min(480px, calc(100vw - 24px))"
    aspectRatio: "16 / 9"
---

# Design System: deplayer

## Overview

**Creative North Star: "The Dark Listening Room"**

Deplayer is a calm, atmospheric workspace for people listening to and managing a personal music library. The interface gives content and playback priority: surfaces are dark and quiet, cool blue accents make state legible, and visualizer motion remains optional rather than competing with the library.

The product is intentionally themeable. Semantic DaisyUI roles carry the interface across the default dark theme, light theme, and expressive theme presets such as Teenage Engineering and Cassette Futurism. Theme changes may alter hue, contrast, corner treatment, and control character, but controls must remain recognizable and usable. Copy is quietly confident: direct, practical, and music-first.

**Key Characteristics:**
- Dark listening-room atmosphere with theme-owned surfaces.
- Local-first, provider-agnostic utility for personal libraries.
- Cool blue information hierarchy with theme-specific signal accents.
- Subtle functional transitions; ambient visualizer motion is opt-in.
- Composable Tailwind and DaisyUI primitives with narrow feature CSS.

## Colors

Color is semantic and theme-owned. The default `deplayer` theme uses a deep navy canvas, slate surfaces, sky-blue actions, and amber attention states; light and expressive themes remap the same roles.

### Primary
- **Listening Sky** (`#0ea5e9`): Primary actions, links, active controls, and the selected ambient visualizer state in the default dark theme.
- **Clear Sky** (`#0284c7`): The brighter light-theme primary used against pale surfaces.

### Secondary
- **Signal Amber** (`#eab308`): Attention, secondary emphasis, and the default warm counterpoint to the blue primary.

### Tertiary
- **Theme Accent** (`#cbd5e0`): Neutral accent in the default dark theme; expressive themes replace it with their own semantic accent.

### Neutral
- **Deep Canvas** (`#101b26`): Default dark page and player canvas.
- **Slate Surface** (`#1e293b`): Default dark content and card surface.
- **Elevated Slate** (`#334155`): Menus, elevated controls, and dark theme layers.
- **Ice Content** (`#bae6fd`): Default dark-theme text and readable secondary content.
- **Light Canvas** (`#ffffff`): Light-theme page canvas.
- **Light Surface** (`#f1f5f9`): Light-theme content surface.
- **Ink Content** (`#0f172a`): Light-theme text.

### Named Rules
**The Semantic Theme Rule.** Use DaisyUI semantic roles (`primary`, `secondary`, `accent`, `base-*`, and status roles) instead of hardcoding a theme-specific color in a shared component.

**The Signal Rule.** Accent colors communicate state or action; do not turn every surface into a colored panel.

## Typography

**Display Font:** No separate display face; use the system sans stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`).
**Body Font:** The same system sans stack.
**Label/Mono Font:** No distinct label or mono face is established.

**Character:** System typography keeps the product fast, familiar, and platform-native. Hierarchy comes from size, weight, color, and spacing rather than decorative lettering.

### Hierarchy
- **Display:** No dedicated display role is established; avoid introducing one for a single screen.
- **Headline:** System sans, theme-defined heading utilities; use for page and section titles.
- **Title:** System sans, medium-to-semibold weight; use for cards, media metadata, and player context.
- **Body:** 16px system sans; use for library copy, descriptions, and controls.
- **Label:** Small system sans text, typically 12px; use for badges, metadata, and compact state indicators.

### Named Rules
**The Native Voice Rule.** Keep the system stack unless a product-wide typography decision replaces it; do not add a novelty display font to make one feature feel special.

## Layout

The application uses a full-height shell with a sidebar, top bar, content region, optional right panel, and persistent player controls. Content fills the available width while `body` suppresses horizontal overflow. Shared layout behavior is expressed through Tailwind utilities; SCSS is reserved for shell geometry and feature-specific positioning.

The visualizer panel is a floating 16:9 card anchored above the player bar at the right of the viewport. Its desktop width is `min(480px, calc(100vw - 24px))`; the user can drag it by its header bar and it snaps to the nearest horizontal edge on desktop, or to the top/bottom of the viewport on mobile, keeping vertical position. The mobile composition is the same 16:9 card at `calc(100vw - 24px)` with balanced 12px side margins, and in landscape the width is capped so the 16:9 ratio survives the reduced `max-height`. Safe-area insets are added to the overlay offset on every anchored edge. Ambient mode is a full-viewport decorative layer; panel mode adds the focused card without changing the library layout.

Use the existing spacing rhythm: compact controls use 0.5rem to 0.75rem gaps, standard groups use 1rem, and distinct sections receive at least 1.5rem separation. Preserve touch-sized player controls and keep transient overlays clear of the player bar.

## Elevation & Depth

Elevation is theme-owned. DaisyUI surfaces, borders, and shadows define depth for each theme; components should not invent a second shadow language. The default dark theme uses tonal layering from `base-100` through `base-300`, with soft shadows for menus and the visualizer card. The visualizer's one-pixel blur is part of its atmospheric treatment, not a general-purpose surface effect.

### Shadow Vocabulary
- **Menu lift** (`shadow-lg`): Context menus and transient action surfaces.
- **Visualizer lift** (`shadow-xl`): The optional visualizer card above the player controls.
- **Player screen depth** (`0 0 10px rgba(0, 0, 0, 0.5)` in the default dark theme): The player display's theme token.

### Named Rules
**The Theme-Owned Depth Rule.** Use the active theme's surface, border, and shadow tokens before adding local elevation values.

## Shapes

The base DaisyUI themes use compact 0.25rem corners for boxes, buttons, and badges. The player uses a deliberate exception: primary player controls are circular (`9999px`). The visualizer panel uses a 0.5rem radius, a `base-300` border, and clipped overflow so the canvas stays inside its card. Expressive themes may use sharper corners as part of their semantic theme contract.

## Components

### Buttons
- **Shape:** Theme-defined button radius; player action buttons are circular (`9999px`).
- **Primary:** Use semantic `primary` or `accent` roles with compact utility padding and readable contrast.
- **Hover / Focus:** Use DaisyUI state utilities and preserve visible focus; do not remove the focus outline without an equivalent treatment.
- **Secondary / Ghost / Tertiary:** Transparent or tonal buttons inherit the active theme's `base-*` surfaces and content color.

### Chips
- **Style:** Small rounded badges with compact horizontal padding; use `base-300` for inactive state and semantic primary/accent tints for active state.
- **State:** The visualizer mode badge uses muted neutral for Off, primary for Ambient, and accent for Panel.

### Cards / Containers
- **Corner Style:** 0.25rem by default; visualizer card uses 0.5rem.
- **Background:** Semantic `base-100` through `base-300`, never a fixed dark value in shared components.
- **Shadow Strategy:** Use the active theme's established menu/card shadow vocabulary.
- **Border:** One-pixel semantic border where a surface needs separation.
- **Internal Padding:** Use the established 0.75rem to 1rem compact control rhythm.

### Inputs / Fields
- **Style:** DaisyUI input and toggle primitives; inherit theme surface, border, radius, and content roles.
- **Focus:** Retain the framework's visible focus state and semantic primary treatment.
- **Error / Disabled:** Use the existing semantic status roles and disabled opacity rather than custom color exceptions.

### Navigation
- **Style:** Sidebar and top bar establish the persistent shell; use theme surfaces and compact utility spacing.
- **States:** Active and hover states use semantic primary/`base-*` changes; keep navigation labels direct and localized.
- **Mobile:** Preserve the existing responsive shell and avoid allowing overlays to cover the player controls.

### Signature Component: Visualizer Modes
The visualizer is a three-state opt-in feature: Off, Ambient, and Panel. Ambient is a low-opacity, screen-blended full-viewport layer. Panel is a theme-owned 16:9 floating card above the player bar, repositionable by dragging its header bar (horizontal edge snap on desktop, vertical top/bottom snap on mobile). Both canvases are decorative to assistive technology, and Panel mode uses a reduced internal pixel ratio to keep the duplicate render loop bounded.

## Do's and Don'ts

### Do:
- **Do** use semantic DaisyUI roles so the same component works across all configured themes.
- **Do** keep player controls circular and compact while preserving clear focus and touch targets.
- **Do** keep optional visualizer motion subordinate to library content and provide a reduced-motion path.
- **Do** localize user-facing visualizer mode labels.
- **Do** use `calc(120px + env(safe-area-inset-bottom))` as the overlay offset above the player bar.
- **Do** prefer composable Tailwind/DaisyUI primitives and narrow SCSS for feature geometry.

### Don't:
- **Don't** hardcode default dark-theme colors into shared controls or cards.
- **Don't** let decorative canvas output become a screen-reader announcement.
- **Don't** use bounce or elastic easing as the default for product transitions.
- **Don't** place transient visualizer UI flush against narrow viewport edges or safe-area insets.
- **Don't** introduce a new visual language beside the configured theme system.
