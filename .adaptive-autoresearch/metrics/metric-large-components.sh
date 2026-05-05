#!/bin/bash
# Counts component files (tsx) over 300 lines (excluding tests)
find src/ -name "*.tsx" ! -name "*.spec.*" ! -name "*.test.*" -exec wc -l {} \; \
  | awk '$1 > 300 { count++ } END { print count+0 }'
