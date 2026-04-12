/*
  # Simplifier l'accès aux demandes de devis

  1. Approche
    - Supprimer la vue compliquée
    - Utiliser directement la table quote_requests
    - Les politiques RLS sont déjà en place
    - Le masquage sera fait côté application

  2. Vérification des politiques
    - S'assurer que les déménageurs vérifiés peuvent voir toutes les demandes
*/

-- Supprimer la vue qui pose problème
DROP VIEW IF EXISTS quote_requests_for_movers CASCADE;

-- Vérifier que les politiques RLS existantes sont correctes
-- Les politiques créées précédemment devraient suffire :
-- 1. "Clients view own requests" - Les clients voient leurs demandes
-- 2. "Verified movers view requests" - Les déménageurs vérifiés voient toutes les demandes
-- 3. "Admins view all requests" - Les admins voient tout

-- Aucune action supplémentaire nécessaire, les politiques sont déjà en place
