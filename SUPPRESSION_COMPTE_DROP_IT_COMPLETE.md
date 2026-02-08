# Suppression Complète du Compte DROP IT

## Statut de la suppression

### ✅ Base de données (Supabase)
Le compte DROP IT a été complètement supprimé de la base de données :
- Table `movers` : ✅ Supprimé
- Table `trucks` : ✅ Supprimé
- Table `quotes` : ✅ Supprimé
- Table `notifications` : ✅ Supprimé

### ⚠️ Système d'authentification
L'utilisateur auth existe encore avec l'ID : `969d6949-e83a-4545-aa7f-2e9f8860d3f5`

Pour supprimer complètement l'utilisateur auth, vous avez 2 options :

---

## Option 1 : Suppression via Supabase Dashboard (Recommandé)

1. Connectez-vous à votre Supabase Dashboard : [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. Allez dans **Authentication** > **Users**

3. Recherchez l'email : `dropi.transport@gmail.com`

4. Cliquez sur l'utilisateur

5. Cliquez sur **Delete user**

6. Confirmez la suppression

✅ **C'est fait !** Le compte est complètement supprimé.

---

## Option 2 : Suppression via Edge Function

J'ai créé une Edge Function `delete-auth-user` pour automatiser la suppression.

### Utilisation :

```bash
curl -X POST "https://votre-projet.supabase.co/functions/v1/delete-auth-user" \
  -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "969d6949-e83a-4545-aa7f-2e9f8860d3f5"}'
```

---

## Option 3 : Ignorer et réutiliser l'email

Si l'utilisateur auth existe mais n'est plus dans la table `movers`, vous pouvez :

1. **Réutiliser le même email** pour créer un nouveau compte
2. Le système créera un nouvel utilisateur auth automatiquement
3. L'ancien utilisateur auth restera orphelin (sans données associées)

---

## Vous pouvez maintenant refaire le test !

Le compte DROP IT est supprimé de la base de données. Vous pouvez :

1. **Retourner sur la page d'inscription** : [Inscription Déménageur](https://votre-domaine/mover-signup)

2. **Créer un nouveau compte** avec les mêmes informations ou d'autres

3. **Tester toutes les nouvelles fonctionnalités** :
   - ✅ Email de bienvenue automatique
   - ✅ Analyse IA des documents
   - ✅ Fiche détaillée dans le dashboard admin
   - ✅ Score de vérification
   - ✅ Alertes pour documents expirés
   - ✅ Téléchargement des documents
   - ✅ Approbation/Rejet depuis la fiche

---

## Guide de test complet

Consultez le fichier `GUIDE_TEST_INSCRIPTION_COMPLETE.md` pour un guide détaillé étape par étape.

---

**Prêt pour un nouveau test !** 🚀
