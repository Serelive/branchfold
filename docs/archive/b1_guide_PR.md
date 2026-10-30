# Your first Branchfold pull request

A pull request (PR) proposes merging your branch into `main` and provides a place to inspect the changes and discuss them. Opening it leaves `main` unchanged.

For this PR: **base = `main`**, **compare = `feat/markdown-integration`**, in **Serelive/branchfold**.

## 1. Prepare the branch

This guide is committed locally after your earlier push. To include it, run:

```sh
git status
git push origin feat/markdown-integration
```

Review any unexpected local changes first. The last application validation passed 81 tests, both builds, and real VS Code checks. If you change code before merging, rerun `npm test` and `npm run build:extension` using the project's Node setup in the [README](../README.md). There is currently no checked-in GitHub Actions workflow, so local results are the validation record.

## 2. Open the PR on GitHub

1. Open [this branch comparison](https://github.com/Serelive/branchfold/compare/main...feat/markdown-integration).
2. Confirm the base and compare branches above. Inspect the diff, then click **Create pull request**.
3. Use the title and description below, adjusting anything you want to emphasize.
4. Click **Create pull request**. If you still want to finish work first, choose **Create draft pull request** from its dropdown instead.

Further commits pushed to this same branch update the existing PR. See GitHub's [creation guide](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request).

Suggested title:

```text
Add a shared Markdown task editor and VS Code integration
```

Suggested description:

```markdown
This brings Branchfold's outline editor to Markdown task documents and VS Code, while retaining JSON compatibility and browser import/edit/export.

- Share task editing, subtree focus, movement, completion, and recovery across both hosts.
- Add explicit Markdown saving, external-edit conflict handling, and draft recovery in VS Code.
- Add dark/Chinese modes, compact settings, multi-tool annotations, and refined keyboard and pointer controls.
- Update project documentation and archive the completed branch reviews.

Save behavior: extension Save replaces the document with structured checklist Markdown, including tool annotations. Headings, separate notes, and other unstructured content are omitted. Opening a file leaves it unchanged.

Validation: 81 automated tests, type checking, website/extension builds, and real VS Code checks passed locally. Native Fcitx5 and a full manual visual pass were not rerun for the final changes.
```

## 3. Review before merging

Use **Files changed** to inspect the final result, especially Markdown conversion and extension saving. Check any GitHub checks or required reviews shown on the PR. For a solo project, reviewing your own diff is still useful; repository rules determine whether another person's approval is required.

One documentation item to resolve before merging: the current README still describes the old direct **↗** Focus control and says visualization defaults are all enabled. Update these to match Focus in the slide tray and unchecked branch bars defaulting off. Check its keyboard table against the new Ctrl+Left/Right behavior as well.

## 4. Merge and return to main

For this milestone, I recommend **Create a merge commit**, if available, to retain the branch's implementation history. Click **Merge pull request**, then **Confirm merge**. If GitHub reports conflicts or unmet requirements, resolve those first. GitHub's [merge guide](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request) explains the available methods.

After GitHub shows **Merged**, with a clean local working tree:

```sh
git switch main
git pull --ff-only origin main
```

Start the next task on a fresh short-lived branch. Deleting the merged branch on GitHub is optional; it can wait until you are comfortable with the result.
