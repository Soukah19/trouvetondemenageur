#!/usr/bin/env python3
"""
Script to fix all back buttons in pages that use onBack prop
by replacing them with navigate(-1)
"""

import os
import re

# Files to fix
files_to_fix = [
    'src/pages/AdminDashboard.tsx',
    'src/pages/BlogPage.tsx',
    'src/pages/ClientQuotePage.tsx',
    'src/pages/ClientQuotesPage.tsx',
    'src/pages/ContactPage.tsx',
    'src/pages/DamageReport.tsx',
    'src/pages/ForgotPasswordPage.tsx',
    'src/pages/HelpCenterPage.tsx',
    'src/pages/MissionPage.tsx',
    'src/pages/MoverDamagePhotos.tsx',
    'src/pages/MoverFinancesPage.tsx',
    'src/pages/MoverMovingsList.tsx',
    'src/pages/MoverMyQuotesPage.tsx',
    'src/pages/MoverQuoteRequestsPage.tsx',
    'src/pages/MoverSignupPage.tsx',
    'src/pages/MoverSignupSuccess.tsx',
    'src/pages/MovingGuidePage.tsx',
    'src/pages/MovingTracking.tsx',
    'src/pages/PressPage.tsx',
    'src/pages/PricingPage.tsx',
    'src/pages/ResendVerificationPage.tsx',
    'src/pages/TechnologyPage.tsx',
    'src/pages/FAQPage.tsx',
]

def fix_file(filepath):
    """Fix back button implementation in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Remove type definitions with onBack
    # Match: type PageProps = { onBack: () => void; ... }
    content = re.sub(
        r'type\s+\w+Props\s*=\s*\{\s*onBack:\s*\(\)\s*=>\s*void;?\s*\};?\s*\n',
        '',
        content
    )

    # 2. Remove onBack from function parameters
    # Match: export function PageName({onBack}: PageProps)
    # or: export function PageName({onBack }: PageProps)
    content = re.sub(
        r'export\s+function\s+(\w+)\(\{onBack\s*\}:\s*\w+Props\)',
        r'export function \1()',
        content
    )

    # 3. Replace onClick={onBack} with onClick={() => navigate(-1)}
    content = re.sub(
        r'onClick=\{onBack\}',
        r'onClick={() => navigate(-1)}',
        content
    )

    # 4. Make sure useNavigate is imported if navigate is used
    if 'navigate(-1)' in content or "navigate('/')" in content:
        # Check if useNavigate is already imported
        if 'useNavigate' not in content:
            # Add useNavigate to existing react-router-dom import
            if "from 'react-router-dom'" in content:
                # Find the import line
                import_match = re.search(
                    r"import\s+\{([^}]+)\}\s+from\s+'react-router-dom'",
                    content
                )
                if import_match:
                    existing_imports = import_match.group(1)
                    if 'useNavigate' not in existing_imports:
                        new_imports = existing_imports.rstrip() + ', useNavigate'
                        content = content.replace(
                            f"import {{{existing_imports}}} from 'react-router-dom'",
                            f"import {{{new_imports}}} from 'react-router-dom'"
                        )
            else:
                # Add new import line after other imports
                first_import = re.search(r'^import\s+.*$', content, re.MULTILINE)
                if first_import:
                    insert_pos = first_import.end()
                    content = content[:insert_pos] + "\nimport { useNavigate } from 'react-router-dom';" + content[insert_pos:]

        # Check if navigate const is defined
        if 'const navigate = useNavigate()' not in content:
            # Find the function body start and add navigate const
            func_match = re.search(r'export function \w+\([^)]*\)\s*\{', content)
            if func_match:
                insert_pos = func_match.end()
                content = content[:insert_pos] + '\n  const navigate = useNavigate();' + content[insert_pos:]

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
    for filepath in files_to_fix:
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed_count += 1
        else:
            print(f"✗ Not found: {filepath}")

    print(f"\n✓ Fixed {fixed_count}/{len(files_to_fix)} files")

if __name__ == '__main__':
    main()
