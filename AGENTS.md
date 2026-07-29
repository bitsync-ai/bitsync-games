# AI Agent Instructions

Before changing this repository, read:

- `memory/PROJECT.md` for the current architecture and workflows.
- `memory/DECISIONS.md` for durable product and technical decisions.

When a change introduces a lasting product, architecture, deployment, or workflow
decision, update the relevant memory file in the same pull request.

Keep memory concise and factual. Do not store credentials, personal information,
temporary debugging notes, or assumptions that have not been confirmed.

## Working rules

- Preserve the single-repository game hub structure.
- Keep each game self-contained under `games/<game-name>/`.
- Ensure gameplay fits within one mobile viewport where practical.
- Run the relevant game build or syntax check before publishing changes.
- Do not add dependencies unless they materially improve the game.
