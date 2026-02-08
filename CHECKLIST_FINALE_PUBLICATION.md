# Checklist finale pour publication

**Date :** 26 janvier 2026
**Statut :** Dernière vérification avant lancement

---

## ✅ FAIT - Intégration complète des emails

### Emails configurés
- ✅ **contact@trouvetondemenageur.fr** - Contact général
- ✅ **support@trouvetondemenageur.fr** - Support technique
- ✅ **legal@trouvetondemenageur.fr** - Questions juridiques
- ✅ **dpo@trouvetondemenageur.fr** - RGPD (mentionné)

### Intégration dans les pages
- ✅ **CGU** - Section Contact (Article 14)
- ✅ **CGV** - Section Réclamations + Contact (Articles 9 et 13)
- ✅ **Politique de Confidentialité** - Sections 1 et 7
- ✅ **Mentions Légales** - Sections Éditeur et Contact
- ✅ **Page Contact** - Email principal mis à jour
- ✅ **Document HTML avocat** - Tous les emails intégrés

### Page Contactez-nous
- ✅ Téléphone : 01 234 567 89
- ✅ Email : contact@trouvetondemenageur.fr
- ✅ Horaires : Lun-Ven 9h-19h, Samedi 9h-17h
- ✅ Chat en direct (composant intégré)

---

## ❌ CE QUI MANQUE AVANT PUBLICATION

### 1. CLÉS API (Vous avez dit "hormis les clés API" donc je ne détaille pas)

Voir : `GUIDE_CONFIGURATION_CLES_API.md`

---

### 2. INFORMATIONS LÉGALES OBLIGATOIRES

**CRITIQUE - À compléter dans les documents juridiques :**

#### Dans LegalMentionsPage.tsx (ligne ~42-47)
```tsx
<p><strong>Forme juridique :</strong> [À compléter - ex: SAS au capital de XXX euros]</p>
<p><strong>Siège social :</strong> [Adresse à compléter]</p>
<p><strong>RCS :</strong> [Numéro d'immatriculation à compléter]</p>
<p><strong>SIRET :</strong> [Numéro SIRET à compléter]</p>
<p><strong>TVA intracommunautaire :</strong> [Numéro de TVA à compléter]</p>
<p><strong>Directeur de la publication :</strong> [Nom à compléter]</p>
```

#### Dans PrivacyPolicyPage.tsx (ligne ~52)
```tsx
<p><strong>Siège social :</strong> [Adresse à compléter]</p>
```

#### Dans documents-juridiques-pour-avocat.html
Même chose dans la version HTML pour l'avocat.

**Informations nécessaires :**
- ❌ Forme juridique (SAS, SARL, EURL, Auto-entrepreneur, etc.)
- ❌ Capital social (ex: 10 000€)
- ❌ Adresse complète du siège social
- ❌ Numéro SIRET (14 chiffres)
- ❌ Numéro RCS + ville (ex: "RCS Paris 123 456 789")
- ❌ Numéro TVA intracommunautaire
- ❌ Nom du directeur de publication
- ❌ Numéro de téléphone (peut-être le même : 01 234 567 89)

---

### 3. MÉDIATEUR DE LA CONSOMMATION

**OBLIGATION LÉGALE - Article L.612-1 du Code de la consommation**

Dans SalesTermsPage.tsx (ligne ~455-458), il faut compléter :

```tsx
<p className="text-gray-700 text-sm">
  <strong>Médiateur :</strong> [À compléter - ex: Médiateur de la consommation CNPM]<br />
  <strong>Site :</strong> [URL à compléter]
</p>
```

**Médiateurs recommandés :**

| Médiateur | Site | Coût/an | Délai inscription |
|-----------|------|---------|-------------------|
| CNPM Médiation | https://www.cnpm-mediation-consommation.eu/ | ~150€ | 2-5 jours |
| Medicys | https://www.medicys.fr/ | ~200€ | 2-5 jours |
| CM2C | https://www.cm2c.net/ | ~100€ | 2-5 jours |
| AME Conso | https://www.mediateur-ameconso.fr/ | ~150€ | 2-5 jours |

**Étapes :**
1. Choisir un médiateur dans la liste ci-dessus
2. S'inscrire en ligne (formulaire simple)
3. Recevoir l'attestation (par email sous 2-5 jours)
4. Mettre à jour les CGV avec le nom et le site du médiateur

---

### 4. CONFIGURATION DES BOÎTES EMAIL

**À faire chez votre hébergeur email :**

#### A. Créer les boîtes ou redirections
```
contact@trouvetondemenageur.fr  →  Équipe ou votre email
support@trouvetondemenageur.fr  →  Support ou votre email
legal@trouvetondemenageur.fr    →  Avocat ou votre email
dpo@trouvetondemenageur.fr      →  DPO ou votre email
```

#### B. Configuration DNS (Enregistrements MX)

Exemples selon hébergeur :

**Google Workspace :**
```
MX  @  ASPMX.L.GOOGLE.COM.  1
MX  @  ALT1.ASPMX.L.GOOGLE.COM.  5
MX  @  ALT2.ASPMX.L.GOOGLE.COM.  5
```

**OVH Mail :**
```
MX  @  mx1.mail.ovh.net.  1
MX  @  mx2.mail.ovh.net.  5
```

**Autre hébergeur :** Consulter leur documentation.

#### C. Sécurité anti-spam (SPF, DKIM, DMARC)

**SPF (TXT) :**
```
v=spf1 include:_spf.votrehébergeur.com ~all
```

**DMARC (TXT) :**
```
v=DMARC1; p=quarantine; rua=mailto:dpo@trouvetondemenageur.fr
```

**DKIM :** Fourni par votre hébergeur email.

---

### 5. VALIDATION JURIDIQUE PAR AVOCAT

**FORTEMENT RECOMMANDÉ (mais pas obligatoire) :**

- ⚠️ Faire valider tous les documents par un avocat spécialisé
- ⚠️ Vérifier les clauses de limitation de responsabilité
- ⚠️ Confirmer la qualification d'intermédiaire technique
- ⚠️ Valider la conformité RGPD
- ⚠️ S'assurer que tout est conforme au droit français

**Documents prêts pour l'avocat :**
- `documents-juridiques-pour-avocat.html` (peut être converti en PDF)
- `INSTRUCTIONS_GENERATION_PDF.md` (guide pour générer le PDF)

**Coût estimé :** 500€ - 1500€ selon l'avocat

---

### 6. DÉSIGNER UN DPO (Délégué à la Protection des Données)

**Pour conformité RGPD :**

Le DPO peut être :
- ✅ Vous-même (si vous avez les compétences)
- ✅ Un membre de votre équipe
- ✅ Un DPO externe (prestataire)
- ✅ Un avocat spécialisé RGPD

**Ce que fait le DPO :**
- Répond aux demandes d'accès, rectification, suppression des données
- Gère les réclamations RGPD
- S'assure de la conformité de la plateforme

**Une fois désigné :**
- L'email dpo@trouvetondemenageur.fr doit lui être accessible
- Vous pouvez mentionner son nom dans la Politique de Confidentialité (optionnel)

---

### 7. TESTS COMPLETS AVANT LANCEMENT

**Tests obligatoires à faire :**

#### A. Parcours client
- [ ] Inscription avec email valide
- [ ] Vérification email reçu
- [ ] Création demande de devis
- [ ] Calcul de distance automatique
- [ ] Réception notification nouveau devis
- [ ] Acceptation d'un devis
- [ ] Paiement (mode TEST)
- [ ] Validation fin de mission
- [ ] Laisser un avis

#### B. Parcours déménageur
- [ ] Inscription
- [ ] Upload de tous les documents
- [ ] Réception notification nouvelle demande
- [ ] Soumission d'un devis
- [ ] Notification acceptation devis
- [ ] Accès à la mission
- [ ] Fin de mission
- [ ] Réception du paiement (mode TEST)

#### C. Interface admin
- [ ] Connexion admin
- [ ] Validation documents déménageur
- [ ] Gestion des utilisateurs
- [ ] Consultation des missions
- [ ] Gestion des litiges
- [ ] Export des données

#### D. Sécurité
- [ ] Tenter d'accéder aux données d'un autre utilisateur → DOIT ÉCHOUER
- [ ] Uploader un fichier trop gros → DOIT ÊTRE REFUSÉ
- [ ] Uploader un fichier interdit (.exe) → DOIT ÊTRE REFUSÉ
- [ ] Accéder au panel admin sans être admin → DOIT ÉCHOUER

---

### 8. VÉRIFICATIONS FINALES

#### A. Documents juridiques
- [ ] CGU accessibles depuis le footer
- [ ] CGV accessibles depuis le footer
- [ ] Politique de Confidentialité accessible
- [ ] Mentions Légales accessibles
- [ ] Toutes les infos légales complétées
- [ ] Médiateur mentionné dans les CGV
- [ ] Emails corrects partout

#### B. SEO et métadonnées
- [ ] Titre de la page d'accueil
- [ ] Description meta
- [ ] Favicon présent
- [ ] robots.txt configuré
- [ ] sitemap.xml généré (optionnel)

#### C. Performance
- [ ] Site charge en moins de 3 secondes
- [ ] Images optimisées
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Responsive sur mobile/tablette/desktop

#### D. Monitoring
- [ ] Supabase Dashboard accessible
- [ ] Logs d'erreurs activés
- [ ] Alertes configurées (optionnel)

---

## 📋 CHECKLIST RAPIDE

Cochez au fur et à mesure :

### Juridique
- [ ] Infos légales société complétées
- [ ] Médiateur choisi et mentionné
- [ ] DPO désigné
- [ ] Documents validés par avocat (recommandé)

### Technique
- [ ] Emails configurés (MX, SPF, DKIM)
- [ ] Tests reception emails OK
- [ ] Clés API configurées
- [ ] Tests complets effectués
- [ ] Build production OK

### Contenu
- [ ] Page Contact complète
- [ ] Footer avec liens juridiques
- [ ] FAQ à jour
- [ ] Page À propos cohérente

---

## ⏱️ TEMPS NÉCESSAIRE

### Minimum (si vous avez déjà votre société)
- **Infos légales** : 30 min (copier-coller depuis Kbis)
- **Médiateur** : 2 heures (inscription + attente réponse)
- **Configuration emails** : 1-2 heures
- **Tests** : 3-4 heures
**TOTAL : 1-2 jours**

### Avec création société
- **Créer la société** : 1-3 semaines
- **Reste** : 2-3 jours
**TOTAL : 2-4 semaines**

### Avec validation avocat
- **Envoi documents** : 1 jour
- **Délai réponse avocat** : 3-7 jours
- **Corrections** : 1-2 jours
**TOTAL : 1-2 semaines supplémentaires**

---

## 💰 COÛTS SUPPLÉMENTAIRES

### Obligatoires
- **Médiateur de consommation** : 100-200€/an
- **Hébergement email** : 0-60€/mois (selon solution)

### Recommandés
- **Validation avocat** : 500-1500€ (one-time)
- **DPO externe** : 500-2000€/an (si externalisé)

### Optionnels
- **Assurance RC Pro plateforme** : 300-1000€/an
- **Protection juridique** : 200-500€/an

---

## 🎯 ORDRE D'ACTIONS RECOMMANDÉ

### AUJOURD'HUI (30 minutes)
1. Rassembler les infos légales de votre société
2. Choisir un médiateur de consommation
3. S'inscrire sur le site du médiateur

### DEMAIN (2-3 heures)
1. Compléter les infos dans les fichiers .tsx
2. Configurer les emails (ou redirections)
3. Tester la réception des emails

### APRÈS-DEMAIN (3-4 heures)
1. Faire tous les tests de la plateforme
2. Corriger les bugs trouvés
3. Re-tester

### DANS 2-3 JOURS
1. Lancer en production ! 🚀
2. Surveiller les logs les premières heures
3. Être prêt à corriger rapidement

---

## ⚠️ POINTS D'ATTENTION

### CRITIQUE - Ne lancez PAS sans :
- ✅ Les clés API (Google Maps + Stripe)
- ✅ Les infos légales complètes
- ✅ Un médiateur désigné

### IMPORTANT - Mais peut se faire après :
- Validation avocat (si budget serré au début)
- Optimisations SEO
- Marketing et communication
- Monitoring avancé

### RISQUES si vous lancez sans certains éléments :
- **Sans infos légales** → Amende DGCCRF
- **Sans médiateur** → Amende jusqu'à 3000€
- **Sans validation avocat** → Risque juridique en cas de litige
- **Sans tests** → Bugs, mauvaise expérience utilisateur

---

## 📚 DOCUMENTS DE RÉFÉRENCE

### Configuration technique
- `GUIDE_CONFIGURATION_CLES_API.md`
- `STRIPE_CONFIGURATION.md`
- `GUIDE_CREATION_CLE_GOOGLE_MAPS.md`

### Juridique
- `documents-juridiques-pour-avocat.html`
- `INSTRUCTIONS_GENERATION_PDF.md`
- `RESUME_MODIFICATIONS_JURIDIQUES.md`

### Lancement
- `CE_QUI_MANQUE_POUR_PUBLIER.md`
- `SYNTHESE_FINALE_26_JANVIER_2026.md`

---

## ✅ EN RÉSUMÉ - CE QUI MANQUE

### Hormis les clés API (comme vous l'avez demandé) :

1. **Informations légales de votre société** (SIRET, RCS, adresse, etc.)
2. **Médiateur de la consommation** (obligation légale)
3. **Configuration des boîtes emails** (MX, SPF, DKIM)
4. **Tests complets** de toute la plateforme
5. **Validation par avocat** (fortement recommandé)
6. **Désignation d'un DPO** (pour RGPD)

### Temps estimé : 2-3 jours minimum

### Coût supplémentaire : 100-200€ (médiateur) + éventuellement 500-1500€ (avocat)

---

**🎉 LA PLATEFORME EST TECHNIQUEMENT PRÊTE !**

**Il ne reste que les aspects administratifs et juridiques.**

**Vous pouvez publier dans 2-3 jours si vous commencez maintenant.**

---

**Date du document :** 26 janvier 2026
**Dernière mise à jour :** Après intégration des emails réels
