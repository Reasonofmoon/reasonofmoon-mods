# Silent Failure Detector

A Claude Code mod that flags Bash commands which **exit 0 but whose output says something failed**: failed or skipped tests, a traceback, `npm ERR!`, an unmet coverage threshold, `command not found`.

When it finds one, it:

- pins a warning in the status line under the prompt,
- writes one dim line to the transcript,
- appends a note to the tool result that Claude reads, so Claude checks the output before reporting the step as done.

It also notes when the command itself can hide a failing exit code (`|| true`, `| tail`, `| tee`, `; exit 0`).

Try it in your browser first: [live demo](https://reasonofmoon.github.io/reasonofmoon-mods/demo/silent-failure.html) · [한국어 데모](https://reasonofmoon.github.io/reasonofmoon-mods/demo/silent-failure.ko.html).

Requires **Claude Code v2.1.287 or later** (tested on 2.1.289).

Real-run log and A/B results: [examples/silent-failure/RUN-2026-10-05.md](../../examples/silent-failure/RUN-2026-10-05.md). Part of [reasonofmoon-mods](../../README.md).

## Install

```bash
claude plugin marketplace add Reasonofmoon/reasonofmoon-mods   # or a local path
claude plugin install silent-failure@reasonofmoon-mods
```

For one session only, without installing:

```bash
claude --plugin-dir ./plugins/silent-failure
```

## Commands

| Command | What it does |
|---|---|
| `/silent-failure` | Show the mode and the last finding |
| `/silent-failure last` | Show the full last report (alias `inspect`) |
| `/silent-failure strict` | Also flag warnings and deprecations; tell Claude about every finding |
| `/silent-failure on` | Default: flag failures and skipped tests; tell Claude about failures |
| `/silent-failure off` | Stop checking |
| `/silent-failure clear` | Clear the last report and the status line |

The mode and the last report are kept in the plugin's store, so they survive reloads and new sessions.

## What it checks

| Severity | Examples | Default mode | Strict mode |
|---|---|---|---|
| high | `2 failed`, `FAIL src/x.test.js`, `npm ERR!`, `Traceback`, `Unhandled rejection`, `Error:`, `command not found` | shown + sent to Claude | shown + sent |
| warning | `3 skipped`, `no tests found`, coverage threshold not met, `exception` | shown | shown + sent |
| info | `warning`, `deprecated` | ignored | shown + sent |

Counts must be 1 or more, so a passing summary such as `0 failed, 0 skipped` is not flagged. Calls that already errored (non-zero exit), were interrupted, or moved to the background are skipped.

## How it detects "exit 0"

The Bash tool's result record has no `exitCode` field. A non-zero exit reaches the `tool.call` hook as `isError: true`. This mod treats a result that is neither a deny nor an error as a successful exit.

## Development

```bash
claude plugin validate --strict ./plugins/silent-failure
claude plugin test ./plugins/silent-failure
```
