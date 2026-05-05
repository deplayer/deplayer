#!/bin/bash
# Counts @ts-ignore and @ts-nocheck directives
grep -rn --include="*.ts" --include="*.tsx" \
  -E "@ts-ignore|@ts-nocheck|@ts-expect-error" \
  src/ \
  | grep -v "\.spec\.\|\.test\." \
  | wc -l
