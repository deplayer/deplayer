#!/bin/bash
# Counts Icon components used in buttons/clickable elements without aria-label or title
# Heuristic: find <Button or onClick containing <Icon without aria-label/title nearby
grep -rn --include="*.tsx" -B2 -A2 "<Icon" src/ \
  | grep -E "onClick|<Button" \
  | grep -v "aria-label\|title=\|aria-hidden" \
  | wc -l
