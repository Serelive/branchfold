# Development and testing

```sh
npm test
npm run build
npm run preview
```

Tests cover tree operations, editor interactions, structured Markdown conversion, explicit saves, conflicts, storage, and recovery. The build type-checks TypeScript and generates `dist/`; preview serves that production build locally.

For the real-browser regression suite, install Firefox and geckodriver and use Python 3. Start these in separate terminals:

```sh
npm run dev -- --port 5174 --strictPort
```

```sh
geckodriver --host 127.0.0.1 --port 4444
```

Then run:

```sh
python3 tests/browser_regression.py
```

Run `python3 tests/browser_markdown.py` against the same test servers for Markdown import/edit/export, append/replace, focus, and original-file preservation checks. To exercise the actual VS Code save and undo path after `npm run build:extension`:

```sh
code --extensionDevelopmentPath="$PWD/extension" \
  --extensionTestsPath="$PWD/tests/vscode.integration.cjs" \
  --user-data-dir="$PWD/.tools/vscode-test-profile" \
  --extensions-dir="$PWD/.tools/vscode-test-extensions" \
  --disable-extensions --skip-welcome --skip-release-notes --wait
```

The VS Code test uses a temporary document and writes its results to `.tools/vscode-integration.json`.

The suite uses disposable task data and a separate headless Firefox profile. It covers keyboard entry, pointer gestures, scrolling, imports, history, and reload, and saves artifacts under ignored `.tools/browser-regression/`. Stop the test servers when finished. Desktop shortcuts and IME behavior also benefit from hands-on testing on your system.

## Repository map

- `web/`: shared React editor, task operations, Markdown conversion, browser storage.
- `extension/`: VS Code document host and explicit-save/conflict handling.
- `tests/`: domain/component tests, optional Firefox scripts, VS Code integration test.
- `scripts/`: extension build tooling.
- `src/branchfold/` and `pyproject.toml`: retained Python scaffold, separate from the application runtime. Browser scripts use Python's standard library.

Use the Node version in [`.nvmrc`](../.nvmrc), or Node 22.12+ as declared in [package.json](../package.json). `npm ci` installs the committed lockfile. `npm run build:extension` includes the website build and TypeScript checks.

CI runs tests and both builds on pull requests to `main` and pushes to `main`. GUI tests require a local browser or VS Code and are not part of CI. After a VS Code test, check that `.tools/vscode-integration.json` has a fresh success result; do not rely only on the process exit code.

Optional Firefox suites also include `tests/browser_appearance.py` and `tests/browser_website_refinements.py`. Some scripts retain historical UI expectations; inspect failures against current behavior and update stale assertions when changing the relevant UI. Report which suites actually ran.

## Local fixtures

Use disposable documents for save/import tests. The ignored `sandbox/` is an independent project root: keep its files and links inside it. A fresh checkout excludes personal fixtures and `materials/branchfold-backup.json`; create a synthetic checklist instead. CI must not depend on ignored data.
