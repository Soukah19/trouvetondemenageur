# GUIDE TEST REEL - A FAIRE MAINTENANT

Date: 2026-01-07

---

## ETAPE 1: INSCRIPTION DEMENAGEUR (BONS DOCUMENTS)

### A. Creer le compte
1. Aller sur la page inscription déménageur
2. Remplir:
   - Email: test-demenageur-1@example.com (ou ton vrai email)
   - Mot de passe: Test1234!
   - Confirmer mot de passe: Test1234!
3. Cliquer "Suivant"

### B. Informations Gérant
1. Prénom: Jean
2. Nom: Dupont
3. Téléphone: 06 12 34 56 78
4. Type document: Carte d'identité
5. **Upload CNI Recto** (1-5 pages)
   - Prendre photo ou choisir fichier
   - Document doit montrer: nom, prénom, date naissance
   - Format: JPG, PNG, PDF
6. **Upload CNI Verso** (1-5 pages)
7. Cliquer "Suivant"

### C. Informations Entreprise
1. Nom entreprise: Transport Dupont
2. SIRET: 12345678901234 (14 chiffres)
3. Email: contact@transportdupont.fr
4. Téléphone: 01 23 45 67 89
5. Adresse: 123 Rue de Paris
6. Ville: Paris
7. Code postal: 75001
8. Description: Entreprise de déménagement familiale depuis 2010
9. Services: Cocher au moins 3 services
10. Cliquer "Suivant"

### D. Documents Entreprise
1. **KBIS** (jusqu'à 10 pages)
   - Document doit être récent (< 3 mois)
   - Doit contenir: nom entreprise + SIRET
   - **IMPORTANT**: Le nom sur le KBIS doit correspondre au nom du gérant
2. **Assurance RC Pro** (jusqu'à 10 pages)
   - Doit montrer: dates validité futures + montant garantie
3. **Licence Transport** (jusqu'à 10 pages)
   - Doit contenir: numéro de licence valide
4. Cliquer "Suivant"

### E. Camions
1. Cliquer "Ajouter un camion"
2. Immatriculation: AB-123-CD
3. Capacité: 20 m³
4. Upload carte grise
5. Cliquer "Suivant"

### F. Zones d'intervention
1. Sélectionner au moins 1 département ou région
2. Exemple: Paris (75), Île-de-France
3. Cliquer "Finaliser l'inscription"

### RESULTAT ATTENDU:
- Message "Inscription réussie"
- Redirection vers page succès
- Status: **pending** (en attente vérification)

---

## ETAPE 2: VERIFICATION ADMIN - BONS DOCUMENTS

### A. Se connecter en Admin
1. Aller sur /admin
2. Email: admin@trouveton.fr
3. Mot de passe: (utiliser fonction reset-admin-passwords si besoin)

### B. Voir le nouveau déménageur
1. Onglet "Utilisateurs" → "Déménageurs"
2. Filtrer: Status "En attente"
3. Tu dois voir: Transport Dupont (Jean Dupont)
4. Cliquer sur le déménageur

### C. Vérifier les documents
1. Voir tous les documents uploadés
2. Cliquer "Vérifier les documents" ou déclencher vérification IA
3. **L'IA va analyser:**
   - CNI: Extraction nom "Jean Dupont"
   - KBIS: Extraction nom entreprise + SIRET
   - Vérification: Nom gérant = Nom KBIS ✅
   - Assurance: Dates validité
   - Licence: Numéro valide

### RESULTAT ATTENDU:
- Status passe à: **verified** ✅
- Badge vert "Vérifié"
- Déménageur peut maintenant voir les demandes

---

## ETAPE 3: INSCRIPTION DEMENAGEUR (FAUX DOCUMENTS)

### A. Créer 2ème compte
1. Email: test-fake@example.com
2. Mot de passe: Test1234!

### B. Remplir avec incohérences
**Option 1: Nom incohérent**
- Gérant: Pierre Martin
- KBIS: Nom entreprise avec "Dupont" (pas Martin)
- Résultat attendu: ❌ Rejected (noms ne correspondent pas)

**Option 2: Documents expirés**
- KBIS: Date > 3 mois
- Assurance: Date expiration passée
- Résultat attendu: ❌ Rejected (documents expirés)

**Option 3: Informations manquantes**
- Documents flous ou incomplets
- SIRET illisible
- Résultat attendu: ❌ Rejected (infos manquantes)

### RESULTAT ATTENDU:
- Status: **rejected** ❌
- Message: Détails des problèmes détectés
- Déménageur ne peut PAS voir les demandes

---

## ETAPE 4: CREATION DEVIS

### A. Déménageur vérifié se connecte
1. Email: test-demenageur-1@example.com
2. Aller sur "Demandes de devis"

### B. Voir la demande existante
- Client: HEIKEL NACHI
- Trajet: Paris → Bordeaux
- Date: 2026-03-31
- Cliquer "Voir détails"

### C. Calculer et soumettre devis
1. Voir le **prix de marché suggéré** (calculé automatiquement)
2. Entrer ton prix:
   - Exemple: 1500€ (si proche du prix marché → OK)
   - Ou: 5000€ (si très supérieur → Alerte)
3. Description: "Déménagement complet avec emballage"
4. Date début: 2026-03-31
5. Date fin: 2026-03-31
6. Cliquer "Soumettre le devis"

### RESULTAT ATTENDU:
- Message "Devis soumis"
- Notification envoyée au client
- Devis visible dans "Mes devis"

---

## ETAPE 5: ACCEPTATION CLIENT

### A. Client se connecte
1. Email: nachiheikel.mondi@gmail.com
2. Mot de passe: (demander au client ou créer nouveau)

### B. Voir les devis reçus
1. Dashboard → "Mes demandes"
2. Cliquer sur demande Paris → Bordeaux
3. Voir tous les devis soumis
4. Comparer les prix

### C. Accepter un devis
1. Choisir un devis
2. Cliquer "Accepter ce devis"
3. Confirmation

### RESULTAT ATTENDU:
- Devis status: **accepted** ✅
- Quote_request: accepted_quote_id rempli
- Redirection vers page paiement

---

## ETAPE 6: PAIEMENT (SI STRIPE CONFIGURE)

### A. Page paiement
- Montant total affiché
- Commission 30% visible
- Formulaire Stripe chargé

### B. Tester avec carte Stripe test
**Carte test succès:**
```
Numéro: 4242 4242 4242 4242
Date exp: 12/34
CVC: 123
Code postal: 75001
```

**Carte test échec:**
```
Numéro: 4000 0000 0000 0002
```

### C. Après paiement
- Payment créé (status: **escrow**)
- Mission activée
- Déménageur notifié

---

## ETAPE 7: ADMIN - LIBERER PAIEMENT

### A. Mission terminée
1. Client/Déménageur marque mission terminée
2. Ou attendre confirmation

### B. Admin libère paiement
1. Onglet "Paiements"
2. Filtrer: Status "escrow"
3. Sélectionner paiement
4. Cliquer "Libérer le paiement"

### RESULTAT:
- Payment status: **completed**
- Déménageur reçoit 70% du montant
- Plateforme garde 30%

---

## VERIFICATION FINALE

### Checklist complète:
- [ ] Inscription déménageur (bons docs) → verified
- [ ] Inscription déménageur (faux docs) → rejected
- [ ] IA détecte incohérences
- [ ] Déménageur vérifié voit demandes
- [ ] Déménageur rejete ne voit PAS demandes
- [ ] Création devis avec prix marché
- [ ] Alerte si prix > 150% marché
- [ ] Client voit et compare devis
- [ ] Client accepte devis
- [ ] Paiement escrow (si Stripe OK)
- [ ] Admin libère paiement
- [ ] Commission 30% calculée correctement

---

## COMPTES DE TEST DISPONIBLES

**Admin:**
- admin@trouveton.fr

**Client avec demande:**
- nachiheikel.mondi@gmail.com
- A déjà 1 demande: Paris → Bordeaux (2026-03-31)

**Nouveaux comptes à créer:**
- test-demenageur-1@example.com (bons docs)
- test-fake@example.com (faux docs)

---

## PROBLEMES POSSIBLES

### Si inscription bloque:
- Vérifier format email (xxx@xxx.xxx)
- Vérifier mot de passe (min 8 caractères)
- Vérifier uploads (JPG/PNG/PDF uniquement)

### Si IA ne vérifie pas:
- Vérifier OpenAI API key active
- Voir logs Edge Function: verify-identity-document
- Vérifier documents contiennent texte lisible

### Si paiement ne fonctionne pas:
- Vérifier Stripe configuré dans .env
- Utiliser carte test Stripe
- Voir logs console navigateur

---

## ORDRE RECOMMANDE

**1. D'ABORD:**
- Inscription avec bons documents
- Vérifier que IA → verified

**2. ENSUITE:**
- Inscription avec faux documents
- Vérifier que IA → rejected

**3. PUIS:**
- Création devis
- Acceptation client
- (Paiement si Stripe OK)

**4. ENFIN:**
- Tests admin complets
- Export rapports
- Vérification données

---

## NOTES IMPORTANTES

1. **Documents pour tests:**
   - Peut utiliser faux documents pour tester IA
   - IA détecte incohérences automatiquement

2. **Stripe:**
   - TOUJOURS utiliser carte test en dev
   - JAMAIS vraie carte bancaire en test

3. **Emails:**
   - Resend fonctionne en test
   - Vérifier spam si email non reçu

4. **Performance:**
   - Upload multi-pages: ~30s pour 10 pages
   - Vérification IA: ~10s par document
   - Calcul prix: instantané

---

## BESOIN D'AIDE?

**Si bloqué:**
1. Vérifier console navigateur (F12)
2. Vérifier logs Supabase Edge Functions
3. Vérifier status base de données
4. Me contacter avec screenshot erreur

**URLs utiles:**
- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- OpenAI Usage: https://platform.openai.com/usage

---

Date: 2026-01-07
Status: ✅ PRET POUR TESTS
Durée estimée tests complets: 30-45 minutes
