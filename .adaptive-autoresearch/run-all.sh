#!/bin/bash
# Run all metric scripts and output JSON
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")" || exit 1

echo "{"
first=true
for script in "$SCRIPT_DIR"/metrics/metric-*.sh; do
  name=$(basename "$script" .sh | sed 's/^metric-//')
  value=$(bash "$script" 2>/dev/null)
  exit_code=$?
  if [ $exit_code -ne 0 ] || [ -z "$value" ]; then
    value="null"
  fi
  if [ "$first" = true ]; then first=false; else echo ","; fi
  printf '  "%s": %s' "$name" "$value"
done
echo ""
echo "}"
