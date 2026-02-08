# RÉSEAUX SOCIAUX ET LIENS LÉGAUX - FOOTER

## ✅ CE QUI A ÉTÉ FAIT

### 1. Réseaux Sociaux Ajoutés (dans l'ordre demandé)

Les 5 réseaux sociaux ont été ajoutés dans le footer dans cet ordre:

1. **Google** - Icône Google avec hover rouge (#red-600)
2. **Facebook** - Icône Facebook avec hover bleu (#blue-600)
3. **Instagram** - Icône Instagram avec hover rose (#pink-600)
4. **TikTok** - Icône TikTok avec hover noir (#black)
5. **X (Twitter)** - Logo X avec hover noir (#black)

**Design:**
- Fond gris foncé (#gray-800)
- Icônes grises (#gray-400) qui deviennent blanches au survol
- Animation de scale au survol (transform hover:scale-110)
- Bordures arrondies (rounded-lg)
- Taille: 40x40px (w-10 h-10)

### 2. Liens Légaux (déjà présents, vérifiés)

Les liens légaux sont déjà présents dans le footer dans cet ordre:
- Mentions légales
- Politique de confidentialité
- CGU
- CGV
- Cookies

---

## 📍 OÙ AJOUTER VOS LIENS

### Fichier à modifier: `src/pages/LandingPage.tsx`

Cherchez les lignes avec `href="#"` et remplacez-les par vos vrais liens:

### Google (ligne ~697)
```tsx
<a
  href="#"  // ← REMPLACER PAR VOTRE LIEN GOOGLE
  className="w-10 h-10 bg-gray-800 hover:bg-red-600..."
```

**Exemple:**
```tsx
href="https://www.google.com/maps/place/VotreEntreprise"
```

### Facebook (ligne ~710)
```tsx
<a
  href="#"  // ← REMPLACER PAR VOTRE LIEN FACEBOOK
  className="w-10 h-10 bg-gray-800 hover:bg-blue-600..."
```

**Exemple:**
```tsx
href="https://www.facebook.com/TrouveTonDemenageur"
```

### Instagram (ligne ~719)
```tsx
<a
  href="#"  // ← REMPLACER PAR VOTRE LIEN INSTAGRAM
  className="w-10 h-10 bg-gray-800 hover:bg-pink-600..."
```

**Exemple:**
```tsx
href="https://www.instagram.com/trouveton_demenageur"
```

### TikTok (ligne ~728)
```tsx
<a
  href="#"  // ← REMPLACER PAR VOTRE LIEN TIKTOK
  className="w-10 h-10 bg-gray-800 hover:bg-black..."
```

**Exemple:**
```tsx
href="https://www.tiktok.com/@trouveton_demenageur"
```

### X (Twitter) (ligne ~739)
```tsx
<a
  href="#"  // ← REMPLACER PAR VOTRE LIEN X
  className="w-10 h-10 bg-gray-800 hover:bg-black..."
```

**Exemple:**
```tsx
href="https://x.com/TrouveTonDem"
```

---

## 📄 LIENS LÉGAUX À COMPLÉTER

### Mentions Légales (ligne ~663)
```tsx
<a href="#" className="text-gray-500 hover:text-white transition-colors">
  Mentions légales
</a>
```

**Remplacer par:**
```tsx
<a href="/mentions-legales" className="text-gray-500 hover:text-white transition-colors">
  Mentions légales
</a>
```

### Politique de confidentialité (ligne ~667)
```tsx
<a href="#" className="text-gray-500 hover:text-white transition-colors">
  Politique de confidentialité
</a>
```

**Remplacer par:**
```tsx
<a href="/politique-confidentialite" className="text-gray-500 hover:text-white transition-colors">
  Politique de confidentialité
</a>
```

### CGU (ligne ~671)
```tsx
<a href="#" className="text-gray-500 hover:text-white transition-colors">
  CGU
</a>
```

**Remplacer par:**
```tsx
<a href="/cgu" className="text-gray-500 hover:text-white transition-colors">
  CGU
</a>
```

### CGV (ligne ~675)
```tsx
<a href="#" className="text-gray-500 hover:text-white transition-colors">
  CGV
</a>
```

**Remplacer par:**
```tsx
<a href="/cgv" className="text-gray-500 hover:text-white transition-colors">
  CGV
</a>
```

### Cookies (ligne ~679)
```tsx
<a href="#" className="text-gray-500 hover:text-white transition-colors">
  Cookies
</a>
```

**Remplacer par:**
```tsx
<a href="/cookies" className="text-gray-500 hover:text-white transition-colors">
  Cookies
</a>
```

---

## 🎨 APERÇU DU DESIGN

### Réseaux Sociaux:
```
┌─────────────────────────────────────────────┐
│                                             │
│  Suivez-nous:  [G] [f] [📷] [TT] [X]       │
│                                             │
└─────────────────────────────────────────────┘
```

- **[G]** = Google (rouge au survol)
- **[f]** = Facebook (bleu au survol)
- **[📷]** = Instagram (rose au survol)
- **[TT]** = TikTok (noir au survol)
- **[X]** = X/Twitter (noir au survol)

### Liens Légaux:
```
Mentions légales • Politique de confidentialité • CGU • CGV • Cookies
```

---

## 🔧 EXEMPLE COMPLET DE REMPLACEMENT

### Pour les réseaux sociaux:

**AVANT:**
```tsx
<a href="#" className="w-10 h-10 bg-gray-800...">
```

**APRÈS:**
```tsx
<a
  href="https://www.facebook.com/TrouveTonDemenageur"
  target="_blank"
  rel="noopener noreferrer"
  className="w-10 h-10 bg-gray-800..."
>
```

**Note:** Ajoutez `target="_blank"` et `rel="noopener noreferrer"` pour ouvrir les liens dans un nouvel onglet en toute sécurité.

### Pour les liens légaux:

**AVANT:**
```tsx
<a href="#" className="text-gray-500...">
```

**APRÈS:**
```tsx
<button onClick={() => navigate('/mentions-legales')} className="text-gray-500...">
```

Ou si vous préférez des liens externes:
```tsx
<a href="/mentions-legales" className="text-gray-500...">
```

---

## ✅ BUILD STATUS

```
✓ 1660 modules transformés
✓ Build réussi en 15.57s
✓ Aucune erreur
```

---

## 📋 CHECKLIST

Pour finaliser l'intégration:

- [ ] Remplacer le lien Google par votre profil Google Business
- [ ] Remplacer le lien Facebook par votre page Facebook
- [ ] Remplacer le lien Instagram par votre compte Instagram
- [ ] Remplacer le lien TikTok par votre compte TikTok
- [ ] Remplacer le lien X par votre compte X (Twitter)
- [ ] Créer/lier les pages légales (Mentions légales, CGU, CGV, etc.)
- [ ] Tester tous les liens
- [ ] Vérifier que les liens s'ouvrent dans un nouvel onglet

---

## 💡 CONSEILS

1. **Testez vos liens** avant de déployer en production
2. **Ajoutez target="_blank"** pour les réseaux sociaux (ouverture dans nouvel onglet)
3. **Créez les pages légales** si elles n'existent pas encore
4. **Vérifiez l'accessibilité** - les aria-label sont déjà présents
5. **Analytics**: Ajoutez des événements de tracking si vous utilisez Google Analytics

---

## 🚀 PRÊT POUR L'INTÉGRATION

Le footer est maintenant prêt avec:
- ✅ Les 5 réseaux sociaux dans l'ordre demandé
- ✅ Tous les liens légaux présents
- ✅ Design cohérent avec les captures fournies
- ✅ Animations au survol
- ✅ Accessibilité (aria-label)
- ✅ Responsive design

**Il ne reste plus qu'à ajouter vos vrais liens!**
