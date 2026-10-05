# Roadmap

Ten mods, one direction: **trust what an agent did, not what it says it did.** They ship one at a time into this marketplace and are designed to merge later into a single **CC Mission Control**.

```
CC MISSION CONTROL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFY       Silent Failure ✓ · Evidence Mode · PR Readiness
PROTECT      Undo Guardian · Danger Meter
THINK        Instruction Radar · Stop Me If I'm Wrong · Spec vs Reality
ORCHESTRATE  Agent Conflict · Handoff
```

Above the prompt, eventually: `CTX 61% │ PR 87% │ TEST ✓ │ RISK 12 │ AGENTS 3 │ ⚠ 1`

| # | Mod | Catches | Hooks | Difficulty | Status |
|---|-----|---------|-------|------------|--------|
| 1 | **Evidence Mode** | "Done, tests pass" said with no test run behind it | `tool.call` · `prompt.submit` · `ui.render` · `command.run` | ★★★★☆ | next |
| 2 | **Silent Failure Detector** | exit 0 with failed/skipped tests in the output | `tool.call{Bash}` · `command.run` | ★★☆☆☆ | **0.1.0** |
| 3 | Undo Guardian | `rm`, `git reset`, migrations without a checkpoint | `tool.call` | ★★★☆☆ | planned |
| 4 | PR Readiness Meter | "ready to merge" with a red test, a TODO, no docs | `session.start` · `tool.call` · `ui.render` | ★★★★☆ | planned |
| 5 | Instruction Conflict Radar | `CLAUDE.md` says X, `AGENTS.md` says not-X | `session.start` · `prompt.compose` | ★★★★☆ | planned |
| 6 | Stop Me If I'm Wrong | the same failure signature three times in a row | `tool.call` | ★★★☆☆ | planned |
| 7 | Spec vs Reality | requirements in a PRD with no matching code | `session.start` · `tool.call` · `$.model` | ★★★★★ | planned |
| 8 | Handoff | a long session ending without a resumable summary | `command.run` · `tool.call` | ★★★☆☆ | planned |
| 9 | Danger Meter | high blast-radius commands before they run | `tool.call{Bash}` | ★★★☆☆ | planned |
| 10 | Agent Conflict Detector | two subagents writing the same file | `agent.*` · `tool.call` | ★★★★★ | planned |

## Silent Failure Detector · next

- [ ] Viewer allowlist: skip `cat`, `grep`, `rg`, `git log/show/diff`, `jq`, so quoted logs do not fire (see the [run log](../examples/silent-failure/RUN-2026-10-05.md#false-positives-seen-while-building-this-repo))
- [ ] `/silent-failure ignore <rule>` per project
- [ ] AbovePrompt band with the last finding and a `last` button
- [ ] Hand findings to Evidence Mode's VERIFY ledger
