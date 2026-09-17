---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/main.ts"]
---

Scope: the Driveless game screen — first-run stage pick, the run, the run-end. Visitor mode: Experience. One mode (distance), three stage types, one build for keyboard and thumb.

Audience and job: a player with five minutes in a browser tab, desktop keyboard or phone in one hand, steering to beat their last distance. Action: steer, survive, retry. Proof: the road is generated ahead of the car and stays passable at the speed already reached.

Constraints: TypeScript + Vite, Canvas 2D, no engine, static output. Frame budget holds on a mobile GPU. Steering-only input.

## Direction contract

THESIS: The co-driver reads the road before the driver sees it, and that is exactly what this generator does. The road book is half the screen, not an overlay on it. Refuses the arcade shell: no cabinet, no sprite grammar, no CRT, and no HUD floating over a game world.

OWN-WORLD: A rally co-driver's road book. Chinagraph on waterproof stock — near-black ink, cool stock white, one signal red carrying corner severity and damage. Tab-divider colours separate road, track and rally. Tulip junction diagrams, 1–6 severity numerals, a distance-to-next column, spiral binding, ruled page furniture. Numerals are tabular and measured; nothing glows.

STORY: The player understands within one corner that the notation predicts the road. They believe the road is being written, not replayed. They steer, crash, and are driving again before deciding to.

FIRST VIEWPORT: Landscape — road book column on the left third, driving plate filling the right two-thirds, plate bled to the edges. The column stacks the next three corners: tulip, severity numeral, distance ticking down. Spiral binding runs the column's inner edge. Distance travelled sits at the column head in tabular numerals; damage reads as chinagraph slashes accruing across the page. Portrait — the plate fills the screen and the book turns sideways into a top strip of the same three tulips. First run opens on the tab dividers; every run after starts driving.

FORM: Rally road-book, first on the ordered grounded list and pinned by the user over the roll's assignment (road-atlas cartography). Seed key ed35cf47, direction scope, experience mode, degraded round — the roll service was unreachable, so no challengers and no quality-bar boards were dealt.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction

The call: each corner is written into the book one beat before the car reaches it, in the book's own hand, and the road arrives to match. Generated with the terrain in one pass, never faked from geometry after the fact.

## Unresolved decisions

Damage hit count; seeding and determinism; whether a personal best survives a reload; audio; the numeric grip model separating rally from road; whether traffic appears in track and rally stages; deploy target. A builder must not invent these.
