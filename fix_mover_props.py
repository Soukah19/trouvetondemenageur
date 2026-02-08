#!/usr/bin/env python3
"""
Script to fix remaining Mover pages props
"""

import os
import re

files = [
    'src/pages/MoverQuoteRequestsPage.tsx',
    'src/pages/MoverMyQuotesPage.tsx',
    'src/pages/MoverMovingsList.tsx',
    'src/pages/MoverDamagePhotos.tsx',
    'src/pages/MoverFinancesPage.tsx',
]

def fix_file(filepath):
    """Fix MoverPage props"""
    if not os.path.exists(filepath):
        print(f"✗ File not found: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Remove type definition with onBack
    content = re.sub(
        r'type\s+\w+Props\s*=\s*\{[^}]*onBack[^}]*\};\s*\n',
        '',
        content,
        flags=re.DOTALL
    )

    content = re.sub(
        r'interface\s+\w+Props\s*\{[^}]*onBack[^}]*\}\s*\n',
        '',
        content,
        flags=re.DOTALL
    )

    # Fix function signature - remove props object completely if only onBack
    content = re.sub(
        r'export default function (\w+)\(\{onBack\s*\}:\s*\w+Props\)',
        r'export default function \1()',
        content
    )

    # Fix function signature - remove onBack but keep other props
    content = re.sub(
        r'export default function (\w+)\(\{\s*onBack,\s*([^}]+)\}:\s*\w+Props\)',
        r'export default function \1({ \2 }: any)',
        content
    )

    # Only write if content changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed: {filepath}")
        return True
    else:
        print(f"- Skipped (no changes): {filepath}")
        return False

def main():
    fixed_count = 0
    for filepath in files:
        if fix_file(filepath):
            fixed_count += 1

    print(f"\n✓ Fixed {fixed_count}/{len(files)} files")

if __name__ == '__main__':
    main()
