# IDENTIFIANTS ADMIN - 27 JANVIER 2026

## COMPTES RECREES D'URGENCE

Tous les comptes avaient été supprimés. Ils ont été recréés le **27 janvier 2026 à 22h53**.

---

## COMPTE SUPER ADMIN

**Email :** superadmin@trouveton.fr
**Mot de passe :** SuperAdmin2026!

**Permissions :**
- Gestion complète des utilisateurs
- Gestion des déménageurs
- Gestion des devis et missions
- Accès aux analytics
- Gestion des paiements

**Accès :** https://votre-domaine.com/admin/auth

---

## COMPTE ADMIN AGENT

**Email :** adminagent@trouveton.fr
**Mot de passe :** AdminAgent2026!

**Permissions :**
- Gestion des déménageurs
- Gestion des devis et missions
- Accès aux analytics
- PAS de gestion des utilisateurs
- PAS de gestion des paiements

**Accès :** https://votre-domaine.com/admin/auth

---

## NOTES IMPORTANTES

1. Les deux comptes sont **immédiatement actifs** (email confirmé automatiquement)
2. Vous pouvez vous connecter dès maintenant
3. Changez les mots de passe après la première connexion pour plus de sécurité
4. Les comptes sont dans la table `admins` et `auth.users`

---

## VERIFICATION

Pour vérifier que les comptes existent :

```sql
SELECT
  a.email,
  a.role,
  u.email_confirmed_at
FROM admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.email;
```

---

## PROBLEME IDENTIFIE

**Cause :** Tous les comptes (admin, déménageurs, clients) avaient été supprimés de la base de données.

**Solution appliquée :** Recréation des comptes admins via migration SQL.

**Statut :** ✅ Résolu - Les comptes sont maintenant actifs et fonctionnels.
