# Guide de nettoyage pour les tests

## Nettoyage Effectué le 05 Janvier 2026

### Résumé

La base de données a été complètement nettoyée pour préparer des tests propres. Tous les comptes clients et déménageurs ont été supprimés, seuls les comptes administrateurs sont conservés.

---

## État Actuel de la Base de Données

### Comptes Conservés

| Email | Rôle | Description |
|-------|------|-------------|
| admin@trouveton.fr | super_admin | Accès complet (y compris finances) |
| adminagent@trouveton.fr | admin_agent | Accès opérationnel (sans finances) |

### Données Supprimées

| Type de Données | Nombre Supprimé | Status |
|-----------------|-----------------|--------|
| Déménageurs | 2 | Supprimés |
| Clients | 2 | Supprimés |
| Demandes de devis | 1 | Supprimées |
| Devis | 1 | Supprimés |
| Paiements | 1 | Supprimés |
| Messages | Tous | Supprimés |
| Reviews | Toutes | Supprimées |
| Notifications | Toutes | Supprimées |
| Documents déménageurs | 5 | Supprimés |
| Véhicules | Tous | Supprimés |
| Contrats | Tous | Supprimés |

---

## Vérification de l'État Propre

Pour vérifier que la base est prête pour les tests, exécutez:

```sql
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM admins) as admins_count,
  (SELECT COUNT(*) FROM movers) as movers_count,
  (SELECT COUNT(*) FROM quote_requests) as quote_requests_count,
  (SELECT COUNT(*) FROM quotes) as quotes_count;
```

**Résultats Attendus**:
- total_users: 2 (les 2 admins)
- admins_count: 2
- movers_count: 0
- quote_requests_count: 0
- quotes_count: 0

---

## Vous Pouvez Maintenant Tester Sans Problème

### Tests Client

Vous pouvez créer de nouveaux comptes clients avec n'importe quel email sans risque de doublon:

- client1@test.com
- jean.dupont@example.com
- marie.martin@example.com
- etc.

### Tests Déménageur

Vous pouvez créer de nouveaux déménageurs avec n'importe quel SIRET et email:

**Exemple de données de test**:
- SIRET: 12345678901234
- Email: demenageur.test@example.com
- Entreprise: Transport Express Test

**Ou**:
- SIRET: 98765432109876
- Email: moving.company@test.fr
- Entreprise: Move It Pro

Il n'y aura AUCUNE erreur "compte déjà existant" ou "SIRET déjà utilisé".

---

## Script de Nettoyage Complet

Si vous souhaitez nettoyer à nouveau la base de données, utilisez le script SQL suivant:

```sql
-- 1. Retirer les références de clés étrangères
UPDATE quote_requests SET accepted_quote_id = NULL WHERE accepted_quote_id IS NOT NULL;

-- 2. Supprimer toutes les données liées
DELETE FROM refunds;
DELETE FROM cancellations;
DELETE FROM payments;
DELETE FROM quotes;
DELETE FROM quote_requests;
DELETE FROM reviews;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM notifications;
DELETE FROM favorites;
DELETE FROM moving_photos;
DELETE FROM damage_reports;
DELETE FROM moving_status;
DELETE FROM contracts;
DELETE FROM contract_signatures;
DELETE FROM mover_documents;
DELETE FROM trucks;
DELETE FROM mover_unavailability;
DELETE FROM mover_portfolio;
DELETE FROM mover_badges;
DELETE FROM notification_queue;
DELETE FROM accepted_moves;
DELETE FROM identity_verifications;
DELETE FROM verification_reports;
DELETE FROM inventory_items;
DELETE FROM user_checklist_items;
DELETE FROM activity_timeline;
DELETE FROM document_verifications;
DELETE FROM fraud_alerts;

-- 3. Supprimer les déménageurs
DELETE FROM movers;

-- 4. Supprimer les utilisateurs non-admin
WITH admin_user_ids AS (
  SELECT user_id FROM admins
)
DELETE FROM auth.users
WHERE id NOT IN (SELECT user_id FROM admin_user_ids);

-- 5. Vérification finale
SELECT
  'NETTOYAGE TERMINÉ' as statut,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM admins) as admins_count,
  (SELECT COUNT(*) FROM movers) as movers_count,
  (SELECT COUNT(*) FROM quote_requests) as quote_requests_count;
```

---

## Quand Utiliser Ce Nettoyage

### À Utiliser Quand:

1. Vous avez terminé une série de tests et voulez repartir à zéro
2. Vous obtenez des erreurs "duplicate key" ou "compte déjà existant"
3. Vous voulez tester des inscriptions avec les mêmes emails/SIRET
4. Vous avez créé des données de test qui ne sont plus nécessaires

### À NE PAS Utiliser:

1. En production (évidemment!)
2. Si vous voulez conserver des données de test spécifiques

---

## Avantages du Nettoyage Complet

### Avant le Nettoyage

- Erreurs "Email déjà utilisé"
- Erreurs "SIRET déjà enregistré"
- Données de test qui s'accumulent
- Confusion sur quels comptes sont valides

### Après le Nettoyage

- Base de données propre et vide (sauf admins)
- Aucune contrainte sur les emails/SIRET
- Tests reproductibles à l'identique
- Performance optimale

---

## Checklist Post-Nettoyage

Avant de commencer vos tests, vérifiez:

- [ ] Seulement 2 utilisateurs dans auth.users (les admins)
- [ ] 0 déménageurs dans movers
- [ ] 0 demandes de devis
- [ ] 0 devis
- [ ] 0 paiements
- [ ] Vous pouvez vous connecter avec admin@trouveton.fr
- [ ] Vous pouvez vous connecter avec adminagent@trouveton.fr

---

## Prochaines Étapes

Maintenant que la base est propre, vous pouvez:

1. **Tester l'inscription client**: Créer un nouveau compte client
2. **Tester l'inscription déménageur**: Créer un nouveau déménageur complet
3. **Tester le flux complet**: De la demande au paiement
4. **Vérifier les permissions admin**: Super Admin vs Admin Agent

Référez-vous à `GUIDE_DEMARRAGE_TESTS.md` pour les tests à effectuer.

---

**Dernière mise à jour**: 05 Janvier 2026
**Status**: Base de données nettoyée et prête pour les tests
