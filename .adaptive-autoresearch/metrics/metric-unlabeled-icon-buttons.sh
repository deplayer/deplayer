#!/bin/bash
# Counts icon-only buttons without aria-label or title
python3 -c "
import re, glob

count = 0
for f in sorted(glob.glob('src/**/*.tsx', recursive=True)):
    if '__tests__' in f or '.spec.' in f or '.test.' in f:
        continue
    lines = open(f).readlines()
    for i, line in enumerate(lines):
        if '<Icon' not in line:
            continue
        # Check surrounding context (8 lines before and after)
        context = ''.join(lines[max(0,i-8):min(len(lines),i+9)])
        if 'onClick' not in context and '<Button' not in context:
            continue
        if 'aria-label' in context or 'title=' in context:
            continue
        if '<Translate' in context or 'Translate ' in context:
            continue
        count += 1
print(count)
"
