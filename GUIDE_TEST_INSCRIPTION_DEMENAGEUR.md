# Guide de Test : Inscription Déménageur avec Vérification IA

## Vue d'ensemble

Ce guide vous permet de tester le flux complet d'inscription d'un déménageur avec toutes les vérifications IA automatiques.

## Fonctionnalités testées

1. ✅ Upload et vérification des documents d'identité
2. ✅ Upload et vérification KBIS (date de validité, comparaison SIRET, nom entreprise, nom gérant)
3. ✅ Upload et vérification assurance RC PRO (date de validité)
4. ✅ Upload et vérification cartes grises des camions
5. ✅ Détection de fraude (SIRET/email/téléphone dupliqués)
6. ✅ Génération d'un rapport de vérification IA avec score
7. ✅ Alertes automatiques pour l'admin et le déménageur

---

## Étape 1 : Préparer les documents de test

Pour un test réaliste, préparez les documents suivants (vous pouvez utiliser des images de test) :

### Documents requis :
- **Pièce d'identité** : Recto et verso (CNI, passeport ou permis)
- **KBIS** : Extrait de moins de 3 mois
- **Assurance RC PRO** : Attestation valide
- **Cartes grises** : Une par camion (minimum 1)

### Optionnel :
- **Licence de transport** (si applicable)

---

## Étape 2 : Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur : http://localhost:5173

---

## Étape 3 : Inscription déménageur

### 3.1 Accéder à la page d'inscription

1. Cliquez sur **"Devenir Déménageur"** ou **"S'inscrire en tant que déménageur"**

### 3.2 Étape 1 - Compte (Email & Mot de passe)

Renseignez :
- **Email** : exemple@test.fr
- **Mot de passe** : minimum 6 caractères
- **Confirmation du mot de passe**

✅ Validation automatique de l'email

### 3.3 Étape 2 - Informations du Gérant

Renseignez :
- **Prénom** : Jean
- **Nom** : Dupont
- **Téléphone** : 0612345678
- **Type de pièce d'identité** : Carte d'identité
- **Upload recto** : Sélectionnez le recto de la pièce
- **Upload verso** : Sélectionnez le verso de la pièce

✅ Validation du téléphone français

### 3.4 Étape 3 - Informations Entreprise

#### Informations générales :
- **Nom de l'entreprise** : Transport Dupont SARL
- **SIRET** : 12345678901234 (14 chiffres)
- **Email entreprise** : contact@transportdupont.fr
- **Téléphone entreprise** : 0612345679
- **Adresse** : 12 rue de la République
- **Code postal** : 75001
- **Ville** : Paris

#### Services proposés :
Cochez au moins un service :
- Déménagement local
- Déménagement national
- Monte-meuble
- Etc.

#### Zones géographiques :
Sélectionnez les départements ou régions où vous opérez.

#### Camions :
Cliquez sur **"+ Ajouter un camion"**
- **Immatriculation** : AB-123-CD
- **Cubage (m³)** : 20
- **Carte grise** : Upload le document

Vous pouvez ajouter plusieurs camions.

### 3.5 Étape 4 - Documents

Upload des documents obligatoires :

1. **KBIS** : Sélectionnez le fichier KBIS
2. **Assurance RC PRO** : Sélectionnez l'attestation d'assurance
3. **Licence de transport** (optionnel) : Si vous en avez une

Cliquez sur **"Finaliser l'inscription"**

---

## Étape 4 : Vérification IA automatique

Une fois l'inscription soumise, plusieurs actions se déclenchent automatiquement :

### 4.1 Upload des documents
Tous les documents sont uploadés dans Supabase Storage :
- ✅ Documents d'identité → bucket `identity-documents`
- ✅ Documents entreprise → bucket `identity-documents`
- ✅ Cartes grises → bucket `truck-documents`

### 4.2 Vérification IA complète
La fonction `comprehensive-mover-verification` analyse :

#### KBIS :
- Date d'émission (doit avoir moins de 3 mois)
- Comparaison SIRET saisi vs SIRET extrait
- Comparaison nom entreprise saisi vs KBIS
- Comparaison nom gérant saisi vs KBIS

#### Assurance RC PRO :
- Date de validité
- Alerte si expiration dans moins de 30 jours

#### Pièce d'identité :
- Date de validité
- Comparaison nom sur la pièce vs nom gérant saisi

#### Camions :
- Vérification immatriculation vs carte grise
- Vérification titulaire = entreprise

#### Détection de fraude :
- SIRET déjà utilisé ?
- Email déjà utilisé ?
- Téléphone déjà utilisé ?

### 4.3 Génération du rapport
Un rapport est créé avec :
- **Score** : De 0 à 100
- **Statut** : verified / needs_review / rejected
- **Liste des vérifications** : Chaque document avec son statut
- **Alertes** : Si anomalies détectées

### 4.4 Notifications automatiques

#### Pour le déménageur :
- Email de confirmation d'inscription
- Notification si documents OK
- Alerte si documents nécessitent révision

#### Pour les admins :
- Notification "Prêt à approuver" si score ≥ 85
- Notification "Révision manuelle nécessaire" si score < 85 ou alertes

---

## Étape 5 : Vérification côté Admin

### 5.1 Se connecter en tant qu'admin

Pour créer un compte admin, voir : [ACCES_ADMIN.md](./ACCES_ADMIN.md)

### 5.2 Accéder au tableau de bord

Dans le dashboard admin, vous verrez :

#### Section "Alertes de vérification" :
- **En attente** : Nombre de déménageurs en attente
- **À réviser** : Nombre de rapports nécessitant révision
- **Documents expirants** : Nombre de documents qui expirent bientôt
- **Vérifiés** : Nombre de déménageurs vérifiés

#### Liste des documents expirants :
Affiche les documents qui expirent dans les 30 prochains jours avec :
- Nom de l'entreprise
- Type de document
- Date d'expiration
- Jours restants

### 5.3 Voir les documents d'un déménageur

1. Allez dans **"Gestion des Utilisateurs"**
2. Filtrez sur **"Déménageurs"**
3. Cliquez sur **"⋮"** → **"Voir documents"** pour le déménageur inscrit

Vous verrez :
- **Statut de chaque document** : Valide / Expire bientôt / Expiré / Manquant
- **Dates d'expiration**
- **Bouton "Voir"** : Affiche le document
- **Rapport IA** : Score et alertes s'il y en a
- **Bouton "Lancer la vérification IA"** : Relancer manuellement

### 5.4 Actions admin

- **Approuver** : Si tout est OK
- **Rejeter** : Si documents non conformes
- **Suspendre** : Suspension temporaire
- **Voir documents** : Inspection détaillée

---

## Étape 6 : Système d'alertes automatiques

### 6.1 Vérification périodique des expirations

La fonction `check-document-expiration` peut être appelée manuellement :

Dans le dashboard admin :
- Section "Alertes de vérification"
- Bouton **"Vérifier expirations"**

Elle vérifie tous les documents et envoie des alertes si :
- Document expire dans moins de 30 jours → alerte au déménageur
- Plus de 5 documents expirent → résumé aux admins

### 6.2 Types de notifications

#### Pour les déménageurs :
- 📅 Document proche de l'expiration (30 jours avant)
- ✅ Document vérifié avec succès
- ⚠️ Document nécessite révision

#### Pour les admins :
- ✅ Déménageur prêt à approuver (score élevé)
- ⚠️ Révision manuelle nécessaire (alertes détectées)
- 📊 Résumé des documents expirants (si ≥ 5)

---

## Étape 7 : Scénarios de test recommandés

### Test 1 : Inscription complète et conforme
- Tous les documents fournis et valides
- Informations cohérentes
- **Résultat attendu** : Score ≥ 85, statut "verified"

### Test 2 : SIRET différent
- Saisir un SIRET différent de celui du KBIS
- **Résultat attendu** : Alerte, statut "needs_review"

### Test 3 : Nom gérant différent
- Saisir un nom de gérant différent de la pièce d'identité
- **Résultat attendu** : Alerte, statut "needs_review"

### Test 4 : Document manquant
- Ne pas fournir l'assurance RC PRO
- **Résultat attendu** : Score réduit, statut "needs_review"

### Test 5 : Doublon SIRET
1. Inscrire un premier déménageur avec SIRET X
2. Inscrire un second avec le même SIRET X
- **Résultat attendu** : Alerte fraude détectée

---

## Vérifications techniques

### Base de données

Vérifiez que les données sont bien enregistrées :

```sql
-- Voir le déménageur créé
SELECT * FROM movers WHERE email = 'exemple@test.fr';

-- Voir ses camions
SELECT * FROM trucks WHERE mover_id = 'xxx';

-- Voir le rapport de vérification
SELECT * FROM verification_reports WHERE mover_id = 'xxx';

-- Voir les documents expirants dans 30 jours
SELECT * FROM get_expiring_documents(30);
```

### Storage

Les documents sont stockés dans :
- `identity-documents/` : KBIS, assurance, pièces d'identité
- `truck-documents/` : Cartes grises

### Edge Functions déployées

- ✅ `comprehensive-mover-verification` : Vérification IA complète
- ✅ `check-document-expiration` : Vérification des expirations
- ✅ `verify-identity-document` : Vérification pièce d'identité
- ✅ `send-notification` : Envoi de notifications

---

## Résolution de problèmes

### Erreur lors de l'upload
- Vérifiez que les buckets Storage existent
- Vérifiez les permissions RLS

### Vérification IA ne se lance pas
- Vérifiez que la fonction est déployée
- Vérifiez les logs dans Supabase

### Notifications non reçues
- Vérifiez que l'utilisateur est connecté
- Vérifiez la table `notifications`

---

## Prochaines étapes

Une fois l'inscription testée :

1. **Approuver le déménageur** (côté admin)
2. **Tester le dashboard déménageur**
3. **Créer une demande de devis** (côté client)
4. **Soumettre un devis** (côté déménageur)
5. **Tester le système de paiement**

---

## Support

Pour toute question ou problème :
- Consultez les logs dans la console du navigateur (F12)
- Consultez les logs des Edge Functions dans Supabase Dashboard
- Vérifiez les migrations SQL appliquées
