#!/usr/bin/env python3
import os
import re

pages_dir = '/tmp/cc-agent/62557988/project/src/pages/'

# Pages qui devraient avoir un bouton retour visible
pages_needing_back = {
    'AboutUsPage.tsx': True,
    'BlogPage.tsx': True,
    'ContactPage.tsx': True,
    'FAQPage.tsx': True,
    'HelpCenterPage.tsx': True,
    'MissionPage.tsx': True,
    'MovingGuidePage.tsx': True,
    'PressPage.tsx': True,
    'PricingPage.tsx': True,
    'TechnologyPage.tsx': True,
    'ClientPaymentSuccessPage.tsx': True,
    'MoverSignupSuccess.tsx': True,
    'EmailVerificationPage.tsx': True,
}

BACK_BUTTON = '''        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>'''

for filename in pages_needing_back:
    filepath = os.path.join(pages_dir, filename)

    if not os.path.exists(filepath):
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already has a visible back button (not just logo)
    if re.search(r'<ArrowLeft.*Retour', content):
        print(f"✓ Already has back button: {filename}")
        continue

    # Ensure ArrowLeft is imported
    if 'ArrowLeft' not in content:
        # Add to existing lucide import
        content = re.sub(
            r"(import \{ )([^}]*?)( \} from 'lucide-react';)",
            r"\1\2, ArrowLeft\3",
            content
        )

    # Find where to insert the back button (after logo, before main content)
    # Look for pattern after the logo button
    pattern = r'(</button>\s*(?:<div[^>]*inset-0[^>]*>.*?</div>\s*)?<div[^>]*relative[^>]*>\s*)'

    def add_back_button(match):
        after_logo = match.group(1)
        return after_logo + '\n' + BACK_BUTTON + '\n'

    new_content = re.sub(pattern, add_back_button, content, count=1, flags=re.DOTALL)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓ Added back button: {filename}")
    else:
        print(f"⚠️  Could not add back button: {filename} (pattern not found)")

print("\n✅ Back buttons added!")
