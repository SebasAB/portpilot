# Security Policy

## Supported Versions

PortPilot is in early development. Only the latest released version receives
security updates.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✓         |
| < 0.1   | ✗         |

## Reporting a Vulnerability

If you believe you have found a security vulnerability in PortPilot, please
**do not file a public issue**. Email the maintainer instead:

**sebasaliaga2515@gmail.com**

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof-of-concept.
- The PortPilot version you tested against (see `About` in the app, or
  `package.json`).
- Your macOS version.

You can expect an acknowledgement within 7 days and a status update within
30 days. If the report is valid, we will coordinate a fix and a release before
public disclosure.

## Scope

PortPilot's privileged surface is small but worth describing:

- The renderer process is sandboxed (`contextIsolation: true`,
  `nodeIntegration: false`, `sandbox: true`) and exposes **no** shell or
  filesystem access.
- The main process spawns three external programs only:
  `lsof`, `ps`, and (optionally) `docker`. All invocations use `execFile`
  with arrays of arguments — never string concatenation.
- The main process sends signals only via `process.kill(<numeric pid>, ...)`.
  PIDs are validated to be within a sane range before any signal is sent.
- Docker container IDs are validated against `/^[a-f0-9]{12,64}$/i` before
  being passed to `docker stop`.
- `shell.openExternal` is restricted to `http://localhost:<port>` URLs.

### Out of scope

The following are explicitly **not** in scope for security reports:

- Vulnerabilities that require root or admin privileges on the user's Mac.
- Vulnerabilities in third-party tools (`lsof`, `ps`, `docker`, macOS itself).
- Self-XSS where the attacker controls a process command line — the rendered
  text is HTML-escaped by React.
- Denial of service caused by an enormous number of listening ports.

## Security-relevant design choices

- Stop sends `SIGTERM` first. `SIGKILL` is only available after the process
  remains alive and the user explicitly clicks Force Stop.
- Protected system processes (e.g. `mDNSResponder`, `coreaudiod`) are
  flagged and cannot be stopped.
- No analytics, no telemetry, no network requests, no auto-update.
- All preferences and aliases are stored locally in the app's sandboxed
  Application Support container.
