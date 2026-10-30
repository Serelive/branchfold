# Branchfold / 丛序

*A living task tree for plans that evolve with action.*

Branchfold is an experimental, local-first task tree editor. Break a rough objective into actionable parts, focus on a subtree, and revise the plan as work develops.

**[Try the web app](https://serelive.github.io/branchfold/)** · [User guide](docs/user-guide.md) · [Contributing](CONTRIBUTING.md) · [Development plan](BRANCHES.md)

## What works today

- One editor for Markdown checklists and JSON backups, in the browser and VS Code.
- Keyboard editing, drag and drop, subtree focus, completion, and undo/redo.
- Multiple tool labels per task, directory-style guides, light/dark themes, and English/Chinese controls.
- Browser-local persistence and import/export; explicit file saving and conflict recovery in VS Code.

Markdown imports extract checklist tasks. **Export and extension Save produce checklist Markdown, omitting headings, separate notes, and other unstructured content.** Opening a file leaves it unchanged. See [saving and recovery](docs/user-guide.md#saving-and-recovery) before editing a mixed-content document.

The longer-term direction is a Markdown-native project interface with project-file links. Artifact navigation and real-project workflow evaluation remain [planned work](BRANCHES.md).

## Run locally

Install Node.js (the version in [`.nvmrc`](.nvmrc) is recommended; minimum 22.12) and npm:

```sh
git clone https://github.com/Serelive/branchfold.git
cd branchfold
npm ci
npm run dev
```

Open the URL printed by Vite and keep the server running. No account or backend is needed. Use a current browser; open the hosted app over HTTPS.

For the VS Code development extension:

```sh
npm run build:extension
code --extensionDevelopmentPath="$PWD/extension" "$PWD"
```

Run **Branchfold: Open Markdown Task Document** from the Command Palette. The extension currently loads from this checkout, rather than a published Marketplace release.

## Data and backups

The web app stores its tree in your browser profile. It does not synchronize devices or update imported files. Export important work before clearing site data; localhost and the hosted site have separate storage. VS Code saves the selected document only when requested and retains drafts for recovery.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) for issues, checks, and pull requests. [Documentation](docs/README.md) covers the format, testing, deployment, and product decisions. [AGENTS.md](AGENTS.md) provides coding-agent instructions.

## License

A project license has not yet been selected. The maintainer's licensing decision is tracked in [BRANCHES.md](BRANCHES.md).
