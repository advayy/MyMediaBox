# Releasing MyMediaBox

MyMediaBox uses two long-lived branches:

- `main` — active development
- `stable` — code approved for a public downloadable release

A push or merge to `stable` starts `.github/workflows/publish.yml`. GitHub Actions builds native bundles on macOS, Windows, and Linux runners, creates the matching `vX.Y.Z` Git tag, uploads every installer/bundle to a draft GitHub Release, and only publishes that release after all platform builds succeed.

## First-time repository setup

1. Create the repository and push `main`.
2. Create `stable` from the commit you want to release:

   ```bash
   git checkout -b stable
   git push -u origin stable
   git checkout main
   ```

3. In **GitHub → Settings → Branches / Rulesets**, protect `stable`:
   - require changes to arrive through a pull request
   - require the `check` CI job to pass before merge
   - block force pushes
   - block branch deletion
   - if you later have other maintainers, optionally require at least one approving review

   For a solo-maintainer repository, do not require another person's approval unless someone else has write access; your deliberate merge from `main` to `stable` is the release approval gate.

4. Keep `main` as the default branch so contributors target normal development rather than the release branch.
5. Make sure GitHub Actions is enabled. The publish job requests only `contents: write` where it needs to create a release.

## Releasing a version

Before opening the release PR:

1. Update the version in all four locations:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
   - `src/types.ts` (`APP_VERSION`)
2. Add the release notes to `CHANGELOG.md`.
3. Run:

   ```bash
   npm install
   npm run version:check
   npm run build
   cargo check --manifest-path src-tauri/Cargo.toml
   ```

4. Push to `main` and open a pull request from `main` into `stable`.
5. Merge only after CI is green and you are happy with that commit.
6. The merge to `stable` automatically builds all targets. The release stays draft until every target succeeds, then it is published automatically.

The workflow refuses to use an existing `vX.Y.Z` tag for different code. If a version has already been released, increment the version before the next merge to `stable`.

## Dependency lockfiles

Before the first public release, run `npm install` and `npm run tauri:build` locally and commit the generated `package-lock.json` and `src-tauri/Cargo.lock`. They make contributor and release builds more reproducible. Once both are committed, CI can be tightened to `npm ci` and Cargo `--locked`.

## Current downloadable targets

- macOS Apple Silicon
- macOS Intel
- Windows x64
- Linux x64

The workflow uses Tauri's GitHub Action and native GitHub-hosted runners for each platform.

## Signing

The initial public builds can be produced without signing, but downloaded macOS and Windows builds may show security warnings. Before presenting the app as a polished general-audience download, configure Apple signing/notarization and Windows code signing in repository secrets and the release workflow.

Do not commit signing certificates, private keys, or passwords to the repository.
