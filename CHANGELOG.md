# Changelog

## 0.1.0 — 2026-10-05

### Silent Failure Detector (first mod)
- `tool.call{Bash}` hook: after the command runs, scan stdout + stderr when the call did **not** error
- 15 rules in three severities (high · warning · info); counts must be ≥ 1, so `0 failed` is never flagged
- Shows: pinned status line, one transcript line; tells Claude: a `context` note after the tool result
- Names exit-code masking: `|| true`, `; true`, `; exit 0`, pipes into `tail`/`head`/`tee`/`grep`/…
- Modes `on` (default) · `strict` · `off`; `/silent-failure [last|strict|on|off|clear]`; mode and last report kept in `$.store`
- Skips errored, denied, interrupted and backgrounded calls

### Evidence
- Verified against Claude Code 2.1.289 declarations: Bash result has `stdout`, `stderr`, `interrupted`, `backgroundTaskId?`, no `exitCode`
- `claude plugin validate --strict` ✓ · `claude plugin test` 5/5 ✓ · installed via `claude plugin install` ✓
- Real-run log and 12-run A/B: [`examples/silent-failure/RUN-2026-10-05.md`](examples/silent-failure/RUN-2026-10-05.md)

### Repo
- Marketplace `reasonofmoon-mods`, README in the SEAL layout, CI (`scripts/check.sh`), rendered assets from `docs/src/*.html`
