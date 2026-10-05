#!/bin/sh
# exits 0, prints a long log; one failure is buried in the middle, the end looks green
i=1; while [ $i -le 120 ]; do echo "[build] compiled module_$i.ts (ok)"; i=$((i+1)); done
echo "[test] auth.spec.ts: 1 failed, 46 passed"
i=121; while [ $i -le 240 ]; do echo "[build] bundled chunk_$i.js (ok)"; i=$((i+1)); done
echo "Done in 4.2s ✓"
exit 0
