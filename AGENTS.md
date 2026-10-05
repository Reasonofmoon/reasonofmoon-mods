# reasonofmoon-mods — notes for coding agents

- Invariant: **exit 0 is not evidence.** A mod here checks what a tool did; it never takes the agent's word.
- Each mod is a plugin under `plugins/<name>/` and is listed in `.claude-plugin/marketplace.json`. Keep the entry name equal to the `plugin.json` name.
- Types come from the installed Claude Code (`.claude-plugin/types/`, written on load; not committed). Trust them over any doc when they disagree.
- Write every `$` call in full (`$.store.get`, never `const s = $.store`) and every `on('event', …)` name as a string literal, or `claude plugin validate` fails.
- The Bash result has **no `exitCode`**. A non-zero exit arrives as `isError: true` on the `tool.call` result.
- Before you push: `bash scripts/check.sh` (strict validate + tests for every plugin). CI runs the same script.
- Never rename a published plugin. Bump `version` in both `plugin.json` and `marketplace.json` on every release, and add a `CHANGELOG.md` entry.
