#!/bin/bash
# Counts explicit 'any' types in production code (excludes tests, node_modules)
grep -rn --include="*.ts" --include="*.tsx" \
  -E ": any\b|: any\[|as any\b|<any>" \
  src/ \
  | grep -v "\.spec\.\|\.test\.\|test-utils" \
  | wc -l
