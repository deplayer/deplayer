#!/bin/bash
# Count .map files in production build
find dist/ -name "*.map" 2>/dev/null | wc -l
