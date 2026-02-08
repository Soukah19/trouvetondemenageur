# Guide d'Import de Contacts

Ce guide explique comment importer des contacts clients et déménageurs dans la plateforme via des fichiers Excel ou CSV.

## Accès à la fonctionnalité

**Réservé aux Super Admins uniquement**

1. Connectez-vous au Dashboard Admin
2. Allez dans la section "Utilisateurs"
3. Cliquez sur le bouton orange "Importer" en haut à droite

## Formats de fichiers supportés

- Excel (.xlsx, .xls)
- CSV (.csv)

## Format des données

### Import de Clients

Pour importer des contacts clients, votre fichier Excel/CSV doit contenir les colonnes suivantes:

| Colonne (obligatoire/optionnel) | Nom dans Excel | Description |
|----------------------------------|----------------|-------------|
| **Email** (obligatoire) | `email` | Adresse email du client |
| Nom (optionnel) | `nom` | Nom complet du client |
| Téléphone (optionnel) | `telephone` | Numéro de téléphone |

#### Exemple de fichier Excel pour clients:

| email | nom | telephone |
|-------|-----|-----------|
| jean.dupont@example.com | Jean Dupont | +33 6 12 34 56 78 |
| marie.martin@example.com | Marie Martin | 06 98 76 54 32 |
| pierre.durand@example.com | Pierre Durand | 0612345678 |

**Variantes acceptées pour les noms de colonnes:**
- Email: `email`, `Email`, `EMAIL`
- Nom: `nom`, `name`, `Nom`, `Name`
- Téléphone: `telephone`, `phone`, `Telephone`, `Phone`

### Import de Déménageurs

Pour importer des contacts déménageurs, votre fichier Excel/CSV doit contenir les colonnes suivantes:

| Colonne (obligatoire/optionnel) | Nom dans Excel | Description |
|----------------------------------|----------------|-------------|
| **Email** (obligatoire) | `email` | Adresse email professionnel |
| **Entreprise** (obligatoire) | `entreprise` | Nom de l'entreprise |
| SIRET (optionnel) | `siret` | Numéro SIRET |
| Prénom (optionnel) | `prenom` | Prénom du gérant |
| Nom (optionnel) | `nom` | Nom du gérant |
| Téléphone (optionnel) | `telephone` | Numéro de téléphone |
| Adresse (optionnel) | `adresse` | Adresse complète |
| Ville (optionnel) | `ville` | Ville |
| Code Postal (optionnel) | `code_postal` | Code postal |

#### Exemple de fichier Excel pour déménageurs:

| email | entreprise | siret | prenom | nom | telephone | adresse | ville | code_postal |
|-------|------------|-------|---------|-----|-----------|---------|-------|-------------|
| contact@demenagement-paris.fr | Déménagement Paris | 12345678900012 | Jean | Dupont | 01 23 45 67 89 | 10 rue de la Paix | Paris | 75001 |
| info@transports-lyon.fr | Transports Lyon Express | 98765432100098 | Marie | Martin | 04 12 34 56 78 | 25 avenue Victor Hugo | Lyon | 69002 |

**Variantes acceptées pour les noms de colonnes:**
- Email: `email`, `Email`, `EMAIL`
- Entreprise: `entreprise`, `company_name`, `Entreprise`, `Nom Entreprise`
- SIRET: `siret`, `SIRET`, `Siret`
- Prénom: `prenom`, `firstname`, `Prenom`, `Prénom`
- Nom: `nom`, `lastname`, `Nom`
- Téléphone: `telephone`, `phone`, `Telephone`, `Phone`
- Adresse: `adresse`, `address`, `Adresse`
- Ville: `ville`, `city`, `Ville`
- Code Postal: `code_postal`, `postal_code`, `Code Postal`

## Processus d'import

1. **Préparez votre fichier**
   - Créez un fichier Excel ou CSV avec les colonnes appropriées
   - Remplissez les données en respectant le format
   - Vérifiez que tous les emails sont valides et uniques

2. **Lancez l'import**
   - Cliquez sur le bouton "Importer"
   - Sélectionnez le type: "Clients" ou "Déménageurs"
   - Choisissez votre fichier
   - Cliquez sur "Importer"

3. **Résultats**
   - Un résumé s'affiche avec le nombre de comptes créés avec succès
   - Les erreurs sont listées avec les raisons (email déjà existant, données manquantes, etc.)

## Comptes créés automatiquement

### Pour les clients:
- ✅ Compte utilisateur créé dans auth.users
- ✅ Email confirmé automatiquement
- ✅ Mot de passe généré aléatoirement (le client devra réinitialiser son mot de passe)
- ✅ Si nom et téléphone fournis: création d'une demande de déménagement "template"

### Pour les déménageurs:
- ✅ Compte utilisateur créé dans auth.users
- ✅ Email confirmé automatiquement
- ✅ Mot de passe généré aléatoirement (le déménageur devra réinitialiser son mot de passe)
- ✅ Profil déménageur créé avec statut "En attente de vérification"
- ✅ Les déménageurs devront compléter leurs documents (KBIS, assurance, etc.)

## Gestion des erreurs

Les erreurs courantes incluent:

- **Email manquant**: La ligne sera ignorée
- **Email déjà existant**: Le compte existe déjà, la ligne sera ignorée
- **Format email invalide**: Vérifiez que l'email est correct
- **Nom d'entreprise manquant** (déménageurs): Obligatoire pour les déménageurs
- **Erreur de lecture du fichier**: Vérifiez le format du fichier

## Après l'import

### Clients:
- Les clients recevront un email de réinitialisation de mot de passe (si configuré)
- Ils pourront se connecter et créer leurs vraies demandes de déménagement

### Déménageurs:
- Les déménageurs apparaîtront dans la liste avec le statut "En attente"
- Un admin devra vérifier et approuver chaque déménageur
- Les déménageurs devront uploader leurs documents justificatifs

## Conseils

- ✅ Testez avec un petit fichier (2-3 lignes) avant d'importer un gros fichier
- ✅ Vérifiez que les emails sont tous valides
- ✅ Assurez-vous qu'il n'y a pas de doublons dans votre fichier
- ✅ Gardez une copie de votre fichier source
- ✅ Exportez régulièrement vos données pour backup

## Export des données

Utilisez le bouton vert "Exporter" pour télécharger la liste actuelle des utilisateurs au format CSV.

## Support

En cas de problème avec l'import, vérifiez:
1. Le format du fichier (Excel ou CSV)
2. Les noms des colonnes (respectez les variantes acceptées)
3. La validité des emails
4. Les logs d'erreur affichés après l'import
