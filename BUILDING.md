# Building MyMediaBox

MyMediaBox is a Tauri 2 desktop app with a React/TypeScript frontend and a Rust backend.

## Repository requirements

Commit these files/directories:

- `package.json`
- `package-lock.json` after the first successful `npm install`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock` after the first successful Cargo/Tauri build
- `src-tauri/tauri.conf.json`
- `src-tauri/icons/`
- `.github/workflows/ci.yml`
- `.github/workflows/publish.yml`
- `.nvmrc`
- `rust-toolchain.toml`

Do **not** commit `.env.local`, SQLite databases, `node_modules`, `dist`, or `src-tauri/target`.

## Toolchain

- Node.js 22 LTS (the repo includes `.nvmrc`)
- Rust stable (the repo includes `rust-toolchain.toml`)
- platform-specific Tauri system prerequisites

## Local development

```bash
npm install
npm run check
npm run tauri:dev
```

## Local production build

```bash
npm run tauri:build
```

Tauri produces native bundles under `src-tauri/target/release/bundle/`.

### macOS

Build on macOS. Typical outputs include `.app` and `.dmg` bundles. Apple Silicon and Intel are separate targets unless you deliberately create a universal build.

### Windows

Build on Windows. Tauri produces Windows installer/bundle artifacts from the Windows runner.

### Linux

Build on Linux with WebKitGTK and the other Tauri system packages installed. The GitHub workflow installs these automatically on Ubuntu.

## GitHub Actions

Two workflows are included:

- `ci.yml` checks the TypeScript frontend and Rust/Tauri project on pushes and pull requests.
- `publish.yml` builds release artifacts on native GitHub runners for macOS Apple Silicon, macOS Intel, Windows x64, and Linux x64. It uploads all platform artifacts to a draft GitHub Release, then publishes the release automatically only after every platform build succeeds.

The publish workflow can be started manually from GitHub Actions or by merging/pushing approved code to the `stable` branch.

### Before the first public release

1. Run `npm install` locally and commit `package-lock.json`.
2. Run `npm run tauri:build` locally and commit the generated `src-tauri/Cargo.lock`.
3. Push `main` and create a `stable` branch.
4. Protect `stable` and require the `check` CI job before merge.
5. Merge the approved `main` → `stable` release pull request.
6. `publish.yml` builds every platform into a draft release and publishes it automatically only when all builds succeed.

See [`RELEASING.md`](./RELEASING.md) for the complete maintainer setup.

## Signing

Unsigned local builds are fine for development. Public distribution is a separate step:

- macOS should be code-signed/notarized for a smooth Gatekeeper experience.
- Windows signing reduces SmartScreen warnings and establishes publisher identity.
- Linux packages generally do not require the same OS-level signing flow, though repositories/package formats may have their own signing practices.

Signing credentials should be stored as GitHub Actions secrets, never committed to the repository.

## Version checklist

For a release, keep these versions in sync:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `APP_VERSION` in `src/types.ts`
- `CHANGELOG.md`

The Tauri application identifier and SQLite filename are intentionally **not** part of the normal rename/version process because existing user data depends on them.

## Public releases

Development happens on `main`. Public downloadable builds are created from the protected `stable` branch. See [`RELEASING.md`](./RELEASING.md) for the branch and versioning workflow.
