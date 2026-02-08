# Système de fin de mission et déblocage des paiements

## Vue d'ensemble

Ce système permet au déménageur de déclarer la fin de sa mission, génère une analyse IA automatique de la lettre de mission, et permet aux super administrateurs d'approuver ou rejeter le déblocage du solde du déménageur.

## Flux complet

### 1. Mission en cours
- Le client accepte un devis et effectue le paiement de l'acompte
- Le statut du paiement est `completed` et le `mission_completion_status` est `in_progress`
- Les informations du client sont automatiquement démasquées pour le déménageur

### 2. Déclaration de fin de mission (Déménageur)
- Le déménageur voit un bouton **"Déclarer la fin de mission"** dans son dashboard
- Il peut télécharger la lettre de mission générée automatiquement
- En cliquant sur "Déclarer la fin de mission":
  - La lettre de mission est générée automatiquement
  - Une analyse IA est lancée pour vérifier:
    - La présence de la signature du client
    - L'absence de commentaires négatifs
    - La complétude de la lettre de mission
  - Une demande de déblocage est créée automatiquement
  - Le statut passe à `completed_pending_review`

### 3. Analyse IA automatique
L'edge function `analyze-mission-letter` vérifie:
- **Signature client**: Requis pour déblocage
- **Commentaires négatifs**: Détecte les mots-clés négatifs
- **Éléments essentiels**: Date, adresses, services
- **Niveau de risque**: Faible, Moyen ou Élevé

### 4. Approbation admin (Super Admin uniquement)
- Le super admin voit les demandes dans l'onglet **"Déblocages"**
- Chaque demande affiche:
  - Informations du déménageur et du client
  - Résultat de l'analyse IA
  - Niveau de risque
  - Montant en séquestre à débloquer
- Le super admin peut:
  - **Approuver**: Le solde est débloqué, statut devient `approved`
  - **Rejeter**: Avec raison obligatoire, statut devient `rejected`

### 5. Déblocage du paiement
Quand approuvé:
- Le `payment_status` passe à `released_to_mover`
- Le `mission_completion_status` passe à `approved`
- Les champs `release_approved_by`, `release_approved_at` et `release_notes` sont remplis
- Le déménageur peut voir le statut dans son dashboard

## Tables de base de données

### Table `payments` (nouveaux champs)
- `mission_letter_url`: URL de la lettre de mission
- `mission_completion_date`: Date de déclaration
- `mission_completion_status`: Statut (in_progress, completed_pending_review, approved, rejected)
- `ai_analysis_result`: Résultat JSON de l'analyse IA
- `release_requested_at`: Date de demande de déblocage
- `release_approved_by`: ID de l'admin qui a approuvé
- `release_approved_at`: Date d'approbation
- `release_notes`: Notes de l'admin

### Table `payment_release_requests`
- `id`: Identifiant unique
- `payment_id`: Référence au paiement
- `mover_id`: Référence au déménageur
- `requested_at`: Date de demande
- `status`: pending, approved, rejected
- `ai_analysis`: Résultat de l'analyse IA (JSON)
- `admin_notes`: Notes de l'admin
- `reviewed_by`: Admin qui a examiné
- `reviewed_at`: Date d'examen

### Vue `pending_payment_releases`
Vue enrichie qui joint toutes les informations nécessaires pour l'approbation admin.

## Fonctions de base de données

### `create_payment_release_request(p_payment_id, p_ai_analysis)`
Crée une demande de déblocage automatiquement après l'analyse IA.

### `approve_payment_release(p_request_id, p_admin_notes)`
Approuve une demande de déblocage. Réservé aux super admins.

### `reject_payment_release(p_request_id, p_admin_notes)`
Rejette une demande avec raison obligatoire. Réservé aux super admins.

## Edge Function

### `analyze-mission-letter`
Analyse la lettre de mission et crée automatiquement une demande de déblocage.

**Endpoints**: POST `/functions/v1/analyze-mission-letter`

**Request**:
```json
{
  "missionLetterContent": "Contenu de la lettre...",
  "paymentId": "uuid",
  "clientComments": "Commentaires optionnels",
  "clientSignature": true
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "isApproved": true,
    "hasNegativeComments": false,
    "hasClientSignature": true,
    "riskLevel": "low",
    "summary": "Mission terminée avec succès...",
    "recommendations": ["..."],
    "detectedIssues": []
  }
}
```

## Composants frontend

### `MissionCompletionButton`
Composant affiché dans le dashboard déménageur pour:
- Afficher le statut de la mission
- Déclarer la fin de mission
- Télécharger la lettre de mission
- Voir le résultat de l'analyse IA

### `AdminPaymentReleasePanel`
Panel admin pour:
- Voir toutes les demandes en attente
- Examiner les analyses IA
- Approuver ou rejeter les déblocages
- Ajouter des notes administratives

## Sécurité

### Row Level Security (RLS)
- Les déménageurs ne voient que leurs propres demandes
- Les admins voient toutes les demandes
- Seuls les super admins peuvent approuver/rejeter

### Fonctions SECURITY DEFINER
Les fonctions d'approbation/rejet sont sécurisées et vérifient le rôle super_admin.

## Workflow visuel

```
[Client paie] → [Mission en cours]
       ↓
[Déménageur termine] → [Clic "Fin de mission"]
       ↓
[Analyse IA automatique] → [Demande créée]
       ↓
[Super Admin examine] → [Approuve/Rejette]
       ↓
[Paiement débloqué] → [Déménageur payé]
```

## Notifications

Le déménageur est informé via son dashboard du statut:
- 🔵 En cours
- 🟡 En attente de validation
- 🟢 Approuvé
- 🔴 Rejeté

## Notes importantes

1. Seuls les **super administrateurs** peuvent approuver les déblocages
2. L'analyse IA est **automatique** et **instantanée**
3. Le système conserve un **historique complet** de toutes les décisions
4. Les notes administratives sont **traçables**
5. Le système est **sécurisé** par RLS et SECURITY DEFINER
