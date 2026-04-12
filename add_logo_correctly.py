#!/usr/bin/env python3
import os
import re

pages_dir = '/tmp/cc-agent/62557988/project/src/pages/'
tsx_files = [f for f in os.listdir(pages_dir) if f.endswith('.tsx')]

LOGO_BUTTON = '''<button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        <img
          src="/capture_d'écran_2026-01-20_à_12.07.10.png"
          alt="TrouveTonDemenageur"
          className="h-12 w-auto"
        />
      </button>'''

for filename in tsx_files:
    filepath = os.path.join(pages_dir, filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has logo
    if "capture_d'écran_2026-01-20_à_12.07.10.png" in content:
        print(f"✓ Logo déjà présent: {filename}")
        continue

    # Ensure useNavigate is imported
    if 'useNavigate' not in content:
        # Add import
        if "from 'react-router-dom'" in content:
            content = re.sub(
                r"import \{([^}]*)\} from 'react-router-dom';",
                lambda m: f"import {{{m.group(1)}, useNavigate}} from 'react-router-dom';",
                content
            )
        else:
            # Add new import after react import
            content = re.sub(
                r"(import .* from 'react';)",
                r"\1\nimport { useNavigate } from 'react-router-dom';",
                content,
                count=1
            )

    # Ensure navigate is declared
    if 'const navigate = useNavigate()' not in content:
        # Find function declaration
        func_match = re.search(r'(export (?:default )?function \w+[^{]*\{)', content)
        if func_match:
            insert_pos = func_match.end()
            content = content[:insert_pos] + '\n  const navigate = useNavigate();' + content[insert_pos:]

    # Find return statement and add logo button right after opening tag
    # Match: return (\n  <div ... >\n
    pattern = r'(return \(\s*<(?:div|main|section)[^>]*>\s*)\n'

    def add_logo_after_opening(match):
        opening = match.group(1)
        return opening + '\n      ' + LOGO_BUTTON + '\n'

    content = re.sub(pattern, add_logo_after_opening, content, count=1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✓ Logo ajouté: {filename}")

print("\n✅ Logos ajoutés sur toutes les pages!")
