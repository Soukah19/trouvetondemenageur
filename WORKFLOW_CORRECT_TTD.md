# 📋 Workflow Correct - TrouveTonDéménageur

## Vue d'Ensemble du Flux

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: DEMANDE DE DEVIS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👤 CLIENT:                                                                 │
│  ├── Crée une demande de devis                                              │
│  ├── Remplit les détails (adresses, date, volume, etc.)                    │
│  └── [OPTIONNEL] Upload photos des meubles                                 │
│      └── Ces photos serviront pour comparaison IA AVANT/APRÈS              │
│                                                                             │
│  📸 Photos uploadées = Possibilité de vérification IA plus tard            │
│  ❌ Pas de photos = Pas de vérification IA (validation manuelle admin)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: PROPOSITION DE DEVIS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👷 DÉMÉNAGEUR:                                                             │
│  ├── Voit la demande                                                        │
│  ├── Propose un prix                                                        │
│  └── Envoie le devis                                                        │
│                                                                             │
│  👤 CLIENT:                                                                 │
│  └── Reçoit et compare les devis                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3: ACCEPTATION + PAIEMENT                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👤 CLIENT:                                                                 │
│  ├── Accepte le devis                                                       │
│  └── Paie 40% du montant total (ACOMPTE PLATEFORME)                        │
│                                                                             │
│  💰 RÉPARTITION DU PAIEMENT:                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Client paie: 100% du montant total                                 │   │
│  │                                                                     │   │
│  │  Plateforme garde: 30% (commission service)                         │   │
│  │  Déménageur reçoit immédiatement: 60%                               │   │
│  │  Escrow (séquestre): 10% → libéré après fin de mission              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  🔔 NOTIFICATIONS ENVOYÉES:                                                 │
│  ├── ✉️ Notification in-app au déménageur: "Devis accepté!"                │
│  ├── 📧 Email au déménageur: Notification d'acceptation                    │
│  ├── 📧 Email au client: Confirmation de paiement                          │
│  └── 📄 Email aux DEUX: Contrat PDF avec tous les détails                  │
│                                                                             │
│  📄 CONTRAT PDF CONTIENT:                                                   │
│  ├── Détails de la mission (adresses, date, services)                      │
│  ├── Infos Client (nom, téléphone, email)                                  │
│  ├── Infos Déménageur (entreprise, SIRET, téléphone, email)               │
│  ├── Montant total et répartition                                          │
│  └── Conditions générales                                                  │
│                                                                             │
│  ✅ APRÈS PAIEMENT:                                                         │
│  ├── Messagerie DÉBLOQUÉE entre client et déménageur                       │
│  └── Les deux peuvent voir les coordonnées de l'autre                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 4: DÉMÉNAGEMENT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💬 Communication via messagerie intégrée                                   │
│                                                                             │
│  🚚 Le déménagement a lieu                                                  │
│                                                                             │
│  📸 [SI PHOTOS UPLOADÉES AU DÉPART]                                        │
│  └── Déménageur prend photos APRÈS livraison                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 5: FIN DE MISSION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👷 DÉMÉNAGEUR clique "Fin de Mission"                                      │
│                                    │                                        │
│                                    ▼                                        │
│                    ┌───────────────────────────────┐                        │
│                    │  Photos AVANT existent?       │                        │
│                    └───────────────────────────────┘                        │
│                           │               │                                 │
│                          OUI             NON                                │
│                           │               │                                 │
│                           ▼               ▼                                 │
│              ┌─────────────────┐  ┌─────────────────────┐                   │
│              │ IA Compare      │  │ Pas d'analyse IA    │                   │
│              │ AVANT vs APRÈS  │  │ Demande directe     │                   │
│              │                 │  │ envoyée à l'admin   │                   │
│              │ Génère rapport  │  │                     │                   │
│              └─────────────────┘  └─────────────────────┘                   │
│                           │               │                                 │
│                           ▼               ▼                                 │
│              ┌─────────────────────────────────────────┐                    │
│              │         ADMIN REÇOIT DEMANDE           │                    │
│              │                                         │                    │
│              │  Si dommages détectés par IA:          │                    │
│              │  → Admin vérifie le rapport            │                    │
│              │  → Peut retenir une partie du 10%      │                    │
│              │                                         │                    │
│              │  Si pas de dommages (ou pas de photos):│                    │
│              │  → Admin valide                        │                    │
│              │  → 10% libéré au déménageur            │                    │
│              └─────────────────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 6: PAIEMENT FINAL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Admin approuve:                                                         │
│  └── 10% escrow libéré → Versé au déménageur                               │
│                                                                             │
│  ⚠️ Admin détecte problème:                                                │
│  └── 10% retenu (total ou partiel) → Utilisé pour dédommagement           │
│                                                                             │
│  📊 RÉSUMÉ FINAL DÉMÉNAGEUR:                                                │
│  ├── Reçu immédiatement après paiement client: 60%                         │
│  └── Reçu après validation admin: 10%                                      │
│  └── TOTAL DÉMÉNAGEUR: 70% du montant client                               │
│                                                                             │
│  📊 RÉSUMÉ PLATEFORME:                                                      │
│  └── Commission: 30% du montant client                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Répartition Financière Détaillée

### Exemple: Client paie 1000€

| Destinataire | Montant | Quand | Notes |
|--------------|---------|-------|-------|
| **Plateforme** | 300€ (30%) | Immédiatement | Commission de service |
| **Déménageur** | 600€ (60%) | Immédiatement | Paiement principal |
| **Escrow** | 100€ (10%) | Bloqué | Libéré après validation admin |

### Après Fin de Mission (si tout OK):
- Déménageur reçoit les 100€ restants
- **Total déménageur: 700€ (70%)**
- **Total plateforme: 300€ (30%)**

---

## 📧 Emails à Envoyer

### 1. Email au Déménageur - Acceptation

```
Sujet: 🎉 Votre devis a été accepté!

Bonjour [Nom Entreprise],

Le client [Nom Client] a accepté votre devis pour le déménagement du [Date].

Détails de la mission:
- Départ: [Adresse départ]
- Arrivée: [Adresse arrivée]
- Date: [Date déménagement]
- Montant: [Montant]€

Vous pouvez maintenant contacter le client via la messagerie.

Voir la mission: [Lien]
```

### 2. Email au Client - Confirmation

```
Sujet: ✅ Paiement confirmé - Votre déménagement est réservé

Bonjour [Nom Client],

Votre paiement de [Montant acompte]€ a été confirmé.

Votre déménageur: [Nom Entreprise]
Date: [Date]

Vous pouvez maintenant discuter avec votre déménageur via la messagerie.

Accéder au tableau de bord: [Lien]
```

### 3. Email aux DEUX - Contrat PDF

```
Sujet: 📄 Contrat de déménagement - [Référence]

Veuillez trouver ci-joint le contrat de déménagement.

[PDF en pièce jointe]
```

---

## 📄 Contenu du Contrat PDF

```
═══════════════════════════════════════════════════════════════
                    CONTRAT DE DÉMÉNAGEMENT
                    Référence: [NUMERO]
═══════════════════════════════════════════════════════════════

DATE DU CONTRAT: [Date]

───────────────────────────────────────────────────────────────
                    PARTIES CONTRACTANTES
───────────────────────────────────────────────────────────────

CLIENT:
  Nom: [Nom complet]
  Email: [Email]
  Téléphone: [Téléphone]
  Adresse: [Adresse]

DÉMÉNAGEUR:
  Entreprise: [Nom entreprise]
  SIRET: [Numéro SIRET]
  Représentant: [Nom gérant]
  Email: [Email]
  Téléphone: [Téléphone]
  Adresse siège: [Adresse]

───────────────────────────────────────────────────────────────
                    DÉTAILS DE LA MISSION
───────────────────────────────────────────────────────────────

Date du déménagement: [Date]
Heure prévue: [Heure]

ADRESSE DE DÉPART:
  [Adresse complète]
  Étage: [Étage] | Ascenseur: [Oui/Non]

ADRESSE D'ARRIVÉE:
  [Adresse complète]
  Étage: [Étage] | Ascenseur: [Oui/Non]

VOLUME ESTIMÉ: [X] m³
TYPE DE LOGEMENT: [Type]

SERVICES INCLUS:
  ☐ Chargement/Déchargement
  ☐ Transport
  [Autres services cochés]

───────────────────────────────────────────────────────────────
                    CONDITIONS FINANCIÈRES
───────────────────────────────────────────────────────────────

Montant total TTC: [Montant]€

Acompte versé (40%): [Montant]€
Solde restant: [Montant]€ (à régler directement au déménageur)

───────────────────────────────────────────────────────────────
                    CONDITIONS GÉNÉRALES
───────────────────────────────────────────────────────────────

[Conditions générales...]

───────────────────────────────────────────────────────────────

Contrat généré automatiquement par TrouveTonDéménageur
www.trouvetondemenageur.com
```

---

## 🔧 Ce Qui Doit Être Implémenté/Corrigé

### ✅ Déjà Fonctionnel
- Demande de devis
- Upload photos meubles (optionnel)
- Proposition de devis par déménageur
- Paiement de l'acompte
- Messagerie (après paiement)

### ❌ À Implémenter/Corriger

| Fonctionnalité | Priorité | Statut |
|----------------|----------|--------|
| Correction statut paiement (trigger) | 🔴 Haute | SQL à exécuter |
| Email notification déménageur | 🔴 Haute | À vérifier |
| Génération contrat PDF | 🔴 Haute | À créer |
| Envoi contrat par email | 🔴 Haute | À créer |
| Bouton fin de mission fonctionnel | 🔴 Haute | À corriger |
| Analyse IA photos AVANT/APRÈS | 🟡 Moyenne | Edge function existe |
| Upload photos APRÈS par déménageur | 🟡 Moyenne | Existe mais à lier |
| Panel admin déblocage 10% | 🟡 Moyenne | Existe |

---

## 📁 Edge Functions à Déployer

```bash
# 1. Analyse des photos de dommages (comparaison AVANT/APRÈS)
supabase functions deploy analyze-damage-photo

# 2. Analyse de la lettre de mission
supabase functions deploy analyze-mission-letter

# 3. (Si existe) Envoi d'emails
supabase functions deploy send-notification
```

---

## ❓ Questions à Clarifier

1. **Le paiement des 60% restants:**
   - Le client paie-t-il 40% maintenant et 60% directement au déménageur le jour J?
   - Ou tout passe par la plateforme?

2. **Photos APRÈS:**
   - Le déménageur les upload dans l'app?
   - Ou le client les upload?
   - Ou les deux?

3. **Délai pour signaler un dommage:**
   - Le client a combien de temps après le déménagement pour signaler?

4. **Pas de signature électronique client?**
   - La fin de mission est déclarée uniquement par le déménageur?
   - Le client n'a pas besoin de "valider" la livraison?
