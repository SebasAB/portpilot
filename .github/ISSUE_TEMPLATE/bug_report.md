---
name: Bug report
about: Something isn't working as expected
title: "[Bug] "
labels: bug
assignees: ""
---

## Description

A clear and concise description of what the bug is.

## Steps to reproduce

1. Open PortPilot
2. ...
3. ...

## Expected behavior

What you expected to happen.

## Actual behavior

What actually happened. Include screenshots of the PortPilot panel if relevant.

## Environment

- **macOS version**: (e.g. 14.4.1)
- **Mac type**: (Apple Silicon / Intel)
- **PortPilot version**: (see `About` in the app, or `package.json`)
- **Affected port**: (if applicable)
- **Docker installed**: (yes / no — and version if yes)

## Additional context

Anything else that might help diagnose the issue. For port-related bugs,
including the output of `lsof -iTCP -sTCP:LISTEN -n -P` for the affected
port is very helpful.
