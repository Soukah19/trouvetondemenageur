# Etat du Systeme Apres Nettoyage

Date: 08/01/2026 14:30

## Donnees Supprimees

Toutes les donnees de test ont ete supprimees :

| Table | Avant | Apres | Statut |
|-------|-------|-------|--------|
| `quote_requests` | ? | **0** | ✅ Nettoyé |
| `quotes` | ? | **0** | ✅ Nettoyé |
| `payments` | ? | **0** | ✅ Nettoyé |
| `notifications` | 12 | **0** | ✅ Nettoyé |
| `messages` | ? | **0** | ✅ Nettoyé |
| `moving_photos` | ? | **0** | ✅ Nettoyé |
| `reviews` | ? | **0** | ✅ Nettoyé |

## Comptes Utilisateurs Conserves

Les comptes utilisateurs ont ete **CONSERVES** pour permettre les tests :

### Clients (5 comptes)
- ✅ `nachiheikel.mondi@gmail.com` (compte client principal)
- ✅ 4 autres comptes clients

### Demenageurs (1 compte)
- ✅ `DROP IT` - `dropit.transport@gmail.com`
  - Statut: Verifie et actif
  - Pret pour recevoir des demandes

### Admins (2 comptes)
- ✅ `super_admin` - `admin@trouveton-demenageur.fr`
  - Role: super_admin
  - Acces complet
- ✅ `agent` - `agent@trouveton-demenageur.fr`
  - Role: agent
  - Acces limite

## Systeme Pret pour Tests

Le systeme est maintenant dans un etat propre et pret pour effectuer des tests :

### Test 1 : Creation Demande Complete
1. ✅ Se connecter en tant que client (`nachiheikel.mondi@gmail.com`)
2. ✅ Creer une nouvelle demande de demenagement
3. ✅ Utiliser le calculateur de volume detaille
4. ✅ Selectionner des meubles piece par piece
5. ✅ Soumettre la demande

**Verifications** :
- Demande creee en BDD
- Inventaire mobilier sauvegarde (JSON)
- Volume calcule correctement
- Notifications envoyees aux admins

### Test 2 : Demenageur Recoit et Soumet Devis
1. ✅ Se connecter en tant que demenageur (`dropit.transport@gmail.com`)
2. ✅ Voir la nouvelle demande dans "Demandes de devis"
3. ✅ Cliquer sur "Inventaire mobilier" pour voir le detail
4. ✅ Telecharger l'inventaire
5. ✅ Soumettre un devis

**Verifications** :
- Demenageur voit la demande
- Inventaire affiche correctement
- Devis cree avec bon prix
- Client recoit notification

### Test 3 : Client Accepte et Paie
1. ✅ Se connecter en tant que client
2. ✅ Aller sur "Mes devis recus"
3. ✅ Voir le bouton "Inventaire" (violet)
4. ✅ Consulter l'inventaire
5. ✅ Cliquer "Accepter ce devis"
6. ✅ Verifier que devis reste "pending"
7. ✅ Remplir formulaire paiement
8. ✅ Valider le paiement

**Verifications** :
- Devis reste "pending" jusqu'au paiement
- Apres paiement : devis "accepted"
- Demande passe en "accepted"
- Autres devis passes en "rejected"
- Paiement cree en BDD
- Demenageur recoit notification

### Test 4 : Client Accepte SANS Payer (Test Securite)
1. ✅ Se connecter en tant que client
2. ✅ Aller sur "Mes devis recus"
3. ✅ Cliquer "Accepter ce devis"
4. ✅ Arriver sur page paiement
5. ❌ Fermer l'onglet SANS payer

**Verifications** :
- Devis reste "pending" en BDD
- Demande reste "new" ou "quoted"
- Client peut revenir et payer plus tard
- Ou choisir un autre devis

### Test 5 : Client Modifie sa Demande
1. ✅ Client a deja recu des devis
2. ✅ Client modifie sa demande (ajoute meubles, change date)
3. ✅ Systeme invalide automatiquement les devis

**Verifications** :
- Tous les devis "pending" → "expired"
- Client voit message "Devis expire" (orange)
- AUCUN bouton "Accepter" sur devis expires
- Demenageurs recoivent notification
- Demenageurs peuvent soumettre nouveaux devis

### Test 6 : Admin Supervise
1. ✅ Se connecter en tant qu'admin (`admin@trouveton-demenageur.fr`)
2. ✅ Voir toutes les demandes dans "Demandes de Devis Recentes"
3. ✅ Cliquer "Visualiser" sur une demande
4. ✅ Cliquer sur "Inventaire mobilier" (si disponible)

**Verifications** :
- Admin voit toutes les demandes (tous statuts)
- Section "Demandes de Devis Recentes" affiche les donnees
- Bouton "Inventaire mobilier" fonctionne
- Details complets accessibles

## Workflow de Test Recommande

### Scenario Complet : Du Debut a la Fin

**Etape 1 : Client Cree Demande (5 min)**
```
nachiheikel.mondi@gmail.com
→ Nouvelle demande
→ Paris (75001) → Lyon (69001)
→ Date : 15/02/2026
→ Appartement T3, 70m²
→ Calculateur volume detaille :
   - Salon : Canape 3 places, Table basse, TV 40-55"
   - Chambre 1 : Lit double, Armoire 3 portes
   - Chambre 2 : Lit simple, Bureau, Chaise
   - Cuisine : Table 4 pers, Chaises x4, Frigo
→ Photo meuble special (si disponible)
→ Volume final : ~12m³
→ Soumettre
```

**Etape 2 : Demenageur Soumet Devis (3 min)**
```
dropit.transport@gmail.com
→ Voir la demande
→ Consulter inventaire mobilier
→ Telecharger inventaire
→ Soumettre devis : 3500€
→ Notes : "Camion 20m³ + 2 demenageurs + monte-meuble"
```

**Etape 3 : Client Accepte et Paie (5 min)**
```
nachiheikel.mondi@gmail.com
→ Mes devis recus
→ Voir devis DROP IT : 3500€
→ Consulter inventaire
→ Accepter ce devis
→ Page paiement :
   - Acompte 40% : 1400€
   - Carte : 4242 4242 4242 4242
   - Date : 12/26
   - CVV : 123
→ Valider paiement
→ Confirmation
```

**Etape 4 : Verifications Finales (2 min)**
```
Admin :
→ Dashboard admin
→ Voir demande "accepted"
→ Voir paiement 1400€ recu

Demenageur :
→ Notification "Devis accepte !"
→ Voir mission dans "Mes devis acceptes"
```

## Scenario de Test : Modification Demande

**Etape 1 : Client Cree Demande et Recoit 2 Devis**
```
1. Client cree demande Paris → Lyon (12m³)
2. Demenageur A propose 3500€
3. (Connecter deuxieme demenageur si disponible)
4. Demenageur B propose 3700€
```

**Etape 2 : Client Modifie Demande**
```
Client :
→ Modifier la demande
→ Ajouter meubles (bureau, bibliotheque)
→ Volume passe a 15m³
→ Changer date : 20/02/2026 au lieu de 15/02/2026
→ Enregistrer
```

**Etape 3 : Verifier Invalidation**
```
Client :
→ Mes devis recus
→ Voir message orange "Devis expire" sur les 2 devis
→ AUCUN bouton "Accepter"

Demenageur A :
→ Notification "Client a modifie sa demande"
→ Mes devis : Voir devis "Expire"
→ Consulter nouvel inventaire
→ Soumettre nouveau devis : 4200€

Client :
→ Recevoir nouveau devis 4200€
→ Pouvoir accepter (avec paiement)
```

## Commandes Utiles pour Tests

### Verifier Etat en BDD

```sql
-- Voir les demandes
SELECT id, from_city, to_city, status, volume_m3, created_at
FROM quote_requests
ORDER BY created_at DESC;

-- Voir les devis
SELECT q.id, qr.from_city, qr.to_city, q.status, q.client_display_price, q.created_at
FROM quotes q
JOIN quote_requests qr ON q.quote_request_id = qr.id
ORDER BY q.created_at DESC;

-- Voir les paiements
SELECT p.id, qr.from_city, qr.to_city, p.payment_status, p.amount_paid, p.paid_at
FROM payments p
JOIN quote_requests qr ON p.quote_request_id = qr.id
ORDER BY p.paid_at DESC;

-- Voir les notifications
SELECT user_id, title, type, read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
```

### Reinitialiser pour Nouveau Test

```sql
-- Supprimer toutes les donnees de test
DELETE FROM payments;
UPDATE quote_requests SET accepted_quote_id = NULL;
DELETE FROM quotes;
DELETE FROM quote_requests;
DELETE FROM notifications;
```

## Points de Verification Critiques

### ✅ Acceptation Devis
- [ ] Devis reste "pending" avant paiement
- [ ] Redirection vers page paiement sans changement statut
- [ ] Apres paiement : devis "accepted"
- [ ] Apres paiement : demande "accepted"
- [ ] Apres paiement : autres devis "rejected"
- [ ] Paiement cree avec bon montant
- [ ] Notifications envoyees

### ✅ Devis Expires
- [ ] Modification demande invalide devis "pending"
- [ ] Client voit message orange "Devis expire"
- [ ] Aucun bouton "Accepter" visible
- [ ] Demenageur recoit notification
- [ ] Demenageur peut soumettre nouveau devis
- [ ] Nouveau devis est "pending" et acceptable

### ✅ Inventaire Mobilier
- [ ] Bouton "Inventaire" visible cote client
- [ ] Bouton "Inventaire mobilier" visible cote demenageur
- [ ] Bouton "Inventaire mobilier" visible cote admin
- [ ] Modal affiche tous les meubles
- [ ] Separation standards/personnalises visible
- [ ] Quantites correctes
- [ ] Bouton telechargement fonctionne
- [ ] Fichier texte bien formate

### ✅ Admin
- [ ] Section "Demandes de Devis Recentes" affiche les donnees
- [ ] Toutes les demandes visibles (tous statuts)
- [ ] Bouton "Visualiser" fonctionne
- [ ] Details complets accessibles

## Comptes de Test

### Client
```
Email: nachiheikel.mondi@gmail.com
Mot de passe: [Utiliser le mot de passe habituel]
```

### Demenageur
```
Email: dropit.transport@gmail.com
Mot de passe: [Utiliser le mot de passe habituel]
Entreprise: DROP IT
Statut: Verifie et actif
```

### Admin
```
Email: admin@trouveton-demenageur.fr
Mot de passe: [Utiliser le mot de passe habituel]
Role: super_admin
```

## Resultats Attendus

Apres execution complete des tests :

**Base de donnees** :
- 1 demande de demenagement
- 1-2 devis (selon scenarios)
- 1 paiement (si acceptation completee)
- Plusieurs notifications

**Workflow verifie** :
- ✅ Creation demande avec inventaire
- ✅ Soumission devis par demenageur
- ✅ Acceptation UNIQUEMENT apres paiement
- ✅ Blocage devis expires apres modification
- ✅ Notifications fonctionnelles
- ✅ Visibilite admin complete

## Notes Importantes

1. **Paiement Test** : Utiliser carte `4242 4242 4242 4242` (Stripe test)
2. **Emails** : Verifier boites spam pour notifications
3. **Navigation** : Utiliser boutons "Retour" pour revenir aux dashboards
4. **Inventaire** : Utiliser calculateur detaille pour tests complets
5. **Photos** : Upload optionnel mais recommande pour tests IA

---

**Systeme Pret** ✅

Le systeme est maintenant dans un etat propre et toutes les corrections critiques sont implementees. Vous pouvez commencer les tests en toute confiance.
