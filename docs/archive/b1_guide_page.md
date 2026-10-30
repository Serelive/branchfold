# Deploy Branchfold to GitHub Pages

Use **GitHub Actions** to build and publish the browser prototype. With the repository's current name and no custom domain, the expected address is:

**https://serelive.github.io/branchfold/**

This hosts the browser import/edit/export app. The VS Code extension continues to run inside VS Code. Task data stays in each visitor's browser storage; publishing does not share your local tree. Export from your local app and import on the hosted site to transfer tasks between them.

This document is a guide only: the workflow below has not been installed or deployed.

## 1. Prepare main and enable Pages

Merge the prototype into `main` using the [PR guide](b1_guide_PR.md), or include the workflow below in that PR before merging.

On [the repository](https://github.com/Serelive/branchfold), open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. You need repository admin or maintainer access. Follow GitHub's [publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 2. Add the deployment workflow

Create `.github/workflows/pages.yml` at the repository root and paste:

```yaml
name: Publish Branchfold

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: branchfold-pages
  cancel-in-progress: false

jobs:
  build:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build -- --base=/branchfold/
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.publish.outputs.page_url }}
    steps:
      - uses: actions/configure-pages@v6
      - name: Publish site
        id: publish
        uses: actions/deploy-pages@v5
```

The build uses the Node version in [.nvmrc](../.nvmrc), tests the app, and uploads only `dist`. Deployment waits for that build. GitHub provides the deployment token; no personal access token is needed. The permissions and environment follow GitHub's [custom-workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages); action versions follow the current [Vite Pages example](https://vite.dev/guide/static-deploy#github-pages).

**Why the base argument?** This repository is served under `/branchfold/`. The command overrides the existing `--base=./` for this build only. Keep the normal build script unchanged: its relative paths are useful for VS Code webviews. No Vite configuration file or committed `dist` directory is needed.

## 3. Commit, merge, and publish

Commit the workflow on your working branch, push it, and merge it through a PR into `main`. The push to `main` starts deployment automatically.

Open **Actions → Publish Branchfold**, then inspect the build and deployment jobs. After success, open the URL shown by the deployment. If Pages was enabled after the merge, use **Run workflow** and select `main`. This workflow publishes only `main`, including manual runs.

The site becomes public. The workflow publishes the compiled app, not the repository's documentation, sandbox, or local browser data.

## 4. Check the deployed app

- Open the site, create and rename a task, then refresh to verify local persistence.
- Import a small Markdown tree, assign tools, and export it again.
- Check dark mode, Chinese mode, and a narrow window.

Use export for backups. Browser data is separate from your localhost app and does not synchronize across devices. Clearing site storage removes that browser's working tree.

## Troubleshooting and updates

| Symptom | Check |
| --- | --- |
| No deployment runs | The workflow must be present on `main`; confirm Pages uses GitHub Actions. |
| Build fails | Open the failed Actions step. Confirm `.nvmrc` and `package-lock.json` are committed. |
| Deployment is blocked | Check the `github-pages` environment's branch rules or required approval; allow `main`. |
| 404 or missing scripts/styles | Use `/branchfold/` with the trailing slash and confirm the build uses that same base path. Publish the contents of `dist`, not the source tree. |
| Your localhost tasks are missing | Export them from localhost and import them on the hosted site. |

Later merges into `main` publish updates automatically. For a rollback, revert the problematic change through a PR and merge it; the workflow republishes the resulting version.

Local validation for this guide: the Pages-specific build command was checked. The GitHub-hosted workflow still needs its first run after you add it.
