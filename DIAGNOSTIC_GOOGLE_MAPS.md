# 🗺️ DIAGNOSTIC GOOGLE MAPS API - AUTOCOMPLÉTION D'ADRESSE

## RÉSUMÉ

**Clé API actuelle** : `AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg`

**Statut de la clé** : ✅ FONCTIONNELLE (le script se charge correctement)

**Problème probable** : APIs non activées ou restrictions sur la clé

---

## 🔍 DIAGNOSTIC RAPIDE

### Test effectué

```bash
curl "https://maps.googleapis.com/maps/api/js?key=AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg&libraries=places"
```

**Résultat** : ✅ Le script se charge correctement

### Conclusion

La clé API fonctionne au niveau serveur, donc le problème vient probablement de :

1. **APIs non activées** dans Google Cloud Console
2. **Restrictions de clé** (domaines, IP, quotas)
3. **Problème de configuration frontend**

---

## 📋 CHECKLIST DE VÉRIFICATION

### 1. Vérifier les APIs activées

Rendez-vous sur : https://console.cloud.google.com/apis/library

Pour cette clé, vous DEVEZ activer :

- [ ] **Maps JavaScript API**
- [ ] **Places API** (CRITIQUE pour l'autocomplétion)
- [ ] **Geocoding API**
- [ ] **Distance Matrix API** (si calcul de distance)

### 2. Vérifier les restrictions de la clé

Allez sur : https://console.cloud.google.com/apis/credentials

Trouvez votre clé API et vérifiez :

#### Restrictions d'application
- [ ] Aucune restriction OU
- [ ] Restriction HTTP referrers avec vos domaines autorisés :
  - `localhost/*`
  - `127.0.0.1/*`
  - `*.bolt.new/*` (si hébergé sur Bolt)
  - Votre domaine de production

#### Restrictions d'API
- [ ] Aucune restriction OU
- [ ] Les 4 APIs listées ci-dessus sont autorisées

### 3. Vérifier les quotas

- [ ] Quota Places API : Au moins 1000 requêtes/jour
- [ ] Pas de limite de facturation dépassée

---

## 🧪 TEST LOCAL

Un fichier de test a été créé : **`test-google-maps.html`**

### Utilisation

1. Ouvrez le fichier dans votre navigateur :
   ```bash
   # Sur macOS
   open test-google-maps.html

   # Sur Linux
   xdg-open test-google-maps.html

   # Sur Windows
   start test-google-maps.html
   ```

2. Le test affichera :
   - ✅ Si l'API se charge correctement
   - ✅ Si Places API est disponible
   - ✅ Si l'autocomplétion fonctionne

3. **Résultats possibles** :

   **Succès complet** ✅
   ```
   ✅ Google Maps API fonctionnelle !
   ```
   → L'API fonctionne, le problème est dans votre application

   **Erreur de chargement** ❌
   ```
   ❌ Erreur : Impossible de charger l'API Google Maps
   ```
   → La clé est invalide ou les APIs ne sont pas activées

   **Places API indisponible** ⚠️
   ```
   ❌ Google Maps Places API non disponible
   ```
   → Places API n'est pas activée pour cette clé

---

## 🔧 SOLUTIONS PAR SYMPTÔME

### Symptôme : "RefererNotAllowedMapError"

**Cause** : Restrictions HTTP referrers trop strictes

**Solution** :
1. Allez dans Google Cloud Console > Credentials
2. Modifiez votre clé API
3. Dans "Application restrictions" → "HTTP referrers"
4. Ajoutez :
   - `localhost/*`
   - `127.0.0.1/*`
   - `*.bolt.new/*`
   - Votre domaine

### Symptôme : "This API project is not authorized to use this API"

**Cause** : Places API non activée

**Solution** :
1. Allez sur https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Cliquez sur "ACTIVER"
3. Attendez 1-2 minutes pour la propagation

### Symptôme : Aucune suggestion n'apparaît

**Cause** : Quota dépassé ou Places API non activée

**Solution** :
1. Vérifiez les quotas : https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas
2. Vérifiez que Places API est activée
3. Vérifiez la console JavaScript (F12) pour des erreurs

### Symptôme : Le champ reste gris/désactivé

**Cause** : Script Google Maps ne se charge pas

**Solution** :
1. Ouvrez la console (F12)
2. Cherchez les erreurs réseau
3. Vérifiez que la clé est bien dans le `.env`
4. Vérifiez que `VITE_GOOGLE_MAPS_API_KEY` est définie

---

## ✅ CONFIGURATION ACTUELLE VÉRIFIÉE

### Fichier .env

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg
GOOGLE_MAPS_API_KEY=AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg
```

✅ Les deux variables sont définies (frontend + backend)

### Composant AddressAutocomplete.tsx

✅ Le composant charge correctement le script :
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=FR`;
```

✅ Le composant initialise correctement l'autocomplétion :
```typescript
const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
  componentRestrictions: { country: ['fr', 'be', 'ch', 'lu'] },
  fields: ['address_components', 'formatted_address', 'geometry'],
  types: ['address']
});
```

---

## 🚀 ACTIONS RECOMMANDÉES

### Action Immédiate #1 : Tester la clé

```bash
# Ouvrir le fichier de test
open test-google-maps.html
```

### Action Immédiate #2 : Activer Places API

1. Allez sur : https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Sélectionnez votre projet
3. Cliquez sur "ACTIVER"
4. Attendez 2 minutes

### Action Immédiate #3 : Vérifier les restrictions

1. Allez sur : https://console.cloud.google.com/apis/credentials
2. Cliquez sur votre clé API
3. Dans "Application restrictions" :
   - Choisissez "HTTP referrers"
   - Ajoutez : `localhost/*`, `127.0.0.1/*`, `*.bolt.new/*`
4. Dans "API restrictions" :
   - Choisissez "Restrict key"
   - Sélectionnez : Maps JavaScript API, Places API, Geocoding API
5. Cliquez sur "SAVE"

---

## 📞 SI LE PROBLÈME PERSISTE

### Option 1 : Créer une nouvelle clé

Si la clé actuelle a des problèmes, créez-en une nouvelle :

1. Allez sur : https://console.cloud.google.com/apis/credentials
2. Cliquez sur "CREATE CREDENTIALS" > "API key"
3. Copiez la nouvelle clé
4. Remplacez dans `.env` :
   ```env
   VITE_GOOGLE_MAPS_API_KEY=VOTRE_NOUVELLE_CLE
   GOOGLE_MAPS_API_KEY=VOTRE_NOUVELLE_CLE
   ```
5. Activez les APIs nécessaires (voir checklist ci-dessus)
6. Configurez les restrictions (HTTP referrers)
7. Redémarrez l'application : `npm run dev`

### Option 2 : Utiliser la clé fournie précédemment

**Si vous avez une autre clé que vous m'avez donnée précédemment**, fournissez-la moi et je mettrai à jour la configuration.

---

## 📊 COÛTS GOOGLE MAPS

Pour votre information :

- **Maps JavaScript API** : Gratuit jusqu'à 28 000 chargements/mois
- **Places API** : Gratuit jusqu'à 17 000 requêtes/mois
- **Geocoding API** : Gratuit jusqu'à 40 000 requêtes/mois

Crédit Google Cloud : $200/mois pour nouveaux comptes

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Test avec `test-google-maps.html`
2. ⚙️ Activer Places API si nécessaire
3. 🔓 Configurer les restrictions de clé
4. 🧪 Tester l'application
5. 📝 Me communiquer les résultats

**Si l'autocomplétion fonctionne dans `test-google-maps.html` mais pas dans l'application**, le problème vient du code frontend. Sinon, c'est la configuration Google Cloud.
