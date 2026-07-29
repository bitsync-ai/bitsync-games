# BitSync Games

A single home and monorepo for quick browser games from BitSync.

## Games

- [`games/pixel-slugger`](games/pixel-slugger) — a one-button baseball timing game
- [`games/traceback`](games/traceback) — a daily visual memory game

## Run locally

The hub itself has no dependencies. Individual games keep their source and
dependencies inside their own folders.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

The GitHub Pages workflow builds each game, assembles the complete site, and
deploys it from one repository.
