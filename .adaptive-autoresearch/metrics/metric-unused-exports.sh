#!/bin/bash
# Count unused files reported by knip
npm run knip 2>&1 | grep -c "^src/"
