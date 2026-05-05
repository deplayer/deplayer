#!/bin/bash
# Total JS bundle size in KB (uncompressed) from dist/
find dist/assets/ -name "*.js" -exec cat {} + 2>/dev/null | wc -c | awk '{printf "%d", $1/1024}'
