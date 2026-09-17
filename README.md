# Driveless

Topdown racing game with endlessly generated track.

The road is written a few hundred metres ahead of the car and never repeats,
and it is written in the same pass as the co-driver's pace notes — so the road
book down the left of the screen can never call a corner the road does not
have. Every corner is clamped to a share of the adhesion limit at the speed
the car will be carrying when it arrives; what escalates with distance is how
close to that limit the road is written, not absolute curvature.

Steering is the only control. The throttle is the distance ramp.

- **Keyboard** — `←` `→` or `A` `D`. `1` `2` `3` open a stage.
- **Touch** — either side of the plate.

Three stages: **road** (traffic, two ways, good tarmac), **track** (closed
circuit, kerbs, no traffic), **rally** (loose surface, narrow, staked edges).
Pick one on the first run; after that a crash puts you straight back on the
same stage.

## Running it

```sh
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # static output in dist/
npm run typecheck
```

No game engine — TypeScript and Canvas 2D, built with Vite.

## Layout

| Path | What lives there |
| --- | --- |
| `src/game/generator.ts` | Writes road and notation together. The product's central claim. |
| `src/game/notes.ts` | The notation itself — the generator's public interface. |
| `src/game/car.ts` | Car physics in the road's own frame, and damage. |
| `src/game/tuning.ts` | Every balance number, in one place. |
| `src/render/plate.ts` | The driving plate, drawn as a printed page. |
| `src/render/tulip.ts` | Tulip junction diagrams, generated from a note. |
| `src/ui/book.ts` | The road book. Real text, and the accessible reading of the run. |

## Open decisions

The constants marked `OPEN` in `src/game/tuning.ts` are product decisions that
have not been made yet — the damage hit count among them. They are placeholders
chosen to be playable, not answers. Also undecided and deliberately not built:
seeding and run sharing, whether a personal best survives a reload (it is
session-memory only today), audio, whether traffic appears on the track and
rally stages, and the numeric grip model separating them (the `mu` and
`traffic` fields in `src/game/stages.ts`, marked OPEN there).

Product truth lives in [PRODUCT.md](PRODUCT.md); the design direction for the
game screen is recorded in `.impeccable/surfaces/index-html.md`.
