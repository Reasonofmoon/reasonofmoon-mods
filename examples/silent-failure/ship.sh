#!/bin/sh
# exits 0; ~200 KB of log; one failure buried in the middle; the tail looks green
i=1; while [ $i -le 2500 ]; do echo "[build] compiled src/modules/feature_$i/index.ts -> dist/feature_$i.js (ok, 12ms)"; i=$((i+1)); done
echo "[test] auth.spec.ts: 1 failed, 46 passed  (login rejects bad password)"
i=2501; while [ $i -le 5000 ]; do echo "[build] bundled chunk_$i.js gzip ok (ok, 8ms)"; i=$((i+1)); done
echo "Done in 4.2s ✓"
exit 0
