#!/bin/bash
# Counts total react-doctor diagnostics (errors + warnings) via JSON output.
# Excludes test files from the count to focus on production code.
npx --yes react-doctor@0.1.6 --json --offline 2>/dev/null \
  | python3 -c "
import sys, json

data = json.load(sys.stdin)
if data.get('error'):
    print(9999)  # Tool failed; signal error state
    sys.exit(0)

total = 0
for project in data.get('projects', []):
    for diag in project.get('diagnostics', []):
        # Skip test/e2e files — they're not production code
        fp = diag.get('filePath', '')
        if '/__tests__/' in fp or '/node_modules/' in fp:
            continue
        if fp.endswith(('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')):
            continue
        total += 1

print(total)
"
