#!/bin/bash
# Counts dangerouslySetInnerHTML usage
grep -rn --include="*.tsx" --include="*.ts" \
  "dangerouslySetInnerHTML" \
  src/ \
  | wc -l
