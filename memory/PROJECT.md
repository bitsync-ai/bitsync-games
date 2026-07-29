# BitSync Games project context

## Purpose

BitSync Games is a public monorepo and GitHub Pages arcade for quick browser
games. Games should be easy to learn, playable in short sessions, and work well
on phones and desktops.

## Repository layout

- `index.html`, `styles.css`, and `script.js`: dependency-free game browser.
- `games/pixel-slugger/`: one-button baseball game built with Next.js and Phaser.
- `games/traceback/`: dependency-free daily visual-memory game.
- `.github/workflows/deploy-pages.yml`: builds Pixel Slugger, assembles the hub
  and games into `_site`, and deploys GitHub Pages.

## Deployment

Production is hosted at:

`https://bitsync-ai.github.io/bitsync-games/`

The Pages workflow builds on pull requests and deploys only after changes reach
`main`.

## Validation

- Pixel Slugger: run `npm ci`, then `npm run build` from
  `games/pixel-slugger`.
- Traceback: run `node --check games/traceback/script.js`.
- Hub and Traceback are static and require no installation.
