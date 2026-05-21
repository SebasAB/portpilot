# Contributing to PortPilot

Thanks for your interest in PortPilot! This document covers how to set up a
local development environment, how to run the tests, and what's expected in a
pull request.

By participating in this project, you agree to abide by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting issues

- **Security vulnerabilities**: see [SECURITY.md](SECURITY.md). Do not open a
  public issue.
- **Bugs**: open a [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md). Include
  your macOS version, your PortPilot version, and the affected port if
  relevant.
- **Feature requests**: open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md).
  Describe the problem first, then your proposed solution.

## Local development

Requirements:

- macOS 12 (Monterey) or later
- Node.js 20 LTS or later
- npm 10 or later

Setup:

```bash
git clone https://github.com/<your-fork>/portpilot.git
cd portpilot
npm install
npm run dev
```

`npm run dev` starts Vite for the renderer and launches Electron in a single
process. The app appears as a small icon in the macOS menu bar; click it to
open the panel.

## Scripts

| Command                | What it does                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`          | Start Vite + Electron in development mode                                            |
| `npm run build`        | Type-check, build the renderer (Vite), and compile the Electron main/preload (`tsc`) |
| `npm test`             | Run the Vitest test suite once                                                       |
| `npm run test:watch`   | Run Vitest in watch mode                                                             |
| `npm run lint`         | Lint all `.ts` / `.tsx` source                                                       |
| `npm run format`       | Format the repo with Prettier                                                        |
| `npm run format:check` | Verify formatting without writing                                                    |
| `npm run dist`         | Produce a local `.dmg` / `.zip` in `release/`                                        |

## Pull request checklist

Before opening a PR:

- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run format:check` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` succeeds with zero errors.
- [ ] You've added or updated tests for behavior changes.
- [ ] You've updated relevant documentation (README, CHANGELOG).
- [ ] Your commits are focused and have descriptive messages.

## Coding guidelines

- Renderer code (`src/`) must never run shell commands. All privileged work
  belongs in the Electron main process (`electron/`).
- The `contextBridge` API exposed in `electron/preload.ts` is the only
  interface between the renderer and the main process. Keep it narrow,
  ID-based, and well-typed.
- Shell commands must use `execFile` with an argument array — never `exec`
  with string interpolation.
- All inputs that cross the IPC boundary (record IDs, PIDs, container IDs)
  must be validated in the main process before use.
- Tests use fixtures, not real network or shell output. See `tests/` for
  examples.

## Releasing

Releases are tagged `vX.Y.Z` and produced via `npm run dist`. The
`.dmg`/`.zip` artifacts in `release/` are uploaded to a corresponding GitHub
Release. See [CHANGELOG.md](CHANGELOG.md) for version history.

## Questions?

Email the maintainer at **sebasaliaga2515@gmail.com**.
