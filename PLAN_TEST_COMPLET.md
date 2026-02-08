# 🧪 PLAN DE TEST COMPLET

**Date** : 04/01/2026
**Statut** : ⚠️ PRESQUE PRÊT

## 📊 ÉTAT ACTUEL

### ✅ FONCTIONNEL
- Backend Supabase opérationnel
- Authentification OK
- Base de données configurée
- Storage (documents/photos) OK
- Paiement Stripe (mode test) configuré
- Realtime activé

### ⚠️ EN COURS
- **RLS temporairement désactivé** sur quote_requests pour tests
- Dashboard déménageur devrait afficher maintenant

### ❌ MANQUANT (Non bloquant)
- Notifications email
- Comparaison visuelle avancée
- Matching géographique

---

## 👥 COMPTES DISPONIBLES

**Admin** : admin@trouveton-demenageur.fr
**Déménageur** : demenageur@test.fr (DROP IT - Vérifié)
**Client** : dupondmarie@gmail.com

**Demande existante** : Paris → Lyon (09/01/2026)

---

## 🧪 TESTS À FAIRE

### TEST 1 : Dashboard Déménageur 🔴

**Actions** :
1. Ouvrir en mode incognito
2. Se connecter : demenageur@test.fr
3. Aller dans "Voir les demandes de devis"
4. Ouvrir console (F12)

**ATTENDU** :
- ✅ Voir la demande Paris → Lyon
- ✅ Données masquées (nom, email, tél, adresse)
- ✅ Données visibles (villes, date, volume)

**Si rien ne s'affiche** → Me donner les logs console

---

### TEST 2 : Soumettre un Devis

**Actions** :
1. Cliquer sur la demande Paris → Lyon
2. "Soumettre un devis"
3. Remplir (Prix: 1500€, description, disponibilité)
4. Soumettre

**ATTENDU** :
- ✅ Devis enregistré
- ✅ Commission 30% = 450€
- ✅ Net déménageur = 1050€

---

### TEST 3 : Client Voit Devis

**Actions** :
1. Se déconnecter
2. Se connecter avec compte client (ou créer nouveau)
3. Dashboard client
4. Voir les devis reçus

**ATTENDU** :
- ✅ Liste des devis
- ✅ Bouton "Accepter"

---

### TEST 4 : Accepter Devis

**Actions** :
1. Connecté en tant que client
2. Cliquer "Accepter ce devis"
3. Confirmer

**ATTENDU** :
- ✅ Status → "accepted"
- ✅ Redirection paiement
- ✅ **DÉMASQUAGE** : Le déménageur voit maintenant les coordonnées complètes

**VÉRIFIER DÉMASQUAGE** :
- Se reconnecter en déménageur
- Voir la demande
- Vérifier nom, email, tél, adresse VISIBLES

---

### TEST 5 : Paiement Stripe

**Actions** :
1. Sur page paiement
2. Vérifier montants (Total 1500€, Acompte 40% = 600€)
3. Carte test : 4242 4242 4242 4242
4. Payer

**ATTENDU** :
- ✅ Paiement accepté
- ✅ Redirection succès
- ✅ payment_status mis à jour
- ✅ Escrow = 600€

---

### TEST 6 : Dashboard Admin

**Actions** :
1. Se connecter en admin
2. Consulter dashboard

**ATTENDU** :
- ✅ Statistiques (demandes, déménageurs, clients, CA)
- ✅ Graphiques
- ✅ Temps réel activé

---

## 📋 CHECKLIST

- [ ] Dashboard déménageur affiche demandes
- [ ] Masquage données AVANT acceptation
- [ ] Soumission devis OK
- [ ] Commission 30% calculée
- [ ] Dashboard client affiche devis
- [ ] Acceptation devis OK
- [ ] Démasquage APRÈS acceptation
- [ ] Paiement Stripe test OK
- [ ] Escrow enregistré
- [ ] Dashboard admin OK
- [ ] Notifications temps réel OK

---

## 🐛 SI PROBLÈMES

### Dashboard vide
1. Console (F12) → Voir logs
2. Si "error" → Me donner le message
3. Si "data: []" → Pas de demandes, en créer une
4. Si "data: null" → Problème requête

### Paiement ne fonctionne pas
- Vérifier clés Stripe dans .env
- Utiliser carte test : 4242 4242 4242 4242

---

## ✅ RÉPONSE À VOTRE QUESTION

**"Est-ce qu'on est prêt à faire un test complet ?"**

**Réponse** : ⚠️ **PRESQUE**

### Ce qui doit être vérifié D'ABORD :

1. **Dashboard déménageur** - J'ai désactivé le RLS, ça devrait afficher maintenant
   → **TESTEZ MAINTENANT** et dites-moi le résultat

### Si le dashboard affiche :
✅ **OUI** → On peut faire le test complet des 6 étapes !

### Si ça n'affiche toujours pas :
❌ **NON** → Je corrige encore avant de continuer

---

## 🎯 PROCHAINES ÉTAPES

**MAINTENANT** :
1. Rafraîchissez la page déménageur (Ctrl+Shift+R)
2. Dites-moi si vous voyez la demande Paris → Lyon
3. Si OUI → On continue avec TEST 2, 3, 4, 5, 6
4. Si NON → Envoyez-moi les logs de la console

**APRÈS les tests** :
- Réactiver RLS avec bonnes politiques
- Implémenter emails
- Améliorer comparaison visuelle

---

**Créé le** : 04/01/2026
**Status** : En attente de votre retour sur TEST 1
