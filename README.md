# BitSync Games

A single home and monorepo for quick browser games from BitSync.

## Games

- [`games/traceback`](games/traceback) — a daily visual memory game

## Run locally

The site has no dependencies and runs as static HTML, CSS, and JavaScript.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

The GitHub Pages workflow assembles and deploys the complete static site.
