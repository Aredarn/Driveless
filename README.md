# Driveless

Topdown racing game with endlessly generated track.

The road is written a few hundred metres ahead of the car and never repeats,
and it is written in the same pass as the co-driver's pace notes — so the road
book down the left of the screen can never call a corner the road does not
have. Every corner is clamped to a share of the adhesion limit at the speed
the car will be carrying when it arrives; what escalates with distance is how
close to that limit the road is written, not absolute curvature.

Two controls: steer, and the handbrake. The throttle belongs to the road —
the car reads what is coming and sheds speed for what it cannot hold, so a
hairpin is a hairpin however fast the run has become.

- **Keyboard** — `←` `→` or `A` `D` to steer, `↓` / `S` / `space` for the
  handbrake. `1` `2` `3` open a stage.
- **Touch** — either side of the plate to steer, the band across its foot for
  the handbrake.

Pull the handbrake and the car's heading comes away from the direction it is
actually travelling. Grip normally drags that slip angle back to a couple of
degrees; the handbrake cuts the link, so the back steps out, the car scrubs
speed, and letting go snaps the velocity round to meet the heading. It will
never turn the car faster than the surface allows — the velocity turn is
capped at the adhesion limit — so a slide is a way to rotate the car into a
corner, not a way to cheat one.

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
| `src/game/car.ts` | Car physics in the road's own frame: heading, travel, slip, damage. |
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
rally stages, and the numeric handling model separating them (the `mu`,
`looseness` and `traffic` fields in `src/game/stages.ts`, marked OPEN there).

Product truth lives in [PRODUCT.md](PRODUCT.md); the design direction for the
game screen is recorded in `.impeccable/surfaces/index-html.md`.
