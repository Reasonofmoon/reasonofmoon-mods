# Contributing

Thanks for helping make agents easier to check.

## Report a false positive or a miss

This is the most useful contribution. Open an issue with:

1. the exact command Claude ran,
2. its output (trimmed is fine, but keep the line that matters),
3. what the mod did (`/silent-failure last`) and what it should have done.

A miss on a `high` rule, or a flag on text that contains no failure, is a bug.

## Develop a mod

```bash
git clone https://github.com/Reasonofmoon/reasonofmoon-mods.git && cd reasonofmoon-mods
claude --plugin-dir ./plugins/silent-failure     # hot-reloads as you edit
bash scripts/check.sh                            # strict validate + tests, as CI does
```

- Claude Code **2.1.287+**. Loading a mod with `--plugin-dir` writes this build's types into `.claude-plugin/types/`; use them.
- One behavior, one test in `plugins/<name>/tests/*.test.ts` (`claude-code/testing`, with `mock.clock` / `mock.store` when the hook uses them).
- New mod: add `plugins/<name>/`, list it in `.claude-plugin/marketplace.json`, add a row to the README table and `docs/ROADMAP.md`.

## Release

1. Bump `version` in `plugins/<name>/.claude-plugin/plugin.json` **and** the marketplace entry.
2. Add a `CHANGELOG.md` entry with the evidence (validate, tests, a real run if behavior changed).
3. `bash scripts/check.sh`, then push. Users get it with `claude plugin update <name>@reasonofmoon-mods`.

Images: edit `docs/src/*.html`, then `node scripts/render-assets.mjs` (Playwright + Chromium).
