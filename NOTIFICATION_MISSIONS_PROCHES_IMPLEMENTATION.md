# Implémentation du Système de Notifications pour Missions Proches

## Vue d'ensemble

Système complet permettant aux déménageurs de recevoir des notifications automatiques lorsqu'une nouvelle demande de devis est créée dans un rayon de 200km du point d'arrivée de leurs missions en cours ou acceptées.

## Modifications apportées

### 1. Base de données (Migration)

**Fichier:** `supabase/migrations/20260127225000_add_nearby_mission_notifications.sql`

#### Nouvelles colonnes dans `quote_requests`
- `from_latitude` (numeric): Latitude du point de départ
- `from_longitude` (numeric): Longitude du point de départ
- `to_latitude` (numeric): Latitude du point d'arrivée
- `to_longitude` (numeric): Longitude du point d'arrivée

#### Nouvelles fonctions SQL

**`calculate_distance_km(lat1, lon1, lat2, lon2)`**
- Calcule la distance en kilomètres entre deux points GPS
- Utilise la formule de Haversine pour une précision optimale
- Retourne NULL si des coordonnées sont manquantes

**`notify_movers_with_nearby_missions()`**
- Fonction trigger exécutée automatiquement à chaque insertion de demande
- Parcourt tous les déménageurs vérifiés et actifs
- Pour chaque déménageur :
  - Recherche ses missions acceptées ou en cours (statut `accepted` ou `ongoing`)
  - Calcule la distance entre le point d'ARRIVÉE de chaque mission et le point de DÉPART de la nouvelle demande
  - Si distance ≤ 200km, crée une notification avec toutes les informations pertinentes

#### Nouveau type de notification
- **Type:** `nearby_mission_opportunity`
- **Trigger:** `trigger_notify_nearby_missions` - S'exécute après insertion dans `quote_requests`

#### Vue d'analyse
- **Vue:** `nearby_mission_opportunities`
- Permet d'analyser toutes les opportunités disponibles
- Affiche les distances calculées entre missions existantes et nouvelles demandes

### 2. Frontend - Composant AddressAutocomplete

**Fichier:** `src/components/AddressAutocomplete.tsx`

#### Modifications
- Ajout de `latitude` et `longitude` dans l'interface `AddressAutocompleteProps`
- Extraction automatique des coordonnées GPS depuis Google Maps API
- Utilisation de `place.geometry.location.lat()` et `.lng()`
- Les coordonnées sont maintenant retournées dans l'objet `addressData`

```typescript
const addressData = {
  fullAddress: place.formatted_address || '',
  street: street.trim(),
  city: city,
  postalCode: postalCode,
  country: country,
  latitude: place.geometry?.location?.lat(),
  longitude: place.geometry?.location?.lng()
};
```

### 3. Frontend - Page de création de devis

**Fichier:** `src/pages/ClientQuotePage.tsx`

#### Modifications du state
Ajout de 4 nouveaux champs dans `formData`:
- `from_latitude: null as number | null`
- `from_longitude: null as number | null`
- `to_latitude: null as number | null`
- `to_longitude: null as number | null`

#### Mise à jour des handlers AddressAutocomplete
Pour l'adresse de départ :
```typescript
onAddressSelect={(address) => {
  setFormData({
    ...formData,
    from_address: address.street,
    from_city: address.city,
    from_postal_code: address.postalCode,
    from_latitude: address.latitude || null,
    from_longitude: address.longitude || null
  });
}}
```

Pour l'adresse d'arrivée :
```typescript
onAddressSelect={(address) => {
  setFormData({
    ...formData,
    to_address: address.street,
    to_city: address.city,
    to_postal_code: address.postalCode,
    to_latitude: address.latitude || null,
    to_longitude: address.longitude || null
  });
}}
```

#### Insertion automatique
Les coordonnées GPS sont automatiquement incluses lors de l'insertion grâce au spread operator :
```typescript
await supabase
  .from('quote_requests')
  .insert([{
    ...formData,  // Inclut from_latitude, from_longitude, to_latitude, to_longitude
    furniture_inventory: furnitureInventory,
    furniture_photos: furniturePhotos,
    client_user_id: user?.id || null
  }]);
```

## Flux de fonctionnement

### 1. Client crée une demande de devis

1. Client saisit l'adresse de départ dans AddressAutocomplete
2. Google Maps API retourne l'adresse complète + coordonnées GPS
3. Les coordonnées sont stockées dans `from_latitude` et `from_longitude`

4. Client saisit l'adresse d'arrivée
5. Google Maps API retourne l'adresse complète + coordonnées GPS
6. Les coordonnées sont stockées dans `to_latitude` et `to_longitude`

7. Client soumet le formulaire
8. Toutes les données (y compris GPS) sont insérées dans `quote_requests`

### 2. Trigger automatique de notification

1. Le trigger `trigger_notify_nearby_missions` s'exécute après l'insertion
2. La fonction `notify_movers_with_nearby_missions()` :
   - Vérifie que les coordonnées de départ sont présentes
   - Parcourt tous les déménageurs vérifiés et actifs
   - Pour chaque déménageur, cherche ses missions en cours
   - Calcule la distance entre :
     * Point d'ARRIVÉE de chaque mission existante
     * Point de DÉPART de la nouvelle demande
   - Si distance ≤ 200km, crée une notification

### 3. Déménageur reçoit la notification

La notification contient :
- **Titre:** "Nouvelle demande proche de votre mission"
- **Message:** Détails de l'opportunité avec la distance exacte
- **Données JSON:**
  ```json
  {
    "quote_request_id": "uuid",
    "existing_mission_id": "uuid",
    "distance_km": 45.3,
    "from_city": "Paris",
    "to_city": "Lyon",
    "existing_mission_to_city": "Versailles",
    "existing_mission_date": "2026-02-15",
    "moving_date": "2026-02-16"
  }
  ```

## Avantages

### Pour les déménageurs
1. **Optimisation logistique** : Réduction des trajets à vide
2. **Rentabilité accrue** : Possibilité d'enchaîner plusieurs missions
3. **Automatisation** : Notifications envoyées automatiquement sans intervention

### Pour les clients
1. **Meilleurs prix** : Les déménageurs peuvent proposer des tarifs plus compétitifs
2. **Disponibilité** : Plus de chances de trouver un déménageur disponible
3. **Service rapide** : Les déménageurs répondent plus rapidement aux opportunités proches

### Pour la plateforme
1. **Valeur ajoutée** : Fonctionnalité unique qui différencie la plateforme
2. **Engagement** : Les déménageurs restent actifs sur la plateforme
3. **Taux de conversion** : Plus de devis acceptés grâce à l'optimisation

## Exemples d'utilisation

### Scénario 1 : Retour à vide évité
- Déménageur a une mission Paris → Bordeaux le 15/02/2026
- Nouvelle demande : Bordeaux → Paris le 16/02/2026
- Distance : 5 km du point d'arrivée de la mission
- Le déménageur reçoit une notification et peut proposer un tarif attractif

### Scénario 2 : Circuit optimisé
- Déménageur a une mission Lyon → Marseille le 20/02/2026
- Nouvelle demande : Aix-en-Provence → Nice le 21/02/2026
- Distance : 28 km du point d'arrivée de la mission
- Le déménageur peut créer un circuit Lyon → Marseille → Aix → Nice

## Tests recommandés

### Test 1 : Vérification des coordonnées GPS
1. Créer une nouvelle demande de devis
2. Sélectionner une adresse avec l'autocomplete
3. Vérifier dans la console que latitude/longitude sont capturées
4. Soumettre le formulaire
5. Vérifier dans la base de données que les coordonnées sont bien enregistrées

### Test 2 : Notification de proximité
1. Créer un compte déménageur et accepter un devis
2. Noter le point d'arrivée de cette mission
3. Créer une nouvelle demande avec un point de départ proche (<200km)
4. Vérifier que le déménageur reçoit une notification

### Test 3 : Calcul de distance
```sql
-- Tester la fonction de calcul
SELECT calculate_distance_km(
  48.8566, 2.3522,  -- Paris (Lat, Lon)
  45.7640, 4.8357   -- Lyon (Lat, Lon)
);
-- Devrait retourner environ 392 km
```

### Test 4 : Vue d'analyse
```sql
-- Voir toutes les opportunités disponibles
SELECT * FROM nearby_mission_opportunities
WHERE mover_id = 'votre-mover-id'
ORDER BY distance_km ASC;
```

## Notes importantes

### Performances
- Index créés sur `(to_latitude, to_longitude)` et `(from_latitude, from_longitude)`
- Fonction `calculate_distance_km` marquée comme `IMMUTABLE` pour optimisation
- Le trigger ne s'exécute que si les coordonnées de départ sont présentes

### Sécurité
- Fonction trigger en `SECURITY DEFINER` pour accéder aux données nécessaires
- Notifications uniquement pour déménageurs vérifiés (`verification_status = 'verified'`)
- Notifications uniquement si déménageur actif (`is_active = true`)
- Respect de la préférence de notifications (`email_notifications_enabled = true`)

### Données manquantes
- Si les coordonnées GPS ne sont pas disponibles, le système ignore silencieusement
- Pas d'erreur générée, la demande est quand même créée normalement
- Les notifications classiques (par zone géographique) continuent de fonctionner

## Documentation complémentaire

Voir aussi :
- `SYSTEME_NOTIFICATIONS_MISSIONS_PROCHES.md` - Documentation détaillée du système
- Migration SQL : `supabase/migrations/20260127225000_add_nearby_mission_notifications.sql`

## Statut

✅ Migration créée et prête à être appliquée
✅ Code frontend modifié et testé
✅ Build successful
🔄 En attente de déploiement en production
