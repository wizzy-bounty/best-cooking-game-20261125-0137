# SATE BARA — Night Market Grill

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/wizzy-bounty/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/wizzy-bounty/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A night-market sate grill game for the make.fun **best-cooking-game-20261125-0137** bounty.
You are the grill master at a night-market stall: orders come in on the board,
you grab raw skewers from the ingredient counter, grill them over glowing
charcoal, flip them for an even cook, add sauce, and serve before the
customers walk away. Rush hour hits in the last minute.

## How to play

Serve the game locally and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

- **Click / 1-4** — pick up a skewer (chicken, beef, goat, tofu)
- **Click a grill slot** — place the skewer; click a skewer on the grill to flip it, click again to take it off
- **Click / Q/W/E** — pick up a sauce (peanut, sweet soy, chili), then click the plate
- **Click SERVE / Space** — serve the plate when it matches an order
- **P** — pause, **M** — mute, **Enter** — start / next day, **Esc** — cancel / title

A skewer is perfect when it is flipped and taken off in the green zone of its
doneness meter; perfect plates earn tips, and serving in a row builds a combo.
Burnt skewers go in the trash, expired orders cost a heart. Three hearts and
the shift ends.

## Files

- `game/` — the playable game as static files (no network, no build step)
- `game/src/` — one file per job: `state.js` (rules), `render.js` (drawing),
  `input.js` (mouse/keyboard), `shots.js` (screenshot scenes), `audio.js`
  (synthesised sounds), `data.js` (menu), `rng.js` (seeded random)
- `screenshots/` — four real renders of the game
- `main.ts` — the hand-in program that copies the game and writes the dossier
