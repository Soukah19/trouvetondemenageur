-- Script de suppression du compte DROP IT
-- ID utilisateur: 969d6949-e83a-4545-aa7f-2e9f8860d3f5
-- ID mover: 981d3e80-091f-467d-8fa5-e21a53cbacc8

BEGIN;

-- 1. Supprimer les camions associés
DELETE FROM trucks WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 2. Supprimer les devis envoyés
DELETE FROM quotes WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 3. Supprimer les notifications
DELETE FROM notifications WHERE user_id = '969d6949-e83a-4545-aa7f-2e9f8860d3f5';

-- 4. Supprimer les documents de vérification
DELETE FROM document_verifications WHERE user_id = '969d6949-e83a-4545-aa7f-2e9f8860d3f5';

-- 5. Supprimer les alertes de fraude
DELETE FROM fraud_alerts WHERE flagged_user_id = '969d6949-e83a-4545-aa7f-2e9f8860d3f5';

-- 6. Supprimer les avis/reviews
DELETE FROM reviews WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 7. Supprimer les messages
DELETE FROM messages WHERE sender_id = '969d6949-e83a-4545-aa7f-2e9f8860d3f5' OR recipient_id = '969d6949-e83a-4545-aa7f-2e9f8860d3f5';

-- 8. Supprimer les photos de portfolio
DELETE FROM portfolio_photos WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 9. Supprimer les contrats
DELETE FROM contracts WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 10. Supprimer les favoris
DELETE FROM favorites WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 11. Supprimer les disponibilités
DELETE FROM mover_availability WHERE mover_id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

-- 12. Supprimer les logs d'activité
DELETE FROM activity_logs WHERE user_id = '969d6949-e83a-4545-aa7f-2e9f8860d3f5';

-- 13. Supprimer le déménageur
DELETE FROM movers WHERE id = '981d3e80-091f-467d-8fa5-e21a53cbacc8';

COMMIT;

-- Note: La suppression de l'utilisateur auth doit être faite via l'API admin
-- Utilisez la commande suivante après ce script:
-- supabase.auth.admin.deleteUser('969d6949-e83a-4545-aa7f-2e9f8860d3f5')
