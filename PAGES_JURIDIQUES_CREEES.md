# Pages Juridiques de TrouveTonDemenageur

Ce document récapitule les 4 pages juridiques complètes créées pour la plateforme TrouveTonDemenageur.

## Pages créées

### 1. Mentions Légales
**URL :** `/legal/mentions`
**Fichier :** `src/pages/LegalMentionsPage.tsx`

**Contenu :**
- Identification de l'éditeur de la plateforme
- Nature de la plateforme (mise en relation uniquement)
- Informations sur l'hébergement (Vercel + Supabase)
- Services proposés
- Responsabilité et limites claires
- Propriété intellectuelle
- Protection des données
- Contact

**Points clés :**
- Insiste sur le rôle de mise en relation UNIQUEMENT
- Clarifie que nous ne sommes pas déménageurs
- Explique notre rôle de protection des utilisateurs

---

### 2. Politique de Confidentialité
**URL :** `/legal/privacy-policy`
**Fichier :** `src/pages/PrivacyPolicyPage.tsx`

**Contenu :**
- Responsable du traitement des données
- Données collectées (clients, déménageurs, admins)
- Finalités du traitement (RGPD)
- Base légale
- Destinataires des données
- Durée de conservation détaillée (tableau)
- Droits des utilisateurs (accès, rectification, effacement, etc.)
- Sécurité des données
- Cookies
- Transferts internationaux
- Contact DPO

**Points clés :**
- Conformité RGPD complète
- Transparence totale sur l'utilisation des données
- Explique le rôle de chaque prestataire (Stripe, Supabase, OpenAI, etc.)
- Protection de la confidentialité (données anonymisées avant acceptation devis)
- Tableau de conservation des données (3 à 10 ans selon le type)

---

### 3. Conditions Générales d'Utilisation (CGU)
**URL :** `/legal/terms-of-service`
**Fichier :** `src/pages/TermsOfServicePage.tsx`

**Contenu :**
- Objet et acceptation
- Définitions claires
- Description des services (ce qu'on fait et ce qu'on NE fait PAS)
- Inscription et vérification des déménageurs
- Obligations des utilisateurs (communes, clients, déménageurs)
- Fonctionnement de la plateforme (workflow complet)
- Responsabilité et limites CLAIRES
- Gestion des litiges (déclaration, médiation, remboursements)
- Interdictions
- Suspension et résiliation
- Propriété intellectuelle
- Modifications et droit applicable

**Points clés :**
- **INSISTE FORTEMENT** sur le fait qu'on est une plateforme de mise en relation
- Clarifie qu'on NE fait PAS de déménagements
- Explique qu'on n'est PAS responsables des dommages sur terrain
- Détaille notre rôle de protection (vérification docs, séquestre, médiation)
- Limite de responsabilité très claire
- Workflow complet du devis à la validation

---

### 4. Conditions Générales de Vente (CGV)
**URL :** `/legal/sales-terms`
**Fichier :** `src/pages/SalesTermsPage.tsx`

**Contenu :**
- Objet et champ d'application
- Services fournis (et NON fournis)
- Tarifs et commission (gratuit clients, 30% déménageurs)
- Processus de paiement et séquestre détaillé
- Contrat de prestation (relation directe client-déménageur)
- Annulation et remboursement (conditions précises)
- Garanties et assurances
- Facturation
- Réclamations
- Médiation et règlement des litiges
- Contact

**Points clés :**
- **RAPPEL ESSENTIEL** : plateforme de mise en relation uniquement
- Gratuit pour les clients
- Commission 30% pour déménageurs
- Explication détaillée du système de séquestre (escrow)
- Conditions d'annulation claires (>7j = 100%, 3-7j = 50%, <3j = 0%)
- Insiste sur le fait que l'assurance du déménageur couvre les dommages (pas nous)
- Limite de responsabilité : on est responsables de la mise en relation, pas de la prestation physique
- Processus de réclamation et médiation

---

## Caractéristiques communes

### Design
- Design moderne et professionnel
- Navigation claire avec bouton retour
- Structure en sections numérotées
- Encadrés colorés pour les points importants
- Icons Lucide React
- Responsive
- Logo en haut

### Couleurs utilisées
- **Bleu** : informations principales
- **Orange** : avertissements et limites de responsabilité
- **Rouge** : exclusions et interdictions
- **Vert** : protections et garanties pour utilisateurs

### Points juridiques essentiels

#### Ce que nous SOMMES :
- Une plateforme de mise en relation
- Un facilitateur de connexion
- Un système de paiement sécurisé
- Un vérificateur de documents professionnels
- Un médiateur en cas de litige

#### Ce que nous NE SOMMES PAS :
- Des déménageurs
- Des transporteurs
- Employeurs des déménageurs
- Responsables des dommages sur terrain
- Partie au contrat de prestation

#### Notre rôle de protection :
- Vérification documents obligatoires (KBIS, RC Pro, etc.)
- Système de séquestre (paiement bloqué jusqu'à validation)
- Médiation gratuite en cas de litige
- Possibilité de remboursement exceptionnel
- Suspension/exclusion des déménageurs défaillants

---

## Intégration dans la plateforme

### Routes ajoutées dans Router.tsx
```tsx
<Route path="/legal/mentions" element={<LegalMentionsPage />} />
<Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
<Route path="/legal/terms-of-service" element={<TermsOfServicePage />} />
<Route path="/legal/sales-terms" element={<SalesTermsPage />} />
```

### Liens dans le footer (LandingPage.tsx)
Les 4 liens juridiques sont accessibles depuis le footer :
- Mentions légales → `/legal/mentions`
- Politique de confidentialité → `/legal/privacy-policy`
- CGU → `/legal/terms-of-service`
- CGV → `/legal/sales-terms`
- Cookies → `/legal/privacy-policy` (redirige vers section cookies)

---

## Informations à compléter

Certaines informations nécessitent d'être remplies avec les données réelles :

### Dans les Mentions Légales :
- [ ] Forme juridique (SAS, SARL, etc.)
- [ ] Adresse du siège social
- [ ] Numéro RCS
- [ ] SIRET
- [ ] TVA intracommunautaire
- [ ] Nom du directeur de publication
- [ ] Téléphone de contact

### Dans la Politique de Confidentialité :
- [ ] Adresse du siège social
- [ ] Coordonnées DPO complètes

### Dans les CGV :
- [ ] Nom du médiateur de la consommation
- [ ] URL du médiateur

---

## Conformité juridique

Ces documents sont conformes à :
- **RGPD** (Règlement Général sur la Protection des Données)
- **Loi Informatique et Libertés**
- **Code de la consommation français**
- **Obligations de transparence des plateformes numériques**
- **Réglementation du secteur du déménagement**

---

## Recommandations

1. **Faire valider par un avocat** spécialisé en droit du numérique
2. **Compléter** les informations manquantes marquées [À compléter]
3. **Mettre à jour** les dates lors de modifications
4. **Informer les utilisateurs** par email lors de changements importants
5. **Conserver** un historique des versions des CGU/CGV
6. **Afficher clairement** lors de l'inscription que l'utilisateur accepte les CGU/CGV

---

## Contact pour questions juridiques

Les documents prévoient plusieurs adresses email :
- `contact@trouvetondemenageur.fr` - Contact général
- `legal@trouvetondemenageur.fr` - Questions juridiques
- `dpo@trouvetondemenageur.fr` - Protection des données (RGPD)
- `support@trouvetondemenageur.fr` - Support technique
- `reclamations@trouvetondemenageur.fr` - Réclamations

---

**Date de création :** 25 janvier 2026
**Dernière mise à jour :** 25 janvier 2026
