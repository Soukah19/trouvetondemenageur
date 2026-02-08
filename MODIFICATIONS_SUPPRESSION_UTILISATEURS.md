# Modifications : Suppression d'utilisateurs par les admins

## Changements effectues

### 1. Interface Admin - Remplacement du bouton "Bannir" par "Supprimer"

**Fichier modifie :** `src/components/admin/AdminUserManagement.tsx`

- Le bouton rouge "Bannir" a ete remplace par "Supprimer"
- Message de confirmation detaille avec avertissement sur l'irreversibilite de l'action
- Suppression complete de l'utilisateur et de toutes ses donnees associees

### 2. Fonction Edge amelioree pour suppression complete

**Fichier modifie :** `supabase/functions/delete-auth-user/index.ts`

La fonction supprime maintenant toutes les donnees associees selon le type d'utilisateur :

#### Pour les demenageurs :
- Notifications
- Messages
- Reviews
- Devis
- Transactions
- Disponibilites
- Camions
- Badges
- Portfolio photos
- Documents de verification
- Profil demenageur
- Compte auth

#### Pour les clients :
- Notifications
- Messages
- Reviews
- Paiements
- Favoris
- Signatures electroniques
- Checklists
- Devis lies aux demandes
- Demandes de devis
- Profil client
- Compte auth

## Utilisation

1. L'admin se connecte au dashboard admin
2. Va dans "Gestion des Utilisateurs"
3. Selectionne un ou plusieurs utilisateurs (clients ou demenageurs)
4. Clique sur le bouton rouge "Supprimer"
5. Confirme l'action dans la boite de dialogue d'avertissement
6. Les utilisateurs et toutes leurs donnees sont supprimes definitivement

## Avertissements importants

- ⚠️ **Action irreversible** : Une fois supprime, un utilisateur ne peut pas etre restaure
- ⚠️ **Suppression complete** : Toutes les donnees associees sont supprimees (devis, paiements, messages, etc.)
- ⚠️ **Impact sur les historiques** : Les devis et transactions lies a cet utilisateur seront supprimes

## Securite

- Seuls les admins ont acces a cette fonctionnalite
- Message de confirmation obligatoire avant suppression
- Utilisation d'une fonction edge securisee avec service role key
- Logs detailles dans la console Supabase pour audit

## Deploiement de la fonction edge

Pour deployer la fonction edge amelioree, executez dans le terminal :

```bash
npx supabase functions deploy delete-auth-user
```

Ou utilisez l'interface Supabase pour deployer la fonction.
