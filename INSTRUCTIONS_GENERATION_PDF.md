# Instructions pour générer les PDFs des documents juridiques

## Fichier HTML créé

Un fichier HTML compilant tous les documents juridiques a été créé :
**`documents-juridiques-pour-avocat.html`**

Ce fichier contient :
1. Conditions Générales d'Utilisation (CGU)
2. Conditions Générales de Vente (CGV)
3. Politique de Confidentialité
4. Mentions Légales

## Modifications apportées

### Commissions
- Tous les pourcentages précis (30%) ont été retirés
- Remplacés par des formulations vagues : "frais de service", "conditions tarifaires convenues"
- Mention que les montants sont communiqués individuellement aux déménageurs

### Responsabilité
- Clauses de limitation de responsabilité considérablement renforcées
- Ton plus neutre et distant
- Insistance sur le rôle exclusif d'intermédiaire technique
- Clarification que la plateforme n'est en aucun cas partie au contrat de déménagement
- Ajout de multiples clauses d'exonération de responsabilité

### Ton général
- Plus professionnel et juridique
- Moins d'engagement émotionnel
- Focus sur l'aspect technique de la plateforme
- Évite les promesses ou garanties

## Comment générer les PDFs

### Option 1 : Navigateur web (Le plus simple)
1. Ouvrez le fichier `documents-juridiques-pour-avocat.html` dans votre navigateur
2. Appuyez sur Ctrl+P (ou Cmd+P sur Mac)
3. Sélectionnez "Enregistrer au format PDF"
4. Enregistrez le fichier

### Option 2 : Outil en ligne
Utilisez un convertisseur HTML vers PDF en ligne comme :
- https://www.sejda.com/html-to-pdf
- https://pdfcrowd.com/html-to-pdf/
- https://www.ilovepdf.com/html_to_pdf

### Option 3 : Ligne de commande (si disponible)
```bash
# Avec wkhtmltopdf
wkhtmltopdf documents-juridiques-pour-avocat.html documents-juridiques.pdf

# Avec Chrome/Chromium
google-chrome --headless --disable-gpu --print-to-pdf=documents-juridiques.pdf documents-juridiques-pour-avocat.html
```

## Fichiers modifiés

Les fichiers sources suivants ont été modifiés :
1. `/src/pages/TermsOfServicePage.tsx` - CGU
2. `/src/pages/SalesTermsPage.tsx` - CGV
3. `/src/pages/PrivacyPolicyPage.tsx` - Politique de confidentialité
4. `/src/pages/LegalMentionsPage.tsx` - Mentions légales
5. `/src/pages/FAQPage.tsx` - FAQ
6. `/src/pages/AboutUsPage.tsx` - À propos

## Prochaines étapes

1. Générez le PDF à partir du fichier HTML
2. Donnez le PDF à votre avocat pour révision
3. Votre avocat pourra :
   - Vérifier que les clauses de limitation de responsabilité sont suffisantes
   - Suggérer des ajustements supplémentaires
   - Valider la conformité légale
   - Compléter les informations manquantes (adresse, SIRET, etc.)

## Important

Les documents juridiques modifiés sont beaucoup plus protecteurs pour la plateforme :
- Responsabilité limitée au strict minimum
- Clarté sur le rôle d'intermédiaire uniquement
- Pas de détails précis sur les commissions
- Ton neutre et professionnel

**Ces documents sont maintenant prêts à être examinés par un professionnel du droit.**
