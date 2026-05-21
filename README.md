# PortPilot

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%2012%2B-blue.svg)](https://www.apple.com/macos/)
[![CI](https://github.com/SebasAB/portpilot/actions/workflows/ci.yml/badge.svg)](https://github.com/SebasAB/portpilot/actions/workflows/ci.yml)

PortPilot is a macOS menu bar developer utility for quickly seeing which local projects are using localhost ports, why they are running, and how to stop them safely.

It is built with Electron, React, Vite, TypeScript, Vitest, and Electron Builder. It has no backend server, no cloud sync, no external database, and no AI API.

<!-- Add a screenshot once one is available:
![PortPilot panel](assets/screenshot.png)
-->

## Download

Grab the latest `.dmg` from [GitHub Releases](https://github.com/SebasAB/portpilot/releases/latest). A signed Mac App Store version is in review.

## Why It Exists

Local development sessions often leave servers, databases, containers, and toolchains running across common ports. PortPilot keeps that information in a compact menu bar panel so you can identify projects, open local URLs, reveal project folders, and stop processes without guessing from terminal output.

## Run Locally

```bash
npm install
npm run dev
```

The app starts as a tray/menu bar app and hides the Dock icon on macOS when possible. Click the menu bar icon to toggle the compact panel.

## Tests

```bash
npm run test
npm run test:watch
```

Tests use fixtures and do not require real listening ports or Docker.

## Build

```bash
npm run build
```

This builds the Vite renderer into `dist/` and compiles Electron main/preload files into `dist-electron/`.

## Package

```bash
npm run dist
```

Electron Builder is configured for local macOS `dmg` and `zip` builds targeting `arm64`. Signing and notarization are disabled for local development builds.

## Search And Settings

Use the header search box to filter by port, project name, alias, PID, command, framework, package manager, Docker container, image, or path.

Use the settings button to choose `System`, `Light`, or `Dark` theme and to show or hide protected system processes.

## Safety Model

- The renderer never runs shell commands.
- Shell commands run only in the Electron main process.
- `contextIsolation` is enabled and `nodeIntegration` is disabled.
- The preload exposes a narrow API based on record IDs.
- Process scanning uses `lsof` and `ps`.
- Stop sends `SIGTERM` first.
- `SIGKILL` is only available after a process remains alive and the user explicitly clicks Force Stop.
- Protected system processes are marked dangerous and cannot be stopped.
- Docker records use `docker stop <containerId>`.
- PortPilot does not kill Docker backend processes directly.
- Stop actions only operate on scanner-known or main-process-revalidated records.

## Known Limitations

- macOS is the primary target for v0.1.
- Docker detection depends on the Docker CLI being installed and responsive.
- Project detection depends on the target process exposing a readable current working directory.
- Some processes started by wrappers may report a cwd outside the actual package root.
- The tray icon is a simple bundled PNG asset, not a final branded icon set.
- Local builds are unsigned and not notarized.

## Roadmap

- Better heuristics for monorepos and package workspaces.
- Optional grouping by project.
- More precise service classification for databases and queues.
- Better handling for privileged ports and permission-limited metadata.
- Signed and notarized macOS distribution.

## Distribution Notes

`npm run dist` creates local artifacts in `release/`. These are suitable for local testing. Public distribution should add a proper icon set, Apple Developer signing identity, hardened runtime settings, and notarization.

## Deliberate v0.1 Exclusions

PortPilot v0.1 does not implement restart, logs, AI, auto-update, cloud sync, a backend server, or an external database.

## Contributing

PRs and issues are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

To report a security vulnerability, please email the maintainer instead of opening a public issue. See [SECURITY.md](SECURITY.md) for the full disclosure policy.

## License

PortPilot is released under the [MIT License](LICENSE).
