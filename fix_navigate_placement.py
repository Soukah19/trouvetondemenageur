#!/usr/bin/env python3
import os
import re

pages_dir = '/tmp/cc-agent/62557988/project/src/pages/'
tsx_files = [f for f in os.listdir(pages_dir) if f.endswith('.tsx')]

for filename in tsx_files:
    filepath = os.path.join(pages_dir, filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix pattern: function Name({ const navigate = useNavigate(); ...
    pattern = r'(export (?:default )?function \w+\(\{)\s*const navigate = useNavigate\(\);\s*([^}]*\}[^{]*\{)'

    if re.search(pattern, content):
        print(f"Fixing {filename}...")
        content = re.sub(
            pattern,
            r'\1\2\n  const navigate = useNavigate();',
            content
        )

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ Fixed {filename}")

print("\n✅ Navigate placement fixed!")
