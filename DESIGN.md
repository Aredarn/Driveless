---
name: Driveless
description: A rally co-driver's road book, drawn as chinagraph on waterproof stock, paired with a printed driving plate.
colors:
  ink: "#171a1a"
  ink-soft: "#464a4a"
  ink-faint: "#5b6060"
  rule: "#a9afaf"
  stock: "#dde0df"
  stock-shade: "#ced3d3"
  signal-red: "#b52f26"
  signal-red-bright: "#c9382d"
  road-tab: "#2a567f"
  track-tab: "#215941"
  rally-tab: "#8d5417"
  plate-ground: "#bfc4c3"
  plate-surface: "#e7eae9"
  plate-surface-loose: "#d4d8d7"
typography:
  display:
    fontFamily: "Archivo Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 7.5vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "Archivo Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Archivo Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Archivo Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    letterSpacing: "0.02em"
  label:
    fontFamily: "Archivo Narrow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.14em"
spacing:
  step: "0.5rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  tab-stage-select:
    backgroundColor: "{colors.road-tab}"
    textColor: "{colors.stock}"
    typography: "{typography.title}"
    padding: "0.75rem 1rem"
  note-row:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "1rem 0"
  damage-mark:
    backgroundColor: "{colors.signal-red}"
    width: "20px"
    height: "22px"
  distance-readout:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
---

# Design System: Driveless

## Overview

**Creative North Star: "The Rally Road Book"**

Driveless is a co-driver's road book bound next to a printed driving plate, not a HUD floating over a game world. The book is chinagraph on waterproof stock: near-black ink, cool stock white, ruled form lines, a spiral binding drawn as punched holes and ink rings down the reading edge. The plate is the same page seen as the terrain itself — crop marks at its corners, a chainage ruler down its right edge, hatched fields and contour strokes screened the way a printed stage map would carry them. Both surfaces share one paper tooth (a generated grain), one ink, and one hand.

The world refuses the arcade shell entirely: no cabinet chrome, no sprite grammar, no CRT scan, no glow. Numerals are tabular and measured. The only warm mark in an otherwise cool, near-monochrome system is signal red, spent on severity, damage, the car, and the chainage's own corner ticks — never spent decoratively. Nothing else competes for that register.

**Key Characteristics:**
- Chinagraph-on-stock palette: near-black ink, cool grey-green stock, one signal red.
- Self-hosted Archivo Narrow at three weights, tabular numerals used throughout for anything that counts.
- No border-radius, no box-shadow-driven elevation; form comes from clip-path dog-ears, drawn spiral binding, and ruled hairlines.
- Two independently generated paper-grain textures (SVG turbulence on the book, canvas noise on the plate) standing in for one shared stock.
- Three stage tints (road/track/rally) carried as tab-card colour, stage chip, and reading accent.

## Colors

A near-monochrome ink-and-stock system with three muted stage tints and one warm accent held in reserve.

### Primary
- **Signal Red** (`#b52f26`): the system's one warm mark. Used for the severity numeral inside a corner code, the damage slashes, the car on the plate, the corner ticks and severity labels on the chainage ruler, and the alternating kerb stripe on Track. A brighter variant (`#c9382d`) exists in tokens but is not distinctly used in the shipped build — treat `#b52f26` as canonical until a live-state use is confirmed.

### Secondary — Stage Tints
- **Road Tab** (`#2a567f`, cool blue): tab-divider colour and stage-chip fill for the Road stage.
- **Track Tab** (`#215941`, muted green): tab-divider colour and stage-chip fill for Track.
- **Rally Tab** (`#8d5417`, muted ochre): tab-divider colour and stage-chip fill for Rally.
- **Single source:** the custom properties above are the only place these values live. `src/game/stages.ts` names the role (`tint: 'var(--road)'`) rather than repeating the colour, so the stage chip in the book head and the tab card it belongs to cannot drift apart.

### Neutral
- **Ink** (`#171a1a`): primary text, rules, canvas linework, car outline.
- **Ink Soft** (`#464a4a`): secondary text — unit labels, stage name, distance-remaining figures.
- **Ink Faint** (`#5b6060`): tertiary text — the severity legend.
- **Rule** (`#a9afaf`): hairline dividers between book rows and the book's top/bottom rules.
- **Stock** (`#dde0df`): the page itself — body background, book and divider background, tab text colour.
- **Stock Shade** (`#ced3d3`): the spiral-binding gutter shading.
- **Plate Ground** (`#bfc4c3`): the canvas backdrop outside the road surface, one step darker than stock.
- **Plate Surface** (`#e7eae9`) / **Plate Surface, Loose** (`#d4d8d7`): sealed road fill and gravel-stage road fill respectively.

### Named Rules
**The One Warm Mark Rule.** Signal red is the only hue in the system carrying no other role than itself: severity, damage, the car, and the chainage's corner ticks. It never appears as decoration, a hover state, or a stage tint.

**The Two Stocks Rule.** The book (DOM) and the plate (canvas) are one page seen twice. Both must carry the same paper grain, the same ink, and the same stock white — but they are drawn by two independent renderers (an inline SVG feTurbulence tile for the book, a per-pixel canvas noise tile for the plate) and are not literally the same asset. Keep them visually in register; do not unify them into a single texture without re-verifying both surfaces.

## Typography

**Display / Body / Label Font:** Archivo Narrow (self-hosted via @fontsource, weights 400/600/700), falling back to `ui-sans-serif, system-ui, sans-serif`.

**Character:** A single condensed grotesque carries every role, weighted by hierarchy rather than by a second family. Every numeral that measures something — distance, severity, chainage metres, personal best — is tabular, so figures don't jitter as they update.

### Hierarchy
- **Display** (700, `clamp(3.25rem, 7.5vw, 5rem)`, line-height 0.9, tabular-nums): the distance-travelled readout at the book's head. The system's single largest mark.
- **Headline** (700, `clamp(1.75rem, 3.4vw, 2.5rem)`, tabular-nums): the corner code (direction + severity numeral) on each book row.
- **Title** (700, 1.5rem): the stage-tab name on the divider screen (Road / Track / Rally).
- **Body-strong** (700, `clamp(1.5rem, 3vw, 2.25rem)`): the live call overlaid on the plate as the car approaches a corner.
- **Label** (600, 0.75–0.875rem, letter-spacing 0.1–0.14em, uppercase): stage name, caution words (e.g. JUNCTION), the severity legend, and the steering hint. This is the system's only uppercase register.

### Named Rules
**The Tabular Rule.** Any numeral that represents a live count — distance, severity, metres-to-corner, personal best, chainage — is set with `font-variant-numeric: tabular-nums`. Numerals that describe rather than count (none currently) are exempt.

## Layout

The screen is a two-up spread: a fixed-proportion book column (`clamp(252px, 30vw, 440px)`) beside a plate that fills the remaining space, `display: grid` over `100dvh`. The plate bleeds to the viewport edge; the book does not.

Internal rhythm runs off one step unit, `--step: 0.5rem`, multiplied (1.25×, 1.5×, 2×, 2.5×, 3×, 4×) rather than drawn from a second scale — book padding, row gaps, and header spacing are all named as multiples of this one step.

**Responsive break:** at `max-aspect-ratio: 19/20` (portrait), the spread collapses to a single column stacked vertically. The book turns sideways into a top strip: its corner list becomes a horizontal scroll of tulip cards, the spiral binding moves from the book's inner (right) edge to its bottom edge, and the footer (hint + legend) is dropped entirely to keep the plate the dominant surface. The header regroups into a two-column grid (`stage/damage/best` stacked left, the distance readout right-aligned) rather than a vertical stack.

## Elevation & Depth

The system is flat by convention, with one narrow, deliberate exception. No `box-shadow` is used for surface elevation anywhere in the CSS; the only shadow-like device is an inset ring (`box-shadow: inset 0 0 0 1px rgb(26 27 24 / 0.45)`) that gives the stage-tint chip a printed-ink edge, not a lift. Depth is otherwise conveyed by the paper grain and by z-index layering of flat planes (book over dividers over plate), not by shadow.

On the canvas plate, the car alone casts a soft drop shadow (`shadowBlur: 0.9`, small `shadowOffsetY`) to ground it against the flat printed ground plane — a single structural exception, not a general elevation system, and it is not extended to traffic or any other mark.

### Named Rules
**The Flat Page Rule.** Nothing on the page lifts, glows, or casts a shadow to indicate interactivity. The only shadow in the system grounds the car against the ground plane; hover and focus states move (`translateX`/`translateY`) or change colour, they never elevate.

## Shapes

No `border-radius` is used anywhere in the shipped CSS; every corner is either square or intentionally cut. Two recurring cut forms carry the system's whole form language:

- **The dog-ear tab.** Stage-divider buttons are cut with `clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)` (landscape) / a matching bottom cut in portrait — a torn-page corner, not a rounded chip.
- **The chinagraph slash.** Damage marks are a `clip-path: polygon(74% 0, 100% 0, 26% 100%, 0 100%)` parallelogram rotated slightly on landing (`rotate(-3deg)`), reading as a hand-struck tally mark rather than an icon.

On the canvas plate, the car and traffic vehicles use a small rounded rectangle (`roundRect`, radius ≈0.5 world-units, a few px on screen) — the one soft corner in the system, reserved for physical objects on the road, never for UI chrome.

## Components

### Tabs (stage dividers)
- **Shape:** dog-ear clip-path (`polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)`), no radius.
- **Colour assignment:** background is the stage tint (`--road`/`--track`/`--rally`), text is stock white; the tab name is 1.5rem/700, the gloss line is 0.8125rem/400 in a slightly warmer stock (`#e8eae9`).
- **Hover / Focus:** `translateX(6px)` in landscape, `translateY(-5px)` in portrait, on `--write` timing (420ms, `cubic-bezier(0.16, 1, 0.3, 1)`); no colour or shadow change. Respects `prefers-reduced-motion` (transition removed).

### Note Row (book list item)
- **Shape:** no radius, no border on the row itself; separated by 1px hairlines (`--rule`) between rows, ruled top/bottom on the list.
- **Content:** a tulip junction diagram (inline SVG, stroke = `currentColor`), a corner code (direction letter + severity numeral in red), an optional uppercase caution label, and a right-aligned distance-to-corner figure that turns full-ink (from ink-soft) and reads "NOW" under 12m when it's the next corner.
- **State:** newly-arrived rows below the first fill animate in with a stroke-draw on the tulip and a small horizontal "scratch" on the text (260ms), as if just written by hand — not a generic fade/slide.

### Damage Marks
- **Style:** five (MAX_HITS) red chinagraph-slash marks in a row, each hidden (`opacity: 0`, `scaleY(0.4)`) until struck, then snapping to `opacity: 0.92`, `scaleY(1) rotate(-3deg)` on the `--write` easing.

### Distance Readout
- **Style:** the book's largest mark — 700 weight, tabular numerals, a small uppercase unit suffix ("km") set at 0.24em of the parent size in ink-soft.

### Chainage Ruler (signature component, canvas)
The plate's right-edge ruler is the book's distance column continued onto the drawn page: a vertical axis with tick marks every 50m (major every 250m, labelled), a filled red wedge marking the car's own position, and red tick-plus-code marks for each upcoming corner drawn at the exact distance it will arrive — so the same fact (what's coming, how far) is legible in both the book and the plate, in the same red.

### Plate Call Overlay
- **Style:** a floating caption (no card, no background) positioned at the plate's top-left inset, appearing only within ~2.6 seconds of the next corner; the severity numeral is set in red, the caution or run-length in a smaller uppercase ink-soft line beneath.

## Do's and Don'ts

### Do:
- **Do** keep signal red (`#b52f26`) reserved for severity, damage, the car, and chainage corner marks; treat any new red use as a system violation until confirmed.
- **Do** set every counting numeral (distance, severity, metres, chainage) in tabular figures.
- **Do** cut corners with `clip-path` (dog-ear, slash) rather than rounding them; reserve the one soft radius (`roundRect`) for physical objects drawn on the canvas road, not for UI chrome.
- **Do** carry the paper grain on any new full-bleed surface so it reads as the same stock as the book and plate.

### Don't:
- **Don't** add `box-shadow`-driven elevation, glow, or lift as a hover/active affordance; the system's only shadow grounds the car against the ground plane.
- **Don't** introduce a second accent hue. The palette is ink, stock, three muted stage tints, and one warm red; a new colour dilutes the "one signal" rule the whole book depends on.
- **Don't** write a stage colour as a literal into `src/game/stages.ts` or any other module. Stage data names the custom property; the stylesheet owns the value. A second literal for the same role is how the chip and its tab drifted apart once already.
