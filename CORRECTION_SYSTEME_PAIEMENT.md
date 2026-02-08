# Correction du système de paiement

## Problèmes corrigés

### 1. Statut des devis après paiement
**Problème**: Le statut des devis restait en "attente" même après paiement du client.

**Solution**:
- Ajout d'un trigger `update_quote_status_after_payment` qui met automatiquement à jour le statut du devis à 'accepted' quand le paiement est complété
- Le trigger rejette aussi automatiquement les autres devis en attente pour la même demande

### 2. Bouton "Accepter" visible après paiement
**Problème**: Le bouton "Accepter ce devis" restait visible côté client même après avoir payé.

**Solution**:
- Modification de `ClientQuotesPage.tsx` pour charger les informations de paiement
- Le bouton est maintenant masqué si un paiement a été effectué
- Affichage d'un message "Déménagement confirmé" à la place

### 3. Calculs de paiement incorrects
**Problème**: Les calculs ne correspondaient pas aux spécifications:
- Le client devait payer 40% du prix affiché
- Le déménageur devait recevoir son montant en 2 versements de 50% chacun

## Nouveau système de calcul

### Exemple détaillé
```
Prix déménageur: 1000€
Prix affiché client: 1300€ (prix déménageur + 30%)

Client paie: 520€ (40% de 1300€)

Répartition:
- Commission plateforme: 300€ (30% de 1000€)
- Montant déménageur: 220€ (520€ - 300€)
  * Versement 1 (avant): 110€ (50% de 220€) - 48h avant le déménagement
  * Versement 2 (après): 110€ (50% de 220€) - 48h après fin de mission

Solde restant: 780€ (60% de 1300€) - payé directement au déménageur le jour J
```

### Formules de calcul

```typescript
Prix client = Prix déménageur × 1.30
Acompte client = Prix client × 0.40
Commission plateforme = Prix déménageur × 0.30
Montant déménageur = Acompte client - Commission plateforme
Versement avant = Montant déménageur × 0.50
Versement après = Montant déménageur × 0.50
Solde restant = Prix client × 0.60
```

## Modifications apportées

### Base de données

#### Migration `fix_payment_system_clean_v4`
- Ajout de nouveaux champs dans `payments`:
  - `mover_price`: Prix original du déménageur
  - `escrow_amount`: Montant en séquestre (2e versement)
  - `deposit_paid_at`: Date du 1er versement
  - `escrow_released_at`: Date du 2e versement
- Fonction `calculate_payment_amounts()`: Calcule tous les montants correctement
- Fonction `create_payment_with_correct_calculations()`: Crée un paiement avec les bons calculs
- Fonction `release_mover_deposit_before_moving()`: Débloque le 1er versement 48h avant
- Trigger `update_quote_status_after_payment`: Met à jour le statut du devis automatiquement
- Mise à jour de tous les paiements existants avec les nouveaux calculs

### Frontend

#### `src/utils/marketPriceCalculation.ts`
- Correction de `calculatePriceBreakdown()` pour diviser le montant déménageur en 2 versements
- Ajout du champ `escrowAmount` dans le retour de la fonction

#### `src/pages/ClientQuotesPage.tsx`
- Chargement des informations de paiement avec les devis
- Masquage du bouton "Accepter" si un paiement a été effectué
- Affichage d'un message de confirmation si payé

#### `src/pages/ClientPaymentPage.tsx`
- Ajout du champ `mover_price` lors de la création du paiement
- Utilisation des nouveaux calculs avec `escrow_amount`

#### `src/pages/ClientPaymentSuccessPage.tsx`
- Mise à jour du message des "Prochaines étapes" pour refléter les 2 versements au déménageur:
  - Étape 2: Premier versement 48h avant le déménagement
  - Étape 3: Deuxième versement 48h après la fin
  - Étape 4: Solde restant payé le jour J

## Flux complet du paiement

### Côté Client
1. Le client accepte un devis
2. Il est redirigé vers la page de paiement
3. Il paie 40% du prix affiché (par ex: 520€ pour un prix de 1300€)
4. Le paiement est confirmé
5. Le bouton "Accepter" disparaît et un message de confirmation s'affiche
6. Le client reçoit la lettre de mission par email

### Côté Déménageur
1. Le devis passe automatiquement à "accepté"
2. Le déménageur voit le devis dans son dashboard avec le statut "Accepté"
3. Les coordonnées du client sont démasquées
4. 48h avant le déménagement: Le déménageur reçoit 110€ (1er versement)
5. Après la mission, le déménageur clique sur "Fin de mission"
6. L'IA analyse la lettre de mission
7. Le super admin approuve le déblocage
8. 48h après: Le déménageur reçoit 110€ (2e versement)
9. Le jour J: Le déménageur reçoit 780€ directement du client

## Statuts des paiements

- `pending`: En attente
- `completed`: Paiement initial complété par le client
- `deposit_released`: Premier versement débloqué (48h avant)
- `released_to_mover`: Deuxième versement débloqué (après fin de mission)
- `refunded_full`: Remboursement complet
- `refunded_partial`: Remboursement partiel

## Tests nécessaires

1. Créer une nouvelle demande de devis
2. Un déménageur soumet un devis (ex: 1000€)
3. Vérifier que le prix affiché au client est 1300€
4. Le client accepte et paie 520€
5. Vérifier que:
   - Le statut du devis passe à "accepté" côté déménageur
   - Le bouton "Accepter" disparaît côté client
   - Le paiement dans la base a:
     * `mover_price`: 1000
     * `total_amount`: 1300
     * `amount_paid`: 520
     * `platform_fee`: 300
     * `mover_deposit`: 110
     * `escrow_amount`: 110
     * `remaining_amount`: 780

## Notes importantes

- La fonction `release_mover_deposit_before_moving()` doit être appelée quotidiennement par un cron job pour débloquer automatiquement les premiers versements 48h avant les déménagements
- Le système de fin de mission gère le déblocage du 2e versement via approbation admin
- Tous les anciens paiements ont été mis à jour avec les nouveaux calculs
