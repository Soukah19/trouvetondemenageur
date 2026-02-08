#!/usr/bin/env python3
"""
Script to fix all remaining prop issues in pages
"""

import os
import re

fixes = [
    {
        'file': 'src/pages/PressPage.tsx',
        'type_removal': r'type PressPageProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function PressPage\(\{onBack, onContact \}: PressPageProps\)',
                          r'export function PressPage()'),
        'replacements': [
            (r'onClick={onContact}', r"onClick={() => navigate('/contact')}"),
        ]
    },
    {
        'file': 'src/pages/HelpCenterPage.tsx',
        'type_removal': r'type HelpCenterPageProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function HelpCenterPage\(\{onBack, onContact \}: HelpCenterPageProps\)',
                          r'export function HelpCenterPage()'),
        'replacements': [
            (r'onClick={onContact}', r"onClick={() => navigate('/contact')}"),
        ]
    },
    {
        'file': 'src/pages/EmailVerificationPage.tsx',
        'type_removal': r'type EmailVerificationPageProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function EmailVerificationPage\(\{[^)]+\}: EmailVerificationPageProps\)',
                          r'export function EmailVerificationPage()'),
        'replacements': []
    },
    {
        'file': 'src/pages/ClientQuotesPage.tsx',
        'type_removal': r'type ClientQuotesPageProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function ClientQuotesPage\(\{[^)]+\}: ClientQuotesPageProps\)',
                          r'export function ClientQuotesPage()'),
        'replacements': [
            (r'onClick={() => onSelectQuote\?\.\(\)', r"onClick={() => navigate('/client/quote')"),
            (r'onSelectQuote\?\.\(\)', r"navigate('/client/quote')"),
        ]
    },
    {
        'file': 'src/pages/ClientPaymentSuccessPage.tsx',
        'type_removal': r'type ClientPaymentSuccessPageProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function ClientPaymentSuccessPage\(\{[^)]+\}: ClientPaymentSuccessPageProps\)',
                          r'export function ClientPaymentSuccessPage()'),
        'replacements': [
            (r'onClick={onContinue}', r"onClick={() => navigate('/client/dashboard')}"),
        ]
    },
    {
        'file': 'src/pages/MovingTracking.tsx',
        'type_removal': r'type MovingTrackingProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function MovingTracking\(\{[^)]+\}: MovingTrackingProps\)',
                          r'export function MovingTracking()'),
        'replacements': []
    },
    {
        'file': 'src/pages/DamageReport.tsx',
        'type_removal': r'type DamageReportProps = \{[^}]+\};\s*\n',
        'func_signature': (r'export function DamageReport\(\{[^)]+\}: DamageReportProps\)',
                          r'export function DamageReport()'),
        'replacements': []
    },
]

def fix_file(fix_config):
    """Fix a single file according to configuration"""
    filepath = fix_config['file']

    if not os.path.exists(filepath):
        print(f"✗ File not found: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Remove type definition
    if fix_config.get('type_removal'):
        content = re.sub(fix_config['type_removal'], '', content, flags=re.DOTALL)

    # Fix function signature
    if fix_config.get('func_signature'):
        old_sig, new_sig = fix_config['func_signature']
        content = re.sub(old_sig, new_sig, content)

    # Apply replacements
    for old, new in fix_config.get('replacements', []):
        content = re.sub(old, new, content)

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
    for fix_config in fixes:
        if fix_file(fix_config):
            fixed_count += 1

    print(f"\n✓ Fixed {fixed_count}/{len(fixes)} files")

if __name__ == '__main__':
    main()
