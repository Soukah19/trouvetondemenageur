# GUIDE - VISUALISATION ET REMPLACEMENT DES DOCUMENTS

## NOUVELLES FONCTIONNALITES IMPLEMENTEES ✅

### 1. AFFICHAGE DIRECT DES DOCUMENTS
Les documents sont maintenant affichés directement dans le modal au lieu d'un simple lien.

**Support des formats :**
- ✅ **Images (JPG, PNG)** - Affichage direct de l'image
- ✅ **PDF** - Affichage dans un iframe + lien pour ouvrir dans un nouvel onglet
- ✅ **Autres formats** - Lien de téléchargement

### 2. REMPLACEMENT DES DOCUMENTS
Chaque page de document dispose maintenant d'un bouton "Remplacer" permettant de mettre à jour le document.

**2 options disponibles :**
- 📁 **Télécharger un fichier** (PDF, JPG, PNG)
- 📷 **Prendre une photo** avec la caméra de l'appareil

---

## PROCEDURE DE TEST

### TEST 1 : Visualisation des documents

1. **Se connecter en tant que déménageur**
   - Email : `dropit@contact.com`

2. **Aller sur "Mes Documents"**

3. **Cliquer sur "Voir"** sur n'importe quel document

4. **Vérifier l'affichage :**
   - ✅ **Images (Carte d'identité, Permis)** : L'image s'affiche directement
   - ✅ **PDFs (KBIS, Assurance)** : Le PDF s'affiche dans un iframe
   - ✅ Chaque page a un badge de statut (Vérifié/En attente/Rejeté)
   - ✅ Date de téléchargement visible sous chaque document
   - ✅ **Nouveau !** Bouton "Remplacer" visible sur chaque page

---

### TEST 2 : Remplacer un document par upload

1. **Dans le modal de visualisation des documents**

2. **Cliquer sur "Remplacer"** sous n'importe quelle page

3. **Un nouveau modal s'ouvre** avec 2 options :
   - "Cliquez pour télécharger un fichier"
   - "Prendre une photo"

4. **Cliquer sur "Cliquez pour télécharger un fichier"**

5. **Sélectionner un fichier** (PDF, JPG ou PNG) depuis votre ordinateur

6. **Vérifications :**
   - ✅ Le fichier est uploadé automatiquement
   - ✅ Toast de confirmation : "Document remplacé avec succès"
   - ✅ Le modal de remplacement se ferme
   - ✅ Le document s'actualise avec le nouveau fichier
   - ✅ Le statut repasse automatiquement à "En attente"
   - ✅ La date de téléchargement est mise à jour

---

### TEST 3 : Remplacer un document par photo (Mobile/Webcam)

1. **Dans le modal de visualisation des documents**

2. **Cliquer sur "Remplacer"** sous n'importe quelle page

3. **Cliquer sur "Prendre une photo"**

4. **Sur mobile :**
   - ✅ La caméra de l'appareil s'ouvre automatiquement
   - ✅ L'appareil photo arrière est utilisé par défaut (caméra environnement)

5. **Sur ordinateur avec webcam :**
   - ✅ La webcam se lance
   - ✅ Autorisation demandée si nécessaire

6. **Prendre la photo**

7. **Vérifications :**
   - ✅ La photo est capturée et uploadée
   - ✅ Toast de confirmation : "Document remplacé avec succès"
   - ✅ Le modal de remplacement se ferme
   - ✅ Le document s'actualise avec la nouvelle photo
   - ✅ Le statut repasse à "En attente"

---

## DETAILS TECHNIQUES

### Affichage des documents

```typescript
// Détection automatique du type de fichier
- isImageFile(url) → Vérifie .jpg, .jpeg, .png, .gif, .webp
- isPdfFile(url) → Vérifie .pdf

// Rendu conditionnel :
if (isImageFile) → <img src={url} />
else if (isPdfFile) → <iframe src={url} /> + lien externe
else → <a href={url}>Voir le document</a>
```

### Remplacement de document

```typescript
// Fonction handleDocumentReplace :
1. Upload du nouveau fichier vers Supabase Storage
2. Récupération de la nouvelle URL publique
3. UPDATE de la ligne dans verification_documents :
   - document_url → nouvelle URL
   - verification_status → 'pending'
   - uploaded_at → timestamp actuel
4. Rechargement de la liste des documents
```

### Capture photo mobile

```html
<input
  type="file"
  accept="image/*"
  capture="environment"
/>
```
- `accept="image/*"` → Accepte uniquement les images
- `capture="environment"` → Utilise la caméra arrière sur mobile

---

## SECURITE ET PERMISSIONS

### Permissions RLS (Row Level Security)

**Déménageur :**
- ✅ Peut VOIR ses propres documents
- ✅ Peut REMPLACER ses propres documents (UPDATE)
- ✅ Ne peut pas modifier le statut de vérification

**Admin :**
- ✅ Peut VOIR tous les documents
- ✅ Peut MODIFIER les statuts de vérification
- ❌ Ne peut pas remplacer les documents (seul le déménageur peut le faire)

### Validation des fichiers

- **Formats acceptés :** .pdf, .jpg, .jpeg, .png
- **Upload via Supabase Storage :** Bucket `identity-documents`
- **Nommage :** `{moverId}/{document_type}_{timestamp}.{extension}`

---

## WORKFLOW COMPLET

### Scénario : Carte d'identité expirée

1. **Déménageur reçoit une notification** (document expiré ou statut rejeté)

2. **Ouvre "Mes Documents"** → Clic sur "Voir" pour la Carte d'identité

3. **Voit les 2 pages existantes** :
   - Page 1 : Vérifié ✅
   - Page 2 : Rejeté ❌ (car expirée)

4. **Clique sur "Remplacer"** sous la Page 2

5. **2 options :**
   - **Option A (Desktop)** : Télécharge un scan de la nouvelle carte
   - **Option B (Mobile)** : Prend une photo de la nouvelle carte

6. **Document remplacé** :
   - Statut : En attente ⏳
   - Date : Aujourd'hui
   - Admin reçoit une notification de nouveau document à vérifier

7. **Admin valide** le nouveau document → Statut : Vérifié ✅

---

## DIFFERENCES AVEC L'ANCIEN SYSTEME

### AVANT ❌
- Lien "Voir le document PDF" qui ouvrait dans un nouvel onglet
- Pas d'aperçu direct des images
- Pas de possibilité de remplacer un document
- Le déménageur devait contacter l'admin pour changer un document

### MAINTENANT ✅
- **Affichage direct** des images et PDFs dans le modal
- **Bouton "Remplacer"** sur chaque page
- **2 méthodes** : Upload fichier ou Photo caméra
- **Autonomie** : Le déménageur gère ses mises à jour
- **Traçabilité** : Date de téléchargement mise à jour automatiquement
- **Workflow** : Nouveau document → Statut "En attente" → Admin valide

---

## PROBLEMES POSSIBLES ET SOLUTIONS

### ❌ Le PDF ne s'affiche pas dans l'iframe

**Cause :** Certains navigateurs bloquent l'affichage de PDFs externes
**Solution :** Utiliser le lien "Ouvrir dans un nouvel onglet" sous l'iframe

### ❌ La caméra ne se lance pas sur mobile

**Cause :** Permissions de l'appareil non accordées
**Solution :**
1. Vérifier les permissions du navigateur
2. Essayer avec l'option "Télécharger un fichier" à la place

### ❌ Le bouton "Remplacer" ne fonctionne pas

**Vérifier :**
1. Vous êtes bien connecté en tant que déménageur
2. Console (F12) : Y a-t-il des erreurs ?
3. Le `moverId` est correctement passé au composant

### ❌ Le document remplacé ne s'affiche pas

**Vérifier :**
1. Le fichier a bien été uploadé (vérifier Supabase Storage)
2. L'URL publique est accessible
3. Rafraîchir la page

---

## TESTS RECOMMANDES

### ✅ Test 1 : Remplacer une image par une image
- Page 1 de la Carte d'identité (JPG) → Nouvelle photo (JPG)

### ✅ Test 2 : Remplacer un PDF par une image
- KBIS (PDF) → Scan en PNG

### ✅ Test 3 : Remplacer une image par un PDF
- Page 2 de l'Assurance (JPG) → Document PDF

### ✅ Test 4 : Prendre une photo avec la caméra (Mobile)
- Permis de conduire → Photo avec la caméra du téléphone

### ✅ Test 5 : Vérifier l'historique
- Remplacer un document
- Vérifier que l'ancienne version n'est plus accessible
- Vérifier que la date est mise à jour

---

## CONCLUSION

Le système de visualisation et de remplacement des documents est maintenant **complètement autonome** pour les déménageurs :

1. ✅ **Visualisation directe** des documents (images et PDFs)
2. ✅ **Remplacement facile** via upload ou photo
3. ✅ **Mise à jour automatique** du statut et de la date
4. ✅ **Workflow de validation** : Déménageur upload → Admin valide

Les déménageurs peuvent maintenant gérer leurs documents sans intervention de l'admin, tout en maintenant le contrôle de validation par l'équipe administrative.
