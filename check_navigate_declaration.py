#!/usr/bin/env python3
import os
import re

pages_dir = '/tmp/cc-agent/62557988/project/src/pages/'
tsx_files = sorted([f for f in os.listdir(pages_dir) if f.endswith('.tsx')])

print("=" * 80)
print("VERIFICATION DE LA DECLARATION DE navigate DANS CHAQUE PAGE")
print("=" * 80)

pages_with_issues = []

for filename in tsx_files:
    filepath = os.path.join(pages_dir, filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if uses navigate
    uses_navigate = 'navigate(' in content

    if not uses_navigate:
        continue

    # Check if useNavigate is imported
    has_import = 'useNavigate' in content and "from 'react-router-dom'" in content

    # Check if navigate is declared
    has_declaration = 'const navigate = useNavigate()' in content or 'const { navigate }' in content

    if uses_navigate and (not has_import or not has_declaration):
        pages_with_issues.append({
            'file': filename,
            'has_import': has_import,
            'has_declaration': has_declaration
        })
        print(f"❌ {filename}")
        if not has_import:
            print(f"   - Missing import: useNavigate")
        if not has_declaration:
            print(f"   - Missing declaration: const navigate = useNavigate()")
    else:
        print(f"✅ {filename}")

print("\n" + "=" * 80)
if pages_with_issues:
    print(f"⚠️  PROBLEMES TROUVES: {len(pages_with_issues)} pages")
    for issue in pages_with_issues:
        print(f"   - {issue['file']}")
else:
    print("✅ TOUTES LES PAGES SONT CORRECTES!")
print("=" * 80)
