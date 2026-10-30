# GitHub Pages deployment

The browser app is hosted at **https://serelive.github.io/branchfold/**. The checked-in [workflow](../.github/workflows/pages.yml) publishes `dist/` after pushes to `main`, or manual runs on `main`.

## Setup and updates

In GitHub **Settings → Pages → Build and deployment**, select **GitHub Actions**. Use HTTPS and enable **Enforce HTTPS** where offered. Deployment uses GitHub's token and the `github-pages` environment; administrators control its approval and branch rules.

After merging, inspect **Actions → Publish Branchfold** and follow the deployment URL. To redeploy, choose **Run workflow → main**. Only the compiled website is uploaded; visitor tasks remain in browser storage.

## Local build

```sh
npm ci
npm test
npm run build -- --base=/branchfold/
npm run preview
```

Append `/branchfold/` to the preview URL. The base matches the repository's Pages subpath. Keep the ordinary relative-base build for VS Code webviews. Update the deployment base if renaming the repository or adding a custom domain.

## Check and troubleshoot

Create/rename a task, refresh, import/export a small tree, and try both themes and a narrow window.

| Symptom | Check |
| --- | --- |
| No run | Workflow is on `main`; Pages source is GitHub Actions. |
| Build/deploy failure | Inspect the failing step and environment branch/approval rules. |
| Missing scripts or 404 | Use the trailing-slash URL and match the build base to `/branchfold/`. |
| `crypto.randomUUID is not a function` | Open directly over HTTPS in an updated browser. DevTools should show `window.isSecureContext` as true and `typeof crypto.randomUUID` as `"function"`. |
| Localhost tasks missing | Export from localhost and import on the site; storage is separate. |

Roll back by reverting the faulty change through a PR; merging republishes the app. Export important tasks before clearing browser data.

References: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite deployment](https://vite.dev/guide/static-deploy#github-pages), [secure UUID API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID).
