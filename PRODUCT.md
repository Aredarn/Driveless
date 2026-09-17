# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript + Vite, rendering to Canvas 2D. No game engine dependency. Chosen by the user over vanilla-JS-no-build and Phaser 3: typed vector and physics math for the track generator, HMR during development, and a plain static build output. Deploy target is undecided; the static output does not constrain it.

## Users

Two contexts, served by one build:

- **Desktop browser, keyboard.** Someone at a computer taking a short break. Precise steering, larger viewport, reads more of the track ahead.
- **Mobile browser, touch, one-handed.** Portrait, thumb steering, weaker GPU, tighter camera.

The job in both: start instantly, survive further than the last run, retry immediately. Neither context is the secondary one — an input or layout decision that only works on one of them is incomplete.

## Product Purpose

A topdown racing game whose track is generated endlessly as you drive it. The run ends when the player crashes out; the score is distance travelled. Success is the immediate retry — a run that ends should leave the player starting another one without a decision in between.

## Positioning

The track is not an authored level, a shuffled set of pieces, or a loop. It is generated ahead of the car continuously and never repeats, and the generator carries a hard obligation: whatever it produces must remain passable at the speed the player has already reached. Difficulty rises because the car is faster, not because the track cheats.

## Operating Context

Played in a browser with no install and no account. Sessions are short and repeated — a run is measured in seconds to minutes, and the retry cost must stay near zero. Desktop plays on keyboard; mobile plays portrait and one-handed. Undecided: deploy target and whether runs are playable offline.

## Capabilities and Constraints

Confirmed:

- Endless procedural track generation, driven ahead of the car, never repeating.
- Distance-based scoring for a single run.
- Adaptive input from one build: keyboard on desktop, touch on mobile.
- Canvas 2D rendering under a frame budget that must hold on mobile GPUs, not just desktop.

Explicitly undecided, to be settled when the first surface is built — do not treat any of these as answered:

- Seeding and determinism. The chosen loop does not require a replayable track, so run sharing and "same seed" replay are not commitments.
- Score persistence — whether a personal best survives a page reload, and where it is stored.
- Audio, including whether the game ships any.
- Collision model and what "crashing out" means mechanically (leaving the track surface, hitting an obstacle, or both).
- Whether anything beyond the car and the track exists — traffic, hazards, pickups, biomes.

## Brand Commitments

The name is **Driveless**. The project is licensed Apache-2.0 (`LICENSE`, committed). No voice, identity, or reference has been made binding yet.

## Evidence on Hand

None. The repository contains `README.md` (one line: "Topdown racing game with endlessly generated track."), `LICENSE`, and the installed Impeccable skill files — no code, no art, no audio, no fonts, no copy, no screenshots, no prior build. Future work must not cite play data, player counts, reviews, benchmarks, or comparisons to other games: none exist.

## Product Principles

1. **The retry is the product.** Anything between a run ending and the next run starting is a defect, including menus, confirmations, and load time.
2. **The generator owes the player a passable track.** Fairness is the generator's obligation, not the player's problem. A track that is unsurvivable at the speed it hands you is a bug, not difficulty.
3. **Speed is the difficulty curve.** Escalation comes from the car getting faster, not from the generator withholding a viable line.
4. **One build, two hands.** Every control and layout decision ships working on both keyboard and thumb, or it is not done.
5. **Legibility at speed outranks detail.** The player must read the track ahead at the speed they are travelling; anything competing with that reading is cut.
