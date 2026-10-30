# Contributing to Branchfold

Bug reports, documentation improvements, and focused patches are welcome. For larger features, open an issue describing the workflow improvement before building it.

## Issues and discussion

Use the bug or feature template. Include reproduction steps, expected/actual behavior, browser or VS Code version, and a small synthetic task document where useful. Remove private tasks, paths, and credentials. Search existing issues first.

Be respectful and constructive. Discuss the behavior or proposal, explain disagreements, and help others reproduce problems.

## Develop and validate

1. Fork the repository if you lack write access, then clone your fork.
2. Create a short-lived branch from current `main`, such as `fix/import-error` or `feat/task-links`.
3. Install Node as described in the [README](README.md), then run `npm ci`.
4. Make a focused change and add behavior tests where appropriate.
5. Run `npm test`, `npm run build:extension`, and `git diff --check`.

For documentation-only changes, check instructions and relative links. For interaction changes, also exercise affected behavior in a real browser and VS Code when relevant. See [development and testing](docs/development.md); state checks you could not perform.

Preserve host interaction parity, IME input, undo, import recovery, and explicit-save conflicts. Update the [shared editor reference](docs/shared-editor.md) when behavior changes. Use [BRANCHES.md](BRANCHES.md) for milestones; GitHub issues and PRs hold individual discussions. Small fixes need no new report.

## Pull requests

Push your branch to your fork or the repository. Open a PR with **base: main** and **compare: your branch**. Explain the problem, resulting behavior, and validation; link the issue when one exists. Use a draft for work in progress. Further pushes update the same PR.

Review the diff and CI results. Keep builds, private fixtures, credentials, and personal IDE settings out of commits. Commit lockfile changes with dependency changes. Use clear imperative commit subjects; no special syntax is required.

Maintainers merge after review and passing checks using the repository's available merge methods. After merging, update local `main` with `git pull --ff-only` and start a fresh branch. Do not rewrite shared history.

## Documentation

Keep current guidance in stable documents linked from [docs/README.md](docs/README.md). Absorb lasting decisions before moving raw reviews and reports to [docs/archive/](docs/archive/). Historical test results describe their original revision.

Licensing is currently undecided; see the [README](README.md#license).
