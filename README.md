# SIZZLE RUSH — Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/wizzy-bounty/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/wizzy-bounty/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Top-down 2D cooking rush game for the make.fun **best-cooking-game-20261125-0137** bounty.
You are Chef Sari in a small warung kitchen: take tickets off the order board,
fetch ingredients, chop, grill, assemble and serve dishes against a 150-second
shift timer while orders pile up.

## How to play

Serve the game locally and open it in a desktop browser:

```sh
node serve.ts
# http://localhost:8080
```

| Key | Action |
| --- | --- |
| WASD / arrow keys | Walk around the kitchen |
| E / Space | Interact with the nearest station |
| Click a station | Walk there and interact on arrival |
| Click the floor | Walk there |
| Q | Cycle the pantry ingredient |
| P | Pause |
| M | Mute |

**The loop:** PANTRY gives a raw ingredient → TALENAN chops lettuce/tomato
(hold E, 1.2s) → GRILL cooks a patty (4s, then a 3s ready window before it
burns) → ASSEMBLY builds the dish on a plate → SERVE PASS delivers it to the
matching ticket. A fast serve earns a tip; consecutive serves build a combo
that multiplies the tip. A missed ticket costs a heart — lose all three and
the shift ends early. At 60 seconds left, RUSH HOUR hits and orders come
1.5× faster.

**Recipes:** Salad Segar (120) • Burger Klasik (220) • Burger Keju (300) •
Tumpuk Sari (340). Finish a shift to unlock the next, faster day.

## Files

- `game/index.html` — canvas + status line, loads the game as ES modules.
- `game/src/config.js` — canvas, stations, ingredients, recipes, palette.
- `game/src/random.js` — seeded RNG (mulberry32) for deterministic shots.
- `game/src/input.js` — keyboard + mouse state, click-to-walk targets.
- `game/src/world.js` — all rules: orders, grill, chopping, plating, serving.
- `game/src/render.js` — all canvas drawing: kitchen, chef, tickets, screens.
- `game/src/audio.js` — WebAudio synth effects (no sound files).
- `game/src/shots.js` — staged scenes for `?shot=start|play|rush|end&seed=1`.
- `game/src/main.js` — boot, game loop, staging hook.
- `main.ts` — hand-in program: copies `game/` + `screenshots/` and writes `dossier.json`.
- `serve.ts` — tiny static server for local playtesting.

All art is drawn in code and all sounds are synthesised — no network requests,
no external assets. Original names, art, recipes and dialogue.

## License

MIT — see [LICENSE](LICENSE).
