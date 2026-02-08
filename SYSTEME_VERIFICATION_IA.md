# Système de Vérification IA - Documentation Complète

## Vue d'ensemble

Le système de vérification IA analyse automatiquement tous les documents et informations des déménageurs pour détecter les incohérences, vérifier les dates de validité et détecter les fraudes potentielles.

---

## Architecture du système

### 1. Base de données

#### Table `verification_reports`
Stocke les rapports complets de vérification IA.

```sql
CREATE TABLE verification_reports (
  id uuid PRIMARY KEY,
  mover_id uuid REFERENCES movers(id),
  report_data jsonb,              -- Données complètes du rapport
  status text,                    -- verified / needs_review / rejected
  score integer,                  -- Score de 0 à 100
  created_at timestamptz
);
```

#### Champs ajoutés à la table `movers`
```sql
-- Dates d'expiration des documents
kbis_expiration_date date
insurance_expiration_date date
identity_expiration_date date
transport_license_expiration_date date

-- Dates de vérification
last_verification_date timestamptz
next_verification_due date
```

#### Fonction PostgreSQL
```sql
get_expiring_documents(days_threshold integer)
```
Retourne tous les documents qui expirent dans X jours.

---

## 2. Edge Functions

### 2.1 `comprehensive-mover-verification`

**Rôle** : Effectue une vérification complète de tous les documents et informations d'un déménageur.

**Endpoint** :
```
POST /functions/v1/comprehensive-mover-verification
```

**Paramètres** :
```json
{
  "moverId": "uuid"
}
```

**Vérifications effectuées** :

#### ✅ KBIS
- ✓ Date d'émission (< 3 mois)
- ✓ Comparaison SIRET saisi vs extrait
- ✓ Comparaison nom entreprise saisi vs KBIS
- ✓ Comparaison nom gérant saisi vs KBIS
- ⚠️ Alerte si expire dans moins de 30 jours

**Algorithme** :
```javascript
// Vérifier âge du KBIS
const kbisAge = (Date.now() - issueDate) / (1000 * 60 * 60 * 24);
if (kbisAge > 90) {
  // CRITIQUE : KBIS expiré
  severity = 'critical';
} else if (kbisAge > 60) {
  // WARNING : Expire bientôt
  createExpirationAlert(90 - kbisAge);
}

// Comparer SIRET
if (siretSaisi !== siretKBIS) {
  // CRITIQUE : SIRET ne correspond pas
  severity = 'critical';
}

// Comparer noms (normalisation)
function normalize(text) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}
```

#### ✅ Assurance RC PRO
- ✓ Date de validité
- ⚠️ Alerte si expire dans moins de 30 jours (1 mois avant)

**Algorithme** :
```javascript
const daysUntilExpiration = (expirationDate - Date.now()) / (1000 * 60 * 60 * 24);

if (daysUntilExpiration < 0) {
  // CRITIQUE : Assurance expirée
  severity = 'critical';
} else if (daysUntilExpiration < 30) {
  // WARNING : Expire dans moins de 30 jours
  createExpirationAlert(daysUntilExpiration);
}
```

#### ✅ Pièce d'identité
- ✓ Date de validité
- ✓ Comparaison nom sur la pièce vs nom gérant saisi
- ⚠️ Alerte si expire dans moins de 60 jours

**Algorithme** :
```javascript
// Extraire les données via OCR (simulé)
const extractedData = {
  name: "Jean Dupont",
  birthDate: "01/01/1980",
  expirationDate: Date,
  documentNumber: "FR123456789"
};

// Vérifier expiration
if (daysUntilExpiration < 0) {
  severity = 'critical';
} else if (daysUntilExpiration < 60) {
  createExpirationAlert(daysUntilExpiration);
}

// Comparer nom
if (!normalize(extractedName).includes(normalize(managerName))) {
  severity = 'warning';
}
```

#### ✅ Cartes grises (camions)
- ✓ Vérification immatriculation saisie vs carte grise
- ✓ Vérification titulaire = entreprise

**Algorithme** :
```javascript
for (const truck of trucks) {
  // OCR sur la carte grise
  const extractedPlate = extractFromCard(truck.registration_card);

  if (truck.license_plate !== extractedPlate) {
    severity = 'warning';
    alert = "Immatriculation ne correspond pas";
  }

  // Vérifier titulaire
  if (!ownerOnCard.includes(companyName)) {
    severity = 'warning';
    alert = "Titulaire ne correspond pas à l'entreprise";
  }
}
```

#### ✅ Licence de transport (optionnel)
- ✓ Date de validité
- ⚠️ Alerte si expire dans moins de 30 jours

#### ✅ Détection de fraude
- ✓ SIRET déjà utilisé par un autre déménageur ?
- ✓ Email déjà utilisé ?
- ✓ Téléphone déjà utilisé ?

**Algorithme** :
```javascript
// Vérifier SIRET dupliqué
const duplicates = await supabase
  .from('movers')
  .select('id, company_name')
  .eq('siret', mover.siret)
  .neq('id', mover.id);

if (duplicates.length > 0) {
  fraudCheck.suspiciousActivity = true;
  fraudCheck.alerts.push({
    type: 'duplicate_siret',
    message: `SIRET déjà utilisé par: ${duplicates.map(d => d.company_name).join(', ')}`,
    severity: 'critical'
  });
}
```

**Calcul du score** :
```javascript
let score = 100;

// Déductions
if (kbis_expired) score -= 30;
if (insurance_expired) score -= 30;
if (identity_expired) score -= 20;
if (siret_mismatch) score -= 30;
if (name_mismatch) score -= 10;
if (truck_issue) score -= 10;
if (fraud_detected) score -= 25;

// Statut final
if (score < 50) status = 'rejected';
else if (score < 85 || alerts.length > 0) status = 'needs_review';
else status = 'verified';
```

**Réponse** :
```json
{
  "success": true,
  "report": {
    "moverId": "uuid",
    "overallStatus": "verified | needs_review | rejected",
    "score": 85,
    "checks": [
      {
        "type": "kbis",
        "passed": true,
        "message": "KBIS vérifié avec succès",
        "details": {...}
      },
      ...
    ],
    "alerts": [
      {
        "type": "siret_mismatch",
        "message": "SIRET ne correspond pas",
        "severity": "critical"
      }
    ],
    "expirationWarnings": [
      {
        "type": "insurance",
        "message": "Votre assurance expire dans 25 jours",
        "daysRemaining": 25
      }
    ]
  }
}
```

**Notifications automatiques** :
```javascript
// Si vérification réussie (score ≥ 85)
createNotification({
  user_id: null, // Pour les admins
  type: 'mover_ready_for_approval',
  title: '✅ Déménageur prêt à approuver',
  message: `${mover.company_name} a passé toutes les vérifications (Score: ${score}/100)`
});

// Si révision nécessaire (score < 85 ou alertes)
createNotification({
  user_id: null,
  type: 'mover_needs_manual_review',
  title: '⚠️ Révision manuelle nécessaire',
  message: `${mover.company_name} nécessite une vérification (Score: ${score}/100, ${alerts.length} alertes)`
});

// Alertes d'expiration
for (const warning of expirationWarnings) {
  createNotification({
    user_id: mover.user_id,
    type: 'document_expiring',
    title: '📅 Document proche de l\'expiration',
    message: warning.message
  });
}
```

---

### 2.2 `check-document-expiration`

**Rôle** : Vérifie périodiquement tous les documents et envoie des alertes automatiques.

**Endpoint** :
```
POST /functions/v1/check-document-expiration
```

**Paramètres** : Aucun (fonction système)

**Fonctionnement** :

1. Appelle `get_expiring_documents(30)` pour récupérer les documents expirant dans 30 jours
2. Groupe les documents par déménageur
3. Vérifie qu'une alerte n'a pas déjà été envoyée dans les 7 derniers jours
4. Envoie une notification au déménageur avec la liste des documents
5. Si ≥ 5 documents expirent, envoie un résumé aux admins

**Algorithme** :
```javascript
// Récupérer documents expirants
const expiringDocs = await supabase.rpc('get_expiring_documents', { days_threshold: 30 });

// Grouper par déménageur
const docsByMover = groupBy(expiringDocs, 'mover_id');

// Pour chaque déménageur
for (const [moverId, docs] of docsByMover.entries()) {
  // Vérifier alerte récente
  const recentAlert = await checkRecentAlert(moverId, 'document_expiring', 7);

  if (!recentAlert) {
    // Créer message
    const message = docs.length === 1
      ? `Votre ${docs[0].document_type} expire dans ${docs[0].days_remaining} jours`
      : `${docs.length} documents expirent bientôt:\n${listDocs(docs)}`;

    // Envoyer notification
    await createNotification({
      user_id: mover.user_id,
      type: 'document_expiring',
      title: '📅 Documents à renouveler',
      message
    });
  }
}

// Alerte admin si beaucoup de documents expirent
if (expiringDocs.length >= 5) {
  const criticalDocs = expiringDocs.filter(d => d.days_remaining <= 7);

  await sendAdminAlert({
    title: '⚠️ Alertes expiration documents',
    message: `${criticalDocs.length} documents critiques, ${expiringDocs.length} total`
  });
}
```

**Réponse** :
```json
{
  "success": true,
  "expiringDocumentsCount": 12,
  "alertsSent": {
    "movers": 8,
    "admins": 2
  }
}
```

---

## 3. Interface Admin

### 3.1 Visualiseur de documents (`AdminDocumentViewer`)

**Emplacement** : Gestion des Utilisateurs → Actions → Voir documents

**Fonctionnalités** :
- Affiche tous les documents uploadés (KBIS, assurance, identité, licence, camions)
- Statut de chaque document avec badge coloré :
  - 🟢 Valide : Document OK
  - 🟡 Expire bientôt : Moins de 30 jours
  - 🔴 Expiré : Date dépassée
  - ⚪ Manquant : Document non fourni
- Dates d'expiration visibles
- Boutons "Voir" et "Télécharger" pour chaque document
- Affichage du dernier rapport IA (score et alertes)
- Bouton "Lancer la vérification IA" pour relancer manuellement
- Section camions avec leurs cartes grises
- Section informations saisies pour comparaison

**Code clé** :
```typescript
const getDocumentStatus = (url: string | null, expirationDate: string | null) => {
  if (!url) return 'missing';
  if (!expirationDate) return 'valid';

  const daysUntilExpiration = Math.floor(
    (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration < 30) return 'expiring';
  return 'valid';
};
```

### 3.2 Tableau de bord des vérifications (`AdminVerificationAlerts`)

**Emplacement** : Dashboard Admin → Vue d'ensemble

**Statistiques affichées** :
- 🕐 **En attente** : Déménageurs avec statut "pending"
- ⚠️ **À réviser** : Rapports avec statut "needs_review"
- 📅 **Documents expirants** : Nombre de documents expirant dans 30 jours
- ✅ **Vérifiés** : Déménageurs avec statut "verified"

**Liste des documents expirants** :
- Top 10 documents les plus urgents
- Affiche : entreprise, type de document, date expiration, jours restants
- Badge coloré selon urgence :
  - 🔴 ≤ 7 jours
  - 🟡 ≤ 15 jours
  - 🟠 ≤ 30 jours

**Bouton "Vérifier expirations"** :
- Appelle manuellement `check-document-expiration`
- Affiche le nombre d'alertes envoyées

---

## 4. Flux d'inscription déménageur

### Étapes automatiques

1. **Upload documents** → Supabase Storage
2. **Création profil** → Table `movers` avec URLs des documents
3. **Création camions** → Table `trucks` avec cartes grises
4. **Vérification identité** → Fonction `verify-identity-document`
5. **Vérification complète** → Fonction `comprehensive-mover-verification`
6. **Génération rapport** → Table `verification_reports`
7. **Notifications** → Table `notifications` (admin + déménageur)

### Code d'intégration

Dans `MoverSignupPage.tsx` :

```typescript
// Après création du profil et upload des documents

// Lancer la vérification IA complète
const { data: sessionData } = await supabase.auth.getSession();
const verificationResponse = await fetch(
  `${SUPABASE_URL}/functions/v1/comprehensive-mover-verification`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ moverId: moverData.id })
  }
);

const result = await verificationResponse.json();
if (result.success) {
  const report = result.report;

  if (report.overallStatus === 'verified') {
    showToast(`Vérification réussie ! Score: ${report.score}/100`, 'success');
  } else if (report.overallStatus === 'needs_review') {
    showToast(`Documents en révision (Score: ${report.score}/100)`, 'info');
  }
}
```

---

## 5. Production : Intégration d'une vraie API IA

Le système actuel utilise des simulations. Pour la production, remplacez par :

### 5.1 API OCR recommandées

#### Google Cloud Vision API
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function extractTextFromDocument(imageUrl) {
  const [result] = await client.textDetection(imageUrl);
  const detections = result.textAnnotations;
  return detections[0]?.description;
}
```

#### AWS Textract
```javascript
const AWS = require('aws-sdk');
const textract = new AWS.Textract();

async function analyzeDocument(imageBytes) {
  const params = {
    Document: { Bytes: imageBytes },
    FeatureTypes: ['TABLES', 'FORMS']
  };

  const result = await textract.analyzeDocument(params).promise();
  return result.Blocks;
}
```

#### Azure Computer Vision
```javascript
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');

async function readDocument(imageUrl) {
  const result = await client.read(imageUrl);
  const operation = result.operationLocation.split('/').slice(-1)[0];

  let readResult;
  while (true) {
    readResult = await client.getReadResult(operation);
    if (readResult.status === 'succeeded') break;
    await sleep(1000);
  }

  return readResult.analyzeResult.readResults;
}
```

### 5.2 Intégration dans les Edge Functions

Remplacer dans `comprehensive-mover-verification/index.ts` :

```typescript
// AVANT (simulation)
async function verifyKBIS(mover: any) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const extractedData = {
    companyName: mover.company_name,
    siret: mover.siret || '12345678901234',
    // ...
  };
}

// APRÈS (production avec Google Vision)
import vision from '@google-cloud/vision';

async function verifyKBIS(mover: any) {
  const client = new vision.ImageAnnotatorClient({
    credentials: JSON.parse(Deno.env.get('GOOGLE_VISION_CREDENTIALS')!)
  });

  // Télécharger l'image du KBIS
  const imageResponse = await fetch(mover.kbis_document_url);
  const imageBytes = await imageResponse.arrayBuffer();

  // OCR
  const [result] = await client.documentTextDetection({
    image: { content: Buffer.from(imageBytes).toString('base64') }
  });

  const fullText = result.fullTextAnnotation?.text;

  // Extraire les informations avec regex
  const siretMatch = fullText?.match(/SIRET\s*:\s*(\d{14})/);
  const companyNameMatch = fullText?.match(/Dénomination\s*:\s*(.+)/);
  const dateMatch = fullText?.match(/Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/);

  const extractedData = {
    companyName: companyNameMatch?.[1].trim(),
    siret: siretMatch?.[1],
    issueDate: dateMatch?.[1],
  };

  // Continuer les vérifications...
}
```

---

## 6. Sécurité et confidentialité

### RLS (Row Level Security)

Toutes les tables sensibles ont des policies :

```sql
-- Movers peuvent voir leurs propres rapports
CREATE POLICY "Movers can view own verification reports"
  ON verification_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = verification_reports.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all verification reports"
  ON verification_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
```

### Storage Security

```sql
-- Identity documents : uniquement le propriétaire et les admins
CREATE POLICY "Users can view own identity documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'identity-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  );
```

---

## 7. Monitoring et logs

### Logs des vérifications

Tous les rapports sont stockés dans `verification_reports` avec :
- Score
- Statut
- Détails complets (JSON)
- Date

### Requêtes utiles

```sql
-- Voir les vérifications récentes
SELECT
  m.company_name,
  vr.status,
  vr.score,
  vr.created_at
FROM verification_reports vr
JOIN movers m ON m.id = vr.mover_id
ORDER BY vr.created_at DESC
LIMIT 20;

-- Voir les documents expirants
SELECT * FROM get_expiring_documents(30);

-- Statistiques globales
SELECT
  COUNT(*) FILTER (WHERE status = 'verified') as verified,
  COUNT(*) FILTER (WHERE status = 'needs_review') as needs_review,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  AVG(score) as avg_score
FROM verification_reports;
```

---

## 8. Roadmap futures améliorations

### Phase 1 : Améliorer l'IA
- ✅ Intégrer Google Cloud Vision / AWS Textract
- ✅ Détection de documents falsifiés (métadonnées images)
- ✅ Reconnaissance faciale (pièce d'identité vs photo profil)

### Phase 2 : Automatisation
- ✅ Cron job quotidien pour vérifier les expirations
- ✅ Renouvellement automatique des documents
- ✅ API tierces pour vérifier le SIRET en temps réel (API INSEE)

### Phase 3 : Machine Learning
- ✅ Modèle ML pour prédire les risques de fraude
- ✅ Scoring basé sur l'historique
- ✅ Amélioration continue du modèle

---

## Support

Pour toute question technique :
- Documentation Supabase : https://supabase.com/docs
- Documentation Google Vision : https://cloud.google.com/vision/docs
- Documentation AWS Textract : https://docs.aws.amazon.com/textract/
