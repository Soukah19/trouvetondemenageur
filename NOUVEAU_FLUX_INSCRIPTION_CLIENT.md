# Nouveau flux d'inscription client

## Modifications apportees

### 1. Page de completion de profil

Apres inscription avec email et mot de passe, le client est redirige vers une nouvelle page ou il doit renseigner :
- Prenom
- Nom
- Numero de telephone

Ces informations sont stockees dans la table `clients`.

### 2. Pre-remplissage automatique

Quand le client cree une nouvelle demande de devis :
- Les informations (nom complet, email, telephone) sont automatiquement pre-remplies
- Le client passe directement a l'etape 2 (informations du demenagement)
- Plus besoin de ressaisir ses coordonnees a chaque demande

### 3. Verification a la connexion

Si un client se connecte avec un compte existant mais sans profil complet :
- Il est automatiquement redirige vers la page de completion de profil
- Il doit completer son profil avant d'acceder au dashboard

## Flux utilisateur

```
Inscription (email + mot de passe)
        |
        v
Completion du profil (nom, prenom, telephone)
        |
        v
Dashboard client
        |
        v
Nouvelle demande de devis (infos pre-remplies)
```

## Script de suppression du compte test

Pour supprimer le compte test `cocodj100@gmail.com`, executez le script SQL :

```sql
-- Voir le fichier: delete_test_client_cocodj100.sql
```

Etapes :
1. Allez dans le SQL Editor de Supabase
2. Copiez le contenu du fichier `delete_test_client_cocodj100.sql`
3. Executez le script
4. Le compte sera completement supprime de la base de donnees

## Test du nouveau flux

1. Creez un nouveau compte client avec email et mot de passe
2. Completez le profil avec nom, prenom et telephone
3. Creez une demande de devis
4. Verifiez que les informations sont pre-remplies
5. Deconnectez-vous et reconnectez-vous
6. Verifiez que vous accedez directement au dashboard
