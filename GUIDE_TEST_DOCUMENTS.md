# GUIDE DE TEST - VISUALISATION DES DOCUMENTS

## PROBLEME RESOLU

**Problème initial :**
- Clic sur "Voir" retournait à la page d'accueil
- Les modals ne s'affichaient pas correctement

**Solution appliquée :**
- Utilisation de **React Portals** pour monter les modals directement dans `document.body`
- Isolation complète des modals de la hiérarchie des composants
- Prévention des conflits d'événements de clic

---

## PROCEDURE DE TEST

### TEST 1 : Visualisation des documents (Déménageur)

1. **Se connecter en tant que déménageur**
   - Email : `dropit@contact.com`
   - Mot de passe : (votre mot de passe)

2. **Aller sur le dashboard déménageur**
   - Vous devriez voir la section "Mes Documents" à droite

3. **Vérifier l'affichage regroupé**
   - ✅ Carte d'identité (2 pages)
   - ✅ KBIS
   - ✅ Assurance professionnelle (3 pages)
   - ✅ Permis de conduire

4. **Cliquer sur le bouton "Voir"** d'un document
   - ✅ Le modal s'ouvre immédiatement
   - ✅ Vous restez sur la page (pas de retour à l'accueil)
   - ✅ Toutes les pages du document s'affichent en grille
   - ✅ Chaque page montre son statut

5. **Fermer le modal**
   - Méthode 1 : Cliquer sur le bouton "Fermer"
   - Méthode 2 : Cliquer en dehors du modal (fond noir)
   - Méthode 3 : Cliquer sur le X en haut à droite

6. **Tester avec plusieurs documents**
   - Répéter avec l'Assurance (3 pages)
   - Vérifier que toutes les pages s'affichent correctement

---

### TEST 2 : Gestion des documents (Admin)

1. **Se connecter en tant qu'admin**
   - Email : `admin@trouveton-demenageur.fr`
   - Username : `admin`
   - Mot de passe : (votre mot de passe admin)

2. **Aller sur le dashboard admin**
   - Onglet "Gestion des utilisateurs"
   - Sous-onglet "Déménageurs"

3. **Cliquer sur "DROP IT"** dans la liste
   - Une fiche complète s'ouvre

4. **Scroller jusqu'à la section "Documents"**
   - Vous devriez voir :
     - Carte d'identité (2 pages) - En attente
     - KBIS - En attente
     - Assurance professionnelle (3 pages) - En attente
     - Permis de conduire - En attente

5. **Cliquer sur l'icône œil** d'un document
   - ✅ Le modal s'ouvre avec toutes les pages
   - ✅ Chaque page a 3 boutons : Valider / Rejeter / En attente

6. **Tester la modification de statut**
   - Cliquer sur "Valider" pour la page 1 de la Carte d'identité
   - ✅ Le badge passe en "Vérifié" (vert)
   - ✅ Le toast confirme "Statut du document mis à jour"

7. **Cliquer sur "Rejeter"** pour une autre page
   - ✅ Le badge passe en "Rejeté" (rouge)

8. **Fermer et rouvrir le modal**
   - ✅ Les statuts modifiés sont conservés

---

## VERIFICATION DES STATUTS

### Dans l'espace Déménageur
- Les statuts sont **en lecture seule**
- Le déménageur voit les badges de statut mais ne peut pas les modifier
- Les documents "En attente" sont normaux même si le compte est vérifié

### Dans l'espace Admin
- Les statuts sont **modifiables**
- Chaque page peut avoir un statut différent
- Les modifications sont sauvegardées en base de données

---

## PROBLEMES POSSIBLES ET SOLUTIONS

### ❌ Le modal ne s'ouvre toujours pas
**Vérifier :**
1. Rafraîchir la page (Ctrl+F5)
2. Vider le cache du navigateur
3. Ouvrir la console (F12) et chercher des erreurs
4. Vérifier que vous êtes bien connecté en tant que déménageur

### ❌ Les documents ne s'affichent pas
**Vérifier :**
1. Dans la console : `MoverDocumentManager: Loaded documents: [...]`
2. Si vide, vérifier les permissions RLS dans Supabase
3. Vérifier que le `moverId` est correct

### ❌ Le bouton "Valider" ne fonctionne pas (Admin)
**Vérifier :**
1. Vous êtes bien connecté en tant qu'admin
2. Le toast d'erreur s'affiche-t-il ?
3. Console : Y a-t-il une erreur de permissions ?

---

## STATUTS NORMAUX APRES LES TESTS

Après vos tests, il est normal d'avoir :
- **Compte : Vérifié** (dans la table `movers`)
- **Documents : Mix de statuts** (pending/verified/rejected dans `verification_documents`)

**C'est voulu !** Les deux systèmes sont indépendants (voir `STATUTS_COMPTE_ET_DOCUMENTS.md`).

---

## NETTOYER APRES LES TESTS

Si vous voulez remettre tous les documents en "En attente" :

```sql
UPDATE verification_documents
SET verification_status = 'pending'
WHERE mover_id = (
  SELECT id FROM movers WHERE company_name = 'DROP IT'
);
```
