# 📋 Workflow Complet: Déménagement avec Vérification

## Vue d'Ensemble du Flux Idéal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: AVANT LE DÉMÉNAGEMENT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Client crée une demande de devis                                        │
│  2. Client upload photos de ses meubles (optionnel)                         │
│  3. Déménageur envoie un devis                                              │
│  4. Client accepte et paie l'acompte (30%)                                  │
│  5. Messagerie débloquée ✅                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: JOUR DU DÉMÉNAGEMENT                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📸 PHOTOS AVANT CHARGEMENT (Déménageur)                                    │
│  ├── Prend photos de chaque meuble AVANT chargement                         │
│  ├── IA analyse chaque photo pour détecter dommages préexistants           │
│  └── Si dommage détecté → Client notifié immédiatement                     │
│                                                                             │
│  🚚 TRANSPORT                                                               │
│                                                                             │
│  📸 PHOTOS APRÈS DÉCHARGEMENT (Déménageur)                                  │
│  ├── Prend photos de chaque meuble APRÈS déchargement                       │
│  ├── IA compare AVANT/APRÈS pour détecter nouveaux dommages                │
│  └── Si nouveau dommage → Responsabilité établie automatiquement           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3: FIN DE MISSION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👷 DÉMÉNAGEUR:                                                             │
│  └── Clique "Déclarer fin de mission"                                       │
│      └── Génère automatiquement la lettre de mission                       │
│                                                                             │
│  👤 CLIENT (dans les 48h):                                                  │
│  ├── Reçoit notification                                                    │
│  ├── Voit la lettre de mission                                              │
│  ├── Voit récap des photos AVANT/APRÈS                                      │
│  ├── Peut signaler un dommage s'il en trouve                               │
│  ├── Ajoute commentaires (optionnel)                                        │
│  └── SIGNE électroniquement                                                │
│                                                                             │
│  🤖 IA ANALYSE:                                                             │
│  ├── Signature client présente?                                             │
│  ├── Commentaires négatifs?                                                 │
│  ├── Dommages signalés?                                                     │
│  └── Calcule niveau de risque                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 4: DÉBLOCAGE PAIEMENT                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Si risque FAIBLE + signature OK:                                           │
│  └── Auto-approuvé → Escrow libéré au déménageur                           │
│                                                                             │
│  Si risque ÉLEVÉ ou dommages signalés:                                      │
│  └── Admin vérifie manuellement → Décision finale                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Ce Qui EXISTE Déjà

### ✅ Composants Existants

| Composant | Fichier | Fonction |
|-----------|---------|----------|
| Signature Électronique | `src/components/ElectronicSignature.tsx` | Canvas pour signer avec doigt/souris |
| Photos Déménageur | `src/pages/MoverDamagePhotos.tsx` | Upload photos avant/après |
| Rapport Dommage Client | `src/pages/DamageReport.tsx` | Client compare photos et signale dommage |
| Analyse IA Dommages | `supabase/functions/analyze-damage-photo` | Analyse photo avec GPT-4 Vision |
| Analyse IA Mission | `supabase/functions/analyze-mission-letter` | Analyse lettre de mission |
| Fin de Mission | `src/components/MissionCompletionButton.tsx` | Bouton déménageur |
| Admin Déblocages | `src/components/admin/AdminPaymentReleasePanel.tsx` | Panel validation admin |

### ❌ Ce Qui MANQUE

| Élément Manquant | Impact |
|------------------|--------|
| **Page Client pour Valider la Mission** | Le client ne peut pas signer! |
| **Notification au Client** | Le client ne sait pas qu'il doit valider |
| **Lien entre Photos et Mission** | Les photos ne sont pas montrées dans la validation |
| **Comparaison IA AVANT/APRÈS** | Pas de comparaison automatique |
| **Délai 48h automatique** | Pas de timeout si client ne répond pas |

---

## 🛠️ Corrections à Faire

### 1. Créer la Page de Validation Client

**Nouveau fichier:** `src/pages/ClientMissionValidation.tsx`

Cette page permettra au client de:
- Voir la lettre de mission
- Voir les photos AVANT/APRÈS côte à côte
- Ajouter des commentaires
- Signaler des dommages
- Signer électroniquement

### 2. Modifier le Flux de Fin de Mission

Quand le déménageur clique "Fin de mission":
1. ✅ Créer une entrée `mission_validations`
2. ✅ Envoyer notification au client
3. ✅ Client a 48h pour valider
4. ✅ Si pas de réponse → Auto-validation

### 3. Ajouter Comparaison Photos IA

Créer une fonction qui:
1. Prend une photo AVANT et une photo APRÈS
2. Les envoie à GPT-4 Vision
3. Détecte les différences/dommages

### 4. Functions Edge à Déployer

```bash
# 1. Analyse de la lettre de mission
supabase functions deploy analyze-mission-letter

# 2. Analyse des photos de dommages
supabase functions deploy analyze-damage-photo

# 3. (À créer) Comparaison avant/après
supabase functions deploy compare-before-after-photos
```

---

## 📊 Schéma Base de Données Nécessaire

### Table `mission_validations` (À CRÉER)

```sql
CREATE TABLE mission_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id),
  quote_request_id uuid REFERENCES quote_requests(id),
  
  -- Statut
  status text DEFAULT 'pending', -- pending, validated, disputed
  
  -- Côté Déménageur
  mover_declared_at timestamptz,
  mission_letter_content text,
  
  -- Côté Client
  client_viewed_at timestamptz,
  client_comments text,
  client_signature_data text, -- Base64 de la signature
  client_signed_at timestamptz,
  client_reported_damage boolean DEFAULT false,
  
  -- Photos associées
  before_photos jsonb, -- [{id, url, ai_analysis}]
  after_photos jsonb,  -- [{id, url, ai_analysis}]
  
  -- Analyse IA
  ai_comparison_result jsonb,
  ai_risk_level text, -- low, medium, high
  
  -- Auto-validation
  auto_validate_at timestamptz, -- Date limite (48h après mover_declared_at)
  auto_validated boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 🚀 Plan d'Action

### Étape 1: Déployer les Functions (Immédiat)

```bash
supabase functions deploy analyze-mission-letter
supabase functions deploy analyze-damage-photo
```

### Étape 2: Créer la Table `mission_validations`

Exécuter le SQL ci-dessus dans Supabase.

### Étape 3: Créer `ClientMissionValidation.tsx`

Je peux créer cette page qui:
- Affiche la lettre de mission
- Montre les photos AVANT/APRÈS
- Permet de commenter
- Permet de signer

### Étape 4: Modifier `MissionCompletionButton.tsx`

Pour:
- Créer l'entrée dans `mission_validations`
- Envoyer la notification au client
- Définir le délai de 48h

### Étape 5: Ajouter Route et Notification

- Route: `/client/validate-mission/:paymentId`
- Notification avec lien direct

---

## ❓ Questions pour Vous

1. **Voulez-vous que je crée tout ça maintenant?**

2. **Pour les photos AVANT/APRÈS:**
   - Le déménageur doit-il uploader les photos de TOUS les meubles?
   - Ou seulement ceux qui semblent endommagés?

3. **Pour le délai de 48h:**
   - Si le client ne répond pas, on auto-valide?
   - Ou on bloque jusqu'à validation admin?

4. **OpenAI API Key:**
   - Avez-vous une clé OpenAI pour l'analyse d'images?
   - Sinon, voulez-vous un mode "manuel" sans IA?
