# Changelog

All notable changes to PortPilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-20

Initial public release.

### Added

- macOS menu bar app that lists every local listening port with project,
  framework, package manager, and Docker context.
- Search across port, project name, alias, PID, command, framework, package
  manager, Docker container, image, and path.
- Filter between "common ports" and "all ports".
- One-click actions per port: open the local URL, copy the URL, reveal the
  project folder in Finder, set a custom alias.
- Safe Stop flow: `SIGTERM` first, with an explicit Force Stop (`SIGKILL`)
  appearing only when the process survives `SIGTERM`.
- Docker integration: detects containers via `docker ps`, stops them via
  `docker stop <containerId>`.
- Protected system processes are flagged and cannot be stopped.
- System / Light / Dark theme follows macOS appearance by default.
- Settings panel for theme and "show protected processes" toggle.
- Persistent preferences and aliases stored locally in the sandboxed
  Application Support container.

### Security

- Renderer runs with `contextIsolation: true`, `nodeIntegration: false`,
  and `sandbox: true`.
- All shell invocations use `execFile` with array arguments.
- PIDs and Docker container IDs are validated before use.
- `shell.openExternal` is restricted to `http://localhost:<port>` URLs.

### Known limitations

- Apple Silicon (arm64) only for v0.1.
- Local builds are unsigned and not notarized; the Mac App Store build is
  in review.
- Docker detection depends on the Docker CLI being installed and responsive.
- Some processes started by wrappers may report a working directory outside
  the actual package root.

[0.1.0]: https://github.com/SebasAB/portpilot/releases/tag/v0.1.0
