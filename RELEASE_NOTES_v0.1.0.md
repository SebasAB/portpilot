# PortPilot v0.1.0

The first public release of PortPilot.

PortPilot is a macOS menu bar utility that tells you exactly what's running
on your local ports — which project owns each port, what framework it's
using, whether it's a Docker container — and lets you stop it safely without
guessing from terminal output.

## Highlights

- **Tray-only macOS app.** No Dock icon, no window clutter. Click the menu
  bar icon to open a compact panel.
- **Instant scan** of every listening port via `lsof` + `ps`. Refreshes
  every 6 seconds while the panel is visible.
- **Project detection** — identifies Next.js, Vite, Expo, Rails, and
  more, plus the package manager (npm, pnpm, yarn, bun).
- **Docker-aware** — lists running containers alongside regular processes
  and stops them with `docker stop`.
- **Safe stop.** `SIGTERM` first; `SIGKILL` only available after the
  process survives and you explicitly click **Force Stop**. Protected
  system processes cannot be stopped.
- **Search and filter** by port, project, PID, framework, package manager,
  Docker container, image, or path.
- **Custom aliases** for any port — friendly names that stick across
  scans.
- **System / Light / Dark theme** follows macOS appearance.

## Installation

This is an **unsigned local build**. macOS Gatekeeper will block it on
first launch.

1. Download `PortPilot-0.1.0-arm64.dmg` from the assets below.
2. Open the `.dmg`, drag **PortPilot** to your Applications folder.
3. The first time you launch it: **right-click** PortPilot in Applications
   and choose **Open**. Confirm in the Gatekeeper dialog.
4. After the first launch, normal double-click works.

PortPilot appears as a small icon in your menu bar. Click it to open the
panel.

## Requirements

- macOS 12 Monterey or later
- Apple Silicon (arm64)

Intel (x86_64) support is on the roadmap.

## Known limitations

- Local builds are unsigned and not notarized. A signed and notarized
  version is in review on the Mac App Store.
- Docker detection depends on the Docker CLI being installed and
  responsive. Without Docker, the rest of the app works normally.
- Some processes started by wrappers may report a working directory
  outside the actual package root.
- The tray icon is a simple bundled PNG, not a final branded icon set.

## Coming soon

- Mac App Store release (signed and notarized).
- Intel (x86_64) build.
- Better heuristics for monorepos and package workspaces.

## Security

Security disclosures: see [SECURITY.md](SECURITY.md). Please do not file
public issues for security reports.

PortPilot collects no data, sends no telemetry, and contacts no remote
servers. The renderer is fully sandboxed; the only privileged operations
are reading local process state and stopping processes you explicitly
select.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full v0.1.0 entry.
