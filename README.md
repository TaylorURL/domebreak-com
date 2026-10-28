<img src="build/icon.png" width="160" alt="DomeBreak" />

# DomeBreak

A real-time missile strategy game played on the real world map.

[domebreak.com](https://domebreak.com) · [Download](https://domebreak.com/#/download) · [Unit wiki](https://domebreak.com/#/wiki)

<img src="https://img.shields.io/badge/version-2026.44.3-e0574f?style=for-the-badge" alt="Version 2026.44.3" />

Pick a nation and run it in real time. Cover your cities with radar and interceptors, put silos, warships and jets in reach of your rivals, and keep the economy going while missiles are in the air. Play against up to eleven AI nations or online. Free, as a desktop app for macOS and Windows.

It's my own game, published under TaylorURL. The game, the match server and the website all live in this repo.

<img src="web/public/shots/command-map-1600w.webp" width="49%" alt="The command map at the start of a game" />
<img src="web/public/shots/battle-plan-1600w.webp" width="49%" alt="Planning a strike" />

## The simulation

`src/game/engine.js` builds a world from a match setup, and each tick mutates it in place. The whole game state is plain JSON and all randomness comes from the world's seeded stream, so a seed always plays out the same way. Borders come from `scripts/gen-country-grid.mjs`, which rasterizes country polygons into a quarter-degree ownership grid. The sim and the AI both read that grid, so the AI is held to the same borders the player is.

The map on top is MapLibre over PMTiles, globe or flat, black and white with ownership painted over it.

`scripts/ai-soak.mjs` plays full AI-only matches at fixed seeds and reports wars, alliances, survivors and step cost. That's how AI tuning gets checked.

## Multiplayer

The match server in `server/match` imports the same engine the client runs. Online, the server is authoritative. It ticks the world and streams snapshots, and the client overwrites its one world object in place so every reference into it stays valid.

Some rules that came out of that:

- Client and server have to be the exact same build. Any skew risks the two sims drifting apart, so the server refuses a hello from a different version and the client says "update required" (`src/net/version.js`).
- `server/match/commands.js` is a whitelist, and each command runs as the authenticated socket's nation. A client can't act for anyone else.
- A full snapshot is hundreds of KB. A socket that can't drain it gets skipped until its buffer clears. Snapshots replace each other anyway, and queueing them would run the server out of memory.
- Matches start paused on a countdown so everyone loads in, then run locked at 1x. A player who drops gets a reconnect window before the AI takes their nation.
- Chat is relayed, not simulated, with capped length, a per-slot burst limit and no history kept.

Matchmaking is just rows in Postgres. The matchmaker groups waiting `matchmaking_queue` rows into a lobby of real players and flips it to `starting`. A server claims the lobby with an update guarded on that status, so two servers racing for it can't both win.

## Updates on macOS

The macOS build is ad-hoc signed, which rules out Squirrel.Mac. `electron/updater.cjs` mounts the new dmg, checks the bundle's seal and version, swaps it in with `ditto` and relaunches. Windows just runs the NSIS installer silently.

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
<summary>Building it</summary>

```bash
npm install
npm run dev                         # http://localhost:5173 in the browser
npm test
npm run build                       # production build in dist/
npm run electron                    # desktop app against the build
npm run electron:build:mac          # macOS .dmg, Apple Silicon and Intel
npm run electron:build:win          # Windows installer
```

Needs Node 22. Single-player needs no setup. For accounts and multiplayer, copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The match server runs with `npm start` and reads the `GD_*` variables. Installers land in `release/`, and there's a Linux AppImage target if you want to build one yourself.

`src/` is the game, `electron/` the desktop app and updater, `server/` the match server, `supabase/` the migrations and edge functions for accounts and lobbies, `web/` the domebreak.com site, and `tests/` the Vitest suites.

</details>

React 19, Vite, Tailwind CSS, MapLibre GL, Electron, Supabase and a Node WebSocket server.

Unit icons are from [game-icons.net](https://game-icons.net) (Lorc, Delapouite) under CC BY 3.0 and keep that license. Everything else is proprietary, see [LICENSE.md](LICENSE.md).
