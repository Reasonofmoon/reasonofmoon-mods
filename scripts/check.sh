#!/usr/bin/env bash
# Strict-validate the marketplace and every plugin, then run each plugin's tests.
# No sign-in or network needed. Exits non-zero on the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▸ marketplace"
claude plugin validate --strict . < /dev/null

for dir in plugins/*/; do
  name="$(basename "$dir")"
  echo "▸ $name · validate"
  claude plugin validate --strict "$dir" < /dev/null
  if compgen -G "$dir/tests/*.test.ts" > /dev/null; then
    echo "▸ $name · test"
    claude plugin test "$dir" < /dev/null
  fi
done
echo "✔ all checks passed"
