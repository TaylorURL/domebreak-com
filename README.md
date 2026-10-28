<img src="build/icon.png" width="160" alt="DomeBreak" />

# DomeBreak

A real-time missile strategy game played on the real world map.

[domebreak.com](https://domebreak.com) · [Download](https://domebreak.com/#/download) · [Unit wiki](https://domebreak.com/#/wiki)

<img src="https://img.shields.io/badge/version-2026.44.2-e0574f?style=for-the-badge" alt="Version 2026.44.2" />

Pick a nation and run it in real time. Cover your cities with radar and interceptors, put silos, warships and jets in reach of your rivals, and keep the economy going while missiles are in the air. Play against up to eleven AI nations or online. Free, as a desktop app for macOS and Windows.

It's my own game, published under TaylorURL. The game, the match server and the website are all in this repo.

<img src="web/public/shots/command-map-1600w.webp" width="49%" alt="The command map at the start of a game" />
<img src="web/public/shots/battle-plan-1600w.webp" width="49%" alt="Planning a strike" />

## How it's built

- **The sim is pure and seeded.** `src/game/engine.js` builds a world from a match setup and the tick mutates it in place. The whole game state is plain JSON. Randomness comes from the world's seeded stream, so the same seed plays out the same way.
- **One engine, client and server.** `server/match` imports the same engine the client runs. The server is authoritative online: it ticks the world and streams snapshots, and the client overwrites its one world object in place so every ref into it stays valid.
- **Exact version match online.** Any skew between client and server risks the two sims diverging, so the server refuses a hello from a different build and the client shows "update required" (`src/net/version.js`).
- **Commands carry the sender's slot.** `server/match/commands.js` is a whitelist. Each command runs as the authenticated socket's nation, so a client can't act for another one.
- **Matchmaking is rows in Postgres.** The matchmaker groups waiting `matchmaking_queue` rows into a lobby, real players only, and flips it to `starting`. A server claims it with an update guarded on that status, so two servers racing for the same lobby can't both win.
- **Borders are a grid.** `scripts/gen-country-grid.mjs` rasterizes country polygons into a quarter-degree ownership grid. The sim and the AI read that, the same border the player is held to.
- **The map.** MapLibre over PMTiles, globe or flat. Black and white base, ownership painted on top.

<details>
<summary>Decisions and tradeoffs</summary>

- A full snapshot is hundreds of KB. A socket that can't drain it gets skipped until its buffer clears. Snapshots replace each other anyway, and queueing them would run the server out of memory.
- Online matches hold paused for a countdown so everyone loads in, then run locked at 1x (`server/match/openingFreeze.js`).
- A player who drops gets a reconnect window, then the AI takes their nation. A permanent drop is recorded as a quit.
- Chat is relayed, not simulated. Capped length, per-slot burst limit, no history on the server.
- The macOS build is ad-hoc signed, which rules out Squirrel.Mac. `electron/updater.cjs` mounts the new dmg, checks the bundle's seal and version, swaps it in with `ditto` and relaunches. Windows runs the NSIS installer silently.
- `scripts/ai-soak.mjs` plays full AI-only matches at fixed seeds and reports wars, alliances, survivors and step cost. It's how AI tuning gets checked.

</details>

<details>
<summary>How to play</summary>

1. Start a **New Game**, pick your nation and how many AI rivals you face. You can choose which nations they are.
2. A short grace period opens the game. Nobody can declare war. Use it to build.
3. The Goals panel walks you through the opening objectives, from setting up command to fielding a strike force.
4. Cover your cities with radar and air defense. Income comes from your cities, so losing them hurts.
5. Open **Plan**, pick your attackers and target nations, and launch.

The clock runs from 0.5x to 10x or paused. Single-player games save automatically and **Continue** picks up where you left off. The [unit wiki](https://domebreak.com/#/wiki) lists every unit and building with its cost, range and build time.

</details>

<details>
<summary>Running it locally</summary>

```bash
npm install
npm run dev
```

The game opens at http://localhost:5173 in the browser. Single-player needs no setup. For accounts and multiplayer, copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Needs Node 22.

`npm test` runs the test suite, and `npm run build` makes the production build in `dist/`.

</details>

<details>
<summary>Desktop builds</summary>

```bash
npm run build && npm run electron   # run the desktop app against the build
npm run electron:build:mac          # macOS .dmg, Apple Silicon and Intel
npm run electron:build:win          # Windows installer
```

Installers land in `release/`. A Linux AppImage target is set up too if you want to build one yourself.

</details>

<details>
<summary>Project layout</summary>

| Folder      | What's there                                                                             |
| :---------- | :--------------------------------------------------------------------------------------- |
| `src/`      | The game: engine, map, UI and networking                                                 |
| `electron/` | Desktop app and its auto-updater                                                         |
| `server/`   | Multiplayer match server (`npm start`), set up by the `GD_*` variables in `.env.example` |
| `supabase/` | Database migrations and edge functions for accounts and lobbies                          |
| `web/`      | The domebreak.com site: landing page, downloads and wiki                                 |
| `tests/`    | Vitest suites                                                                            |

</details>

## Built with

React 19, Vite, Tailwind CSS, MapLibre GL, Electron, Supabase, and a Node WebSocket server for multiplayer.

Unit icons are from [game-icons.net](https://game-icons.net) (Lorc, Delapouite) under CC BY 3.0.

<details>
<summary>License</summary>

Proprietary. See [LICENSE.md](LICENSE.md). The game-icons.net icons keep their own license.

</details>
