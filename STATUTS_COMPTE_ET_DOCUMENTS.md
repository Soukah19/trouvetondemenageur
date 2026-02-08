# DIFFERENCE ENTRE STATUT COMPTE ET STATUT DOCUMENTS

## IMPORTANT : 2 SYSTEMES DE VERIFICATION INDEPENDANTS

Il existe **2 systèmes de vérification complètement séparés** dans la plateforme :

---

## 1. STATUT DU COMPTE DEMENAGEUR
**Table : `movers`**
**Champ : `verification_status`**

### États possibles :
- ✅ **`verified`** - Compte approuvé par un admin
- ⏳ **`pending`** - En attente de validation admin
- ❌ **`rejected`** - Rejeté par un admin

### Ce que ça contrôle :
- **Accès au dashboard** : Le déménageur peut se connecter
- **Visibilité sur la plateforme** : Apparaît dans les recherches
- **Réception de demandes de devis**
- **Badge "Compte vérifié"**

### Qui peut le modifier :
- ✅ **Admin uniquement** via le dashboard admin
- ❌ **PAS le déménageur**

---

## 2. STATUT DES DOCUMENTS
**Table : `verification_documents`**
**Champ : `verification_status`**

### États possibles :
- ✅ **`verified`** - Document approuvé par un admin
- ⏳ **`pending`** - Document téléchargé, en attente de vérification
- ❌ **`rejected`** - Document rejeté par un admin

### Ce que ça contrôle :
- **Validation administrative** : Conformité des documents
- **Badge par document** : Statut visible sur chaque document
- **Alertes d'expiration** : Notification avant expiration

### Qui peut le modifier :
- ✅ **Admin** via la fiche déménageur (boutons Valider/Rejeter/En attente)
- ❌ **PAS le déménageur** (lecture seule)

---

## SCENARIO TYPIQUE

### Étape 1 : Inscription du déménageur
```
Compte : pending
Documents : pending (tous)
```
Le déménageur s'inscrit et télécharge ses documents.

### Étape 2 : Validation admin du COMPTE
```
Compte : verified ✅
Documents : pending (tous)
```
L'admin approuve le compte → **Le déménageur peut accéder au dashboard**

### Étape 3 : Validation admin des DOCUMENTS (optionnel)
```
Compte : verified ✅
Documents :
  - Carte d'identité : verified ✅
  - KBIS : verified ✅
  - Assurance : pending ⏳
  - Permis : verified ✅
```
L'admin valide les documents un par un **indépendamment** du statut du compte.

---

## QUESTIONS FREQUENTES

### ❓ Le compte est approuvé mais les documents sont "En attente" ?
**C'est NORMAL !**
- Le déménageur peut travailler même si les documents sont en attente
- Les documents sont vérifiés **progressivement** par les admins
- Chaque document a son propre statut

### ❓ Comment valider les documents ?
**Admin uniquement :**
1. Aller sur le dashboard admin
2. Cliquer sur un déménageur dans la liste
3. Scroller jusqu'à la section "Documents"
4. Cliquer sur l'icône œil pour voir les documents
5. Cliquer sur "Valider", "Rejeter" ou "En attente" pour chaque page

### ❓ Le déménageur peut-il valider ses propres documents ?
**NON !**
- Le déménageur peut uniquement **VOIR** ses documents
- Le déménageur peut **UPLOADER** de nouveaux documents
- Seul l'**ADMIN** peut changer le statut

### ❓ Pourquoi 2 systèmes séparés ?
Pour permettre une **flexibilité administrative** :
- Un déménageur peut être approuvé rapidement pour commencer à travailler
- Les documents peuvent être vérifiés plus tard, progressivement
- Certains documents peuvent expirer et être renouvelés sans bloquer le compte

---

## WORKFLOW RECOMMANDE POUR LES ADMINS

### Pour approuver un nouveau déménageur :

1. **Vérifier rapidement l'identité** (KBIS + Carte d'identité)
2. **Approuver le compte** → `verified` dans la table `movers`
3. Le déménageur peut maintenant accéder au dashboard
4. **Valider les documents progressivement** quand vous avez le temps
5. Surveiller les dates d'expiration

### Pour un déménageur existant :

- Les documents avec statut `pending` n'empêchent PAS le travail
- Validez les documents quand vous avez vérifié leur conformité
- Les alertes d'expiration apparaissent 1 mois avant la date limite
