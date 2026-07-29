# Durable decisions

## Product

- Keep all BitSync browser games in this monorepo.
- Each game lives at `games/<game-name>/` and is launched from the root browser.
- Games should be quick, original, and understandable without a manual.
- Gameplay screens should fit inside one mobile viewport where practical,
  including iPhone safe areas and dynamic browser chrome.

## Games

- Pixel Slugger remains a one-button timing game implemented with Phaser.
- Traceback is a once-per-day visual-memory game with deterministic UTC puzzles,
  three escalating rounds, three lives, local statistics, and shareable results.
- Browser storage is used only for local game scores, streaks, and daily results.

## Engineering

- Keep the root game browser dependency-free.
- Keep game dependencies isolated within each game directory.
- GitHub Pages is the production host.
- Never commit secrets, analytics identifiers, credentials, or personal data.
