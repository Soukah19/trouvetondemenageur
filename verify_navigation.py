#!/usr/bin/env python3
import os
import re

pages_dir = '/tmp/cc-agent/62557988/project/src/pages/'
tsx_files = sorted([f for f in os.listdir(pages_dir) if f.endswith('.tsx')])

print("=" * 80)
print("VERIFICATION DU LOGO ET BOUTONS RETOUR SUR TOUTES LES PAGES")
print("=" * 80)

pages_with_logo = []
pages_without_logo = []
pages_with_back_button = []
pages_without_back_button = []

for filename in tsx_files:
    filepath = os.path.join(pages_dir, filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for logo
    has_logo = "capture_d'écran_2026-01-20_à_12.07.10.png" in content

    # Check for back button patterns
    back_patterns = [
        r'navigate\(-1\)',  # navigate(-1)
        r'navigate\(\'\/\'\)',  # navigate('/')
        r'onClick=\{.*goBack',  # goBack function
        r'onClick=\{.*history\.back',  # history.back
        r'ArrowLeft.*Retour',  # Typical back button with text
        r'<ArrowLeft',  # ArrowLeft icon (usually means back button)
    ]

    has_back = any(re.search(pattern, content) for pattern in back_patterns)

    if has_logo:
        pages_with_logo.append(filename)
    else:
        pages_without_logo.append(filename)

    if has_back:
        pages_with_back_button.append(filename)
    else:
        pages_without_back_button.append(filename)

print("\n📋 LOGO (vers page d'accueil)")
print(f"✅ Pages avec logo: {len(pages_with_logo)}/{len(tsx_files)}")
if pages_without_logo:
    print(f"❌ Pages SANS logo: {len(pages_without_logo)}")
    for page in pages_without_logo:
        print(f"   - {page}")
else:
    print("✓ TOUTES les pages ont le logo!")

print("\n📋 BOUTON RETOUR")
print(f"✅ Pages avec bouton retour: {len(pages_with_back_button)}/{len(tsx_files)}")
if pages_without_back_button:
    print(f"⚠️  Pages sans bouton retour: {len(pages_without_back_button)}")
    for page in pages_without_back_button:
        print(f"   - {page}")

print("\n" + "=" * 80)
print("PAGES À VÉRIFIER MANUELLEMENT (besoin d'un bouton retour?):")
print("=" * 80)

# Pages qui devraient probablement avoir un bouton retour
should_have_back = [
    'AboutUsPage.tsx',
    'BlogPage.tsx',
    'ContactPage.tsx',
    'FAQPage.tsx',
    'HelpCenterPage.tsx',
    'MissionPage.tsx',
    'MovingGuidePage.tsx',
    'PressPage.tsx',
    'PricingPage.tsx',
    'TechnologyPage.tsx',
]

for page in should_have_back:
    if page in pages_without_back_button:
        print(f"⚠️  {page} - Page d'information, devrait avoir un bouton retour")

print("\n✅ Vérification terminée!")
