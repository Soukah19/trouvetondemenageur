# Nouvelles Fonctionnalités - Inscription Déménageur

## Vue d'ensemble
Toutes les fonctionnalités demandées ont été intégrées à la page d'inscription des déménageurs (MoverSignupPage) avec vérification IA et validation stricte.

---

## 1. ÉTAPE 2 - GÉRANT : Pièce d'Identité RECTO/VERSO + Vérification IA

### Fonctionnalités ajoutées
- **Upload OBLIGATOIRE du RECTO ET VERSO**
  - Deux zones d'upload distinctes (face avant et face arrière)
  - Types acceptés : Carte d'identité, Passeport, Permis de conduire
  - Formats : PDF, JPG, JPEG, PNG
  - Validation : Impossible de passer à l'étape suivante sans LES DEUX documents

### Interface utilisateur améliorée
- **Message d'information en haut** : Bandeau bleu expliquant l'obligation d'uploader recto ET verso
- **Deux zones côte à côte** (responsive sur mobile = l'une au-dessus de l'autre)
  - Zone RECTO (Face avant) : Upload du recto uniquement
  - Zone VERSO (Face arrière) : Upload du verso uniquement
- Feedback visuel distinct pour chaque document :
  - Gris par défaut
  - Rouge si erreur/manquant avec message spécifique
  - Vert avec checkmark quand uploadé
- Nom du fichier affiché après sélection

### Vérification IA automatique DOUBLE
- **Analyse par IA Edge Function** (`verify-identity-document`)
  - Analyse RECTO : Extraction nom, date de naissance, vérification authenticité
  - Analyse VERSO : Vérification authenticité, éléments de sécurité
  - **Score combiné** : Moyenne des deux scores pour plus de fiabilité
  - Authenticité globale : Les DEUX documents doivent être authentiques
  - Score de confiance (0-100%)
  - Statut : verified, pending, rejected

- **Comparaison automatique avec KBIS**
  - Compare le nom extrait (du recto) avec le nom sur le KBIS
  - Tolérance aux variations (accents, espaces, ordre)
  - Feedback visuel immédiat

### Validation stricte
- **Recto obligatoire** : Message "Le recto de la pièce d'identité est obligatoire"
- **Verso obligatoire** : Message "Le verso de la pièce d'identité est obligatoire"
- Impossible de continuer sans les deux documents
- Zone devient rouge si tentative de soumission sans document

---

## 2. ÉTAPE 3 - ENTREPRISE : Flotte de Camions

### Gestion multi-camions
- **Ajout illimité de camions**
  - Bouton "+ Ajouter un camion"
  - Possibilité de supprimer chaque camion
  - Numérotation automatique (Camion #1, #2, etc.)

### Informations par camion
- **Numéro d'immatriculation** (obligatoire)
  - Placeholder : AA-123-BB
  - Validation : ne peut pas être vide

- **Capacité en m³** (obligatoire)
  - Type : numérique avec décimales
  - Minimum : 1 m³
  - Validation : doit être > 0

- **Carte grise** (obligatoire)
  - Formats acceptés : PDF, JPG, JPEG, PNG
  - Upload individuel par camion
  - Feedback visuel (gris → vert avec checkmark)

### Validation stricte
- **Minimum 1 camion requis**
- Tous les champs doivent être remplis
- Toutes les cartes grises doivent être uploadées
- Messages d'erreur spécifiques :
  - "Veuillez ajouter au moins un camion"
  - "Numéro d'immatriculation manquant"
  - "Cubage manquant ou invalide"
  - "Carte grise manquante pour le camion [numéro]"

---

## 3. BASE DE DONNÉES

### Nouvelles tables créées

#### `trucks`
```sql
- id (uuid)
- mover_id (uuid) → référence movers(id)
- registration_number (text)
- capacity_m3 (numeric)
- registration_card_url (text)
- is_verified (boolean)
- created_at, updated_at (timestamptz)
```

#### `identity_verifications`
```sql
- id (uuid)
- mover_id (uuid) → référence movers(id)
- document_recto_url (text) - URL face avant
- document_verso_url (text) - URL face arrière
- document_type (text) : passport, id_card, driver_license
- extracted_name (text) - Nom extrait par IA
- extracted_birth_date (text)
- is_authentic (boolean)
- confidence_score (numeric 0-100)
- verification_status (text) : pending, verified, rejected
- kbis_name_match (boolean)
- verification_notes (text)
- verified_at, created_at (timestamptz)
```

#### Champs ajoutés à `movers`
```sql
- identity_verified (boolean)
- total_trucks (integer)
- total_capacity_m3 (numeric)
```

### Déclencheurs automatiques
- Mise à jour automatique de `total_trucks` et `total_capacity_m3` quand un camion est ajouté/modifié/supprimé

---

## 4. STOCKAGE SÉCURISÉ

### Buckets Supabase créés
1. **identity-documents**
   - Pour pièces d'identité des gérants (recto ET verso)
   - Accès privé uniquement

2. **truck-documents**
   - Pour cartes grises des camions
   - Accès privé uniquement

### Sécurité RLS
- Les utilisateurs ne peuvent accéder qu'à leurs propres documents
- Structure de dossiers : `/user_id/filename`
- Politiques strictes : INSERT, SELECT, UPDATE, DELETE par propriétaire uniquement

---

## 5. API IA - Edge Function

### `verify-identity-document`
- **Endpoint** : `/functions/v1/verify-identity-document`
- **Authentification** : JWT requis
- **Méthode** : POST

#### Paramètres (MODIFIÉ - Recto/Verso)
```json
{
  "documentRectoUrl": "https://...",
  "documentVersoUrl": "https://...",
  "documentType": "id_card|passport|driver_license",
  "managerName": "Jean Dupont",
  "kbisName": "ENTREPRISE DUPONT"
}
```

#### Réponse
```json
{
  "success": true,
  "verification": {
    "id": "uuid",
    "document_recto_url": "https://...",
    "document_verso_url": "https://...",
    "is_authentic": true,
    "confidence_score": 92,
    "extracted_name": "Jean Dupont",
    "kbis_name_match": true,
    "verification_status": "verified"
  },
  "analysis": {
    "isAuthentic": true,
    "confidenceScore": 92,
    "extractedName": "Jean Dupont",
    "namesMatch": true,
    "status": "verified"
  }
}
```

### Algorithme de vérification RECTO/VERSO
1. Upload du recto → Stockage sécurisé
2. Upload du verso → Stockage sécurisé
3. **Analyse IA du RECTO**
   - Extraction OCR des informations (nom, date de naissance)
   - Vérification de l'authenticité
   - Score de confiance recto
4. **Analyse IA du VERSO**
   - Vérification des éléments de sécurité
   - Authentification de la face arrière
   - Score de confiance verso
5. **Combinaison des résultats**
   - Document authentique SI recto ET verso authentiques
   - Score combiné = moyenne des deux scores
6. Comparaison nom gérant ↔ nom KBIS
7. Mise à jour du statut dans la base

---

## 6. VALIDATION COMPLÈTE

### Étape 2 - Gérant
- ✅ Email professionnel (format réel)
- ✅ Téléphone (français/européen)
- ✅ Nom et prénom
- ✅ Type de pièce d'identité (sélection)
- ✅ **RECTO pièce d'identité OBLIGATOIRE**
- ✅ **VERSO pièce d'identité OBLIGATOIRE**

### Étape 3 - Entreprise
- ✅ Email et téléphone entreprise (validation stricte)
- ✅ Adresse complète
- ✅ Au moins 1 service sélectionné
- ✅ Au moins 1 zone géographique
- ✅ **AU MOINS 1 CAMION avec :**
  - Numéro d'immatriculation
  - Capacité en m³
  - Carte grise uploadée

### Étape 4 - Documents
- ✅ KBIS obligatoire
- ✅ Attestation d'assurance obligatoire
- ✅ Licence de transport (optionnel)

---

## 7. FEEDBACK VISUEL

### Indicateurs visuels par document
- 🔴 **Rouge** : Document manquant ou erreur
- 🟢 **Vert** : Document uploadé avec succès
- ⚪ **Gris** : État neutre (en attente)

### Messages d'erreur spécifiques
- "Le recto de la pièce d'identité est obligatoire"
- "Le verso de la pièce d'identité est obligatoire"
- Toast notifications pour les erreurs globales
- Messages clairs sous chaque zone d'upload
- Scroll automatique vers les erreurs

### Bandeau d'information
- Message en bleu en haut des zones d'upload
- Explique clairement l'obligation du recto ET verso
- Mentionne l'analyse automatique IA

---

## 8. SÉCURITÉ

### Validations côté serveur
- RLS activé sur toutes les tables
- Vérification JWT pour toutes les requêtes
- Isolation des données par utilisateur
- Pas d'accès cross-user

### Protection des données
- Documents stockés de manière privée (recto ET verso)
- URLs signées pour l'accès temporaire
- Pas de données sensibles dans les URLs
- Audit trail complet (created_at, updated_at)
- Double vérification IA (recto + verso) pour plus de sécurité

---

## RÉSUMÉ DES MODIFICATIONS

### Fichiers créés/modifiés
1. Migration : `add_trucks_and_identity_verification_system.sql`
2. Migration : `create_identity_and_truck_storage_buckets.sql`
3. Migration : `add_recto_verso_identity_documents.sql` ⭐ NOUVEAU
4. Edge Function : `verify-identity-document/index.ts` (MISE À JOUR pour recto/verso)

### Fichiers modifiés
1. `src/pages/MoverSignupPage.tsx`
   - Ajout état `managerData.identity_document_recto`
   - Ajout état `managerData.identity_document_verso`
   - Ajout état `trucks[]`
   - Ajout état `identityVerificationStatus`
   - Nouvelles fonctions : `addTruck()`, `removeTruck()`, `updateTruck()`
   - **UI DOUBLE pour upload recto/verso (Étape 2)**
   - UI complète pour gestion camions (Étape 3)
   - Validations strictes sur TOUS les champs incluant recto ET verso

---

## PRÊT POUR TEST RÉEL

Toutes les fonctionnalités sont implémentées et testées :
- ✅ Build réussi sans erreurs
- ✅ Base de données configurée avec support recto/verso
- ✅ Storage buckets créés
- ✅ Edge Function déployée avec analyse double (recto + verso)
- ✅ Validations complètes (recto ET verso obligatoires)
- ✅ Interface utilisateur intuitive avec deux zones distinctes
- ✅ Feedback visuel clair pour chaque document
- ✅ Bandeau d'information explicatif

La plateforme est maintenant prête pour les tests réels avec :
- Upload de vraies pièces d'identité (RECTO + VERSO obligatoires)
- Vérification IA automatique des deux faces
- Gestion complète de la flotte de camions
- Validation stricte de tous les documents
