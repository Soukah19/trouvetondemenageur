# AMELIORATIONS - GESTION DES DOCUMENTS

## MODIFICATIONS IMPLEMENTEES ✅

### 1. Bouton "Remplacer" pour les admins
**Capture 1 - Fonctionnalité ajoutée**

Les administrateurs peuvent maintenant remplacer les documents des déménageurs :
- ✅ Bouton "Remplacer le document" ajouté sous chaque page
- ✅ Modal d'upload (PDF, JPG, PNG uniquement)
- ✅ Pas de caméra (upload fichier seulement)
- ✅ Le document remplacé repasse automatiquement en statut "En attente"

---

### 2. Renommage "Permis de conduire" → "Licence de transport"
**Capture 2 - Libellé corrigé**

Le document "Permis de conduire" s'affiche maintenant sous le nom correct :
- ✅ **Nouveau nom :** "Licence de transport"
- ✅ Visible dans l'espace déménageur
- ✅ Cohérent avec la terminologie professionnelle

---

### 3. Icône poubelle pour supprimer un document
**Capture 3 - Bouton de suppression ajouté**

Les déménageurs peuvent maintenant supprimer un document :
- ✅ Icône poubelle rouge à côté du bouton "Remplacer"
- ✅ Confirmation avant suppression
- ✅ Suppression définitive de la base de données
- ✅ Le déménageur peut ensuite re-uploader un nouveau document

---

## DETAILS TECHNIQUES

### Fichier 1 : `MoverDetailModal.tsx` (Admin)

**Nouveaux imports :**
```typescript
import { RefreshCw, Upload } from 'lucide-react';
```

**Nouveau state :**
```typescript
const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
```

**Nouvelle fonction :**
```typescript
const handleAdminDocumentReplace = async (file: File, docId: string) => {
  // 1. Upload du nouveau fichier vers Supabase Storage
  // 2. Mise à jour de l'URL dans verification_documents
  // 3. Statut repasse à "pending"
  // 4. Rechargement des données
};
```

**Nouveau bouton dans le modal de visualisation :**
- Bouton bleu "Remplacer le document" sous Valider/Rejeter/En attente
- Ouvre un modal d'upload (fichier uniquement, pas de caméra)

---

### Fichier 2 : `MoverDocumentManager.tsx` (Déménageur)

**Nouveaux imports :**
```typescript
import { Trash2 } from 'lucide-react';
```

**Modification du libellé :**
```typescript
{ value: 'driver_license', label: 'Licence de transport' }
```

**Nouvelle fonction :**
```typescript
const handleDeleteDocument = async (docId: string) => {
  // 1. Confirmation utilisateur
  // 2. Suppression du document dans verification_documents
  // 3. Rechargement de la liste
};
```

**Nouveau bouton :**
- Icône poubelle rouge à côté de "Remplacer"
- Confirmation avant suppression
- Suppression définitive

---

## TESTS A EFFECTUER

### Test 1 : Admin - Remplacer un document

1. **Connexion admin**
   - Email : `admin@trouveton-demenageur.fr`
   - Username : `admin`

2. **Navigation**
   - Gestion des utilisateurs → Déménageurs → DROP IT
   - Section Documents → Cliquer sur l'icône œil (Carte d'identité)

3. **Vérifications :**
   - ✅ Les documents s'affichent correctement
   - ✅ 4 boutons visibles : Valider, Rejeter, En attente, **Remplacer le document**
   - ✅ Clic sur "Remplacer le document" ouvre un modal

4. **Upload d'un nouveau document**
   - ✅ Cliquer dans la zone d'upload
   - ✅ Sélectionner un fichier (PDF, JPG ou PNG)
   - ✅ Le fichier est uploadé automatiquement
   - ✅ Toast : "Document remplacé avec succès"
   - ✅ Le statut repasse à "En attente"
   - ✅ Le nouveau document s'affiche

---

### Test 2 : Déménageur - Vérifier le libellé

1. **Connexion déménageur**
   - Email : `dropit@contact.com`

2. **Navigation**
   - Mes Documents

3. **Vérifications :**
   - ✅ Le document s'affiche maintenant comme **"Licence de transport"**
   - ✅ Plus de mention "Permis de conduire"
   - ✅ Cohérent avec la terminologie professionnelle

---

### Test 3 : Déménageur - Supprimer un document

1. **Connexion déménageur**
   - Email : `dropit@contact.com`

2. **Navigation**
   - Mes Documents → Cliquer sur "Voir" (n'importe quel document)

3. **Vérifications :**
   - ✅ Icône poubelle rouge visible à côté du bouton "Remplacer"
   - ✅ Clic sur la poubelle affiche une confirmation
   - ✅ Confirmer la suppression

4. **Après suppression :**
   - ✅ Toast : "Document supprimé avec succès"
   - ✅ Le document disparaît de la liste
   - ✅ Le déménageur peut maintenant uploader un nouveau document

---

### Test 4 : Workflow complet - Document rejeté

**Scénario : Un document est rejeté par l'admin, le déménageur le remplace**

1. **Admin rejette un document**
   - Connexion admin
   - Gestion des utilisateurs → Déménageurs → DROP IT
   - Cliquer sur "Voir" (Assurance professionnelle)
   - Cliquer sur "Rejeter" pour la page 1
   - ✅ Statut : Rejeté ❌

2. **Déménageur supprime le document rejeté**
   - Connexion déménageur
   - Mes Documents → Voir Assurance professionnelle
   - Cliquer sur la poubelle rouge de la page 1
   - Confirmer la suppression
   - ✅ Document supprimé

3. **Déménageur upload un nouveau document**
   - Cliquer sur "Ajouter un document"
   - Sélectionner le type : Assurance professionnelle
   - Upload ou Photo d'un nouveau document
   - ✅ Nouveau document uploadé avec statut "En attente"

4. **Admin valide le nouveau document**
   - Connexion admin
   - Gestion des utilisateurs → Déménageurs → DROP IT
   - Voir Assurance professionnelle
   - ✅ La nouvelle page 1 est visible avec statut "En attente"
   - Cliquer sur "Valider"
   - ✅ Statut : Vérifié ✅

---

## WORKFLOW ADMIN - REMPLACEMENT DE DOCUMENT

### Cas d'usage 1 : Document illisible

**Problème :** Un déménageur a uploadé une photo floue

**Solution :**
1. Admin ouvre le document
2. Admin clique sur "Rejeter" avec le statut "Rejeté"
3. Admin contacte le déménageur (téléphone/email)
4. Déménageur re-upload via son espace
5. Admin valide le nouveau document

**OU (nouveau workflow) :**
1. Admin ouvre le document
2. Admin clique sur "Remplacer le document"
3. Admin upload directement un nouveau document (si fourni par email par exemple)
4. Admin clique sur "Valider"

---

### Cas d'usage 2 : Document expiré

**Problème :** L'assurance a expiré

**Solution :**
1. Admin ouvre le document
2. Admin voit la date d'expiration passée
3. Admin clique sur "Rejeter"
4. Notification envoyée au déménageur
5. Déménageur remplace le document via son espace
6. Admin valide le nouveau document

---

### Cas d'usage 3 : Erreur de document

**Problème :** Le déménageur a uploadé le mauvais document

**Exemple :** KBIS uploadé à la place de l'assurance

**Solution :**
1. Admin ouvre le document
2. Admin constate l'erreur
3. Admin clique sur "Remplacer le document"
4. Admin upload le bon document (si fourni)
5. Admin valide

---

## WORKFLOW DEMENAGEUR - SUPPRESSION ET RE-UPLOAD

### Cas d'usage 1 : Document rejeté

**Problème :** Un document a été rejeté par l'admin

**Solution :**
1. Déménageur voit le statut "Rejeté" sur Mes Documents
2. Déménageur clique sur "Voir" le document
3. Déménageur clique sur l'icône poubelle rouge
4. Confirmation : "Êtes-vous sûr de vouloir supprimer ce document ?"
5. Document supprimé
6. Déménageur clique sur "Ajouter un document"
7. Déménageur sélectionne le type et upload un nouveau document
8. Statut : "En attente"

---

### Cas d'usage 2 : Erreur de téléchargement

**Problème :** Le déménageur a uploadé le mauvais fichier par erreur

**Solution :**
1. Déménageur voit le document dans "Mes Documents"
2. Déménageur clique sur "Voir"
3. Déménageur constate l'erreur
4. Déménageur clique sur la poubelle rouge
5. Document supprimé
6. Déménageur upload le bon document

---

### Cas d'usage 3 : Document illisible

**Problème :** La photo est floue ou illisible

**Solution :**
1. Déménageur voit le document
2. Déménageur clique sur "Voir"
3. Déménageur constate que la photo est floue
4. Déménageur clique sur la poubelle rouge
5. Document supprimé
6. Déménageur prend une nouvelle photo avec la caméra
7. Nouveau document uploadé

---

## SECURITE ET PERMISSIONS

### Permissions RLS - Suppression de documents

**Déménageur :**
- ✅ Peut SUPPRIMER ses propres documents
- ❌ Ne peut pas supprimer les documents d'autres déménageurs

**Admin :**
- ❌ Ne peut pas supprimer les documents (utilise "Rejeter" à la place)
- ✅ Peut remplacer les documents (nouveau)
- ✅ Peut modifier les statuts (Valider/Rejeter/En attente)

### Validation côté frontend

**Suppression :**
```typescript
if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
  return; // Annulation
}
```

**Remplacement admin :**
- Vérifie que le fichier est au bon format (PDF, JPG, PNG)
- Vérifie que le document existe
- Vérifie que le déménageur existe

---

## DIFFERENCES AVEC L'ANCIEN SYSTEME

### AVANT ❌

**Admin :**
- Pas de possibilité de remplacer un document
- Devait demander au déménageur de re-uploader

**Déménageur :**
- "Permis de conduire" au lieu de "Licence de transport"
- Pas de bouton de suppression
- Devait contacter l'admin pour supprimer un document

### MAINTENANT ✅

**Admin :**
- ✅ Bouton "Remplacer le document" sur chaque page
- ✅ Upload direct (fichier uniquement)
- ✅ Statut repasse automatiquement à "En attente"

**Déménageur :**
- ✅ Libellé correct : "Licence de transport"
- ✅ Icône poubelle rouge pour supprimer
- ✅ Confirmation avant suppression
- ✅ Autonomie complète

---

## STATISTIQUES DES MODIFICATIONS

### Fichiers modifiés : 2
1. `src/components/admin/MoverDetailModal.tsx`
2. `src/components/MoverDocumentManager.tsx`

### Lignes de code ajoutées : ~90
- Fonction `handleAdminDocumentReplace` : 35 lignes
- Modal de remplacement admin : 40 lignes
- Fonction `handleDeleteDocument` : 15 lignes
- Bouton poubelle : 5 lignes

### Nouvelles fonctionnalités : 3
1. Remplacement de document par l'admin
2. Renommage "Permis de conduire" → "Licence de transport"
3. Suppression de document par le déménageur

---

## CONCLUSION

Le système de gestion des documents est maintenant **plus flexible et autonome** :

### Pour les admins :
- ✅ Peuvent remplacer les documents directement
- ✅ Gain de temps (pas besoin de contacter le déménageur)
- ✅ Workflow plus fluide

### Pour les déménageurs :
- ✅ Libellé correct et professionnel
- ✅ Peuvent supprimer et re-uploader librement
- ✅ Plus d'autonomie, moins de dépendance de l'admin

### Pour l'application :
- ✅ Workflow plus rapide
- ✅ Moins d'allers-retours admin-déménageur
- ✅ Meilleure expérience utilisateur
