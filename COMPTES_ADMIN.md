# Comptes Administrateurs Créés

Les deux comptes administrateurs ont été créés avec succès dans la plateforme TrouveTonDéménageur.

## 1. Super Administrateur (Accès Complet)

**Identifiants :**
- Email : `admin@trouveton.fr`
- Mot de passe : `123456`
- Rôle : `super_admin`

**Accès :**
- Vue d'ensemble complète avec KPI financiers
- Section Finances (revenus, escrow, commissions)
- Gestion des utilisateurs et déménageurs
- Analytiques complètes avec graphiques de revenus
- Communication, litiges, fraudes
- Paramètres système

## 2. Agent Administratif (Sans Finances)

**Identifiants :**
- Email : `adminagent@trouveton.fr`
- Mot de passe : `123456`
- Rôle : `admin_agent`

**Accès :**
- Vue d'ensemble (sans KPI financiers)
- Gestion complète des déménageurs :
  - Accepter/refuser les inscriptions
  - Approuver les comptes
  - Modifier les informations
  - Ajouter manuellement des déménageurs
- Gestion des clients et modification de leurs données
- Attribution manuelle d'offres aux déménageurs
- Acceptation manuelle des offres clients
- Analytiques (sans données financières)
- Gestion des litiges et fraudes
- **PAS D'ACCÈS** à la section Finances

## Comment Tester

1. Aller sur la page de connexion admin : `/admin`
2. Se connecter avec l'un des comptes ci-dessus
3. Explorer le dashboard selon les permissions du rôle

## Différences Visibles

### Super Admin
- Badge bleu/violet dans le header
- Onglet "Finances" visible dans le menu
- Section Finances complète avec 4 sous-sections :
  - **Vue d'ensemble** : KPI financiers (Revenu Total, Commission 30%, Escrow, Remboursements)
  - **Paiements** : Liste complète avec libération d'escrow et création de remboursements
  - **Remboursements** : Gestion des demandes (approuver, rejeter, compléter)
  - **Suivi** : Suivi en temps réel des transactions
- KPI financiers affichés dans la vue d'ensemble
- Graphiques de revenus et statistiques détaillées
- Capacité de libérer les escrows
- Gestion complète des remboursements

### Admin Agent
- Badge vert/turquoise dans le header
- Pas d'onglet "Finances" dans le menu
- KPI opérationnels uniquement (Déménageurs Actifs, Clients, Taux de Conversion)
- Analytiques sans données financières
- Message "Accès Restreint" si tentative d'accès à la section Finances
- Peut gérer les déménageurs et clients mais sans voir les aspects financiers

## Sécurité

- Les deux comptes sont protégés par RLS
- Chaque admin ne peut voir que ses propres informations
- Les actions sont enregistrées dans les logs
- Mot de passe à changer lors de la première connexion (recommandé)
