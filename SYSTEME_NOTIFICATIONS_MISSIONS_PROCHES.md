# Système de Notifications pour Missions Proches

## Vue d'ensemble

Ce système notifie automatiquement les déménageurs lorsqu'une nouvelle demande de devis est créée dans un rayon de 200km du point d'arrivée de leurs missions en cours ou acceptées.

## Objectif

Permettre aux déménageurs d'optimiser leurs trajets retour en trouvant des opportunités de déménagement à proximité de leurs destinations actuelles, augmentant ainsi leur rentabilité.

## Fonctionnement

### 1. Données géographiques

Ajout de 4 nouvelles colonnes à la table `quote_requests` :
- `from_latitude` : Latitude du point de départ
- `from_longitude` : Longitude du point de départ
- `to_latitude` : Latitude du point d'arrivée
- `to_longitude` : Longitude du point d'arrivée

Ces coordonnées doivent être renseignées lors de la création d'une demande de devis via l'API Google Maps.

### 2. Calcul de distance

Fonction `calculate_distance_km()` qui utilise la **formule de Haversine** pour calculer la distance en kilomètres entre deux points GPS.

### 3. Logique de notification

Quand une nouvelle demande de devis est créée :

1. Le système parcourt tous les déménageurs vérifiés et actifs
2. Pour chaque déménageur, il cherche ses missions en cours ou acceptées (statut `accepted` ou `ongoing`)
3. Il calcule la distance entre :
   - Le point d'ARRIVÉE de la mission existante du déménageur
   - Le point de DÉPART de la nouvelle demande
4. Si la distance ≤ 200km, une notification est envoyée au déménageur

### 4. Type de notification

**Type** : `nearby_mission_opportunity`

**Message** :
```
"Une nouvelle demande de déménagement depuis [Ville] est disponible à seulement [X] km
du point d'arrivée de votre mission à [Ville existante] (prévue le [Date]).
Cela pourrait être une opportunité de rentabiliser votre retour !"
```

**Données incluses** :
- `quote_request_id` : ID de la nouvelle demande
- `existing_mission_id` : ID de la mission existante
- `distance_km` : Distance calculée
- `from_city` : Ville de départ de la nouvelle demande
- `to_city` : Ville d'arrivée de la nouvelle demande
- `existing_mission_to_city` : Ville d'arrivée de la mission existante
- `existing_mission_date` : Date de la mission existante
- `moving_date` : Date de la nouvelle demande

## Vue d'analyse

Une vue SQL `nearby_mission_opportunities` permet d'analyser toutes les opportunités disponibles pour chaque déménageur.

## Intégration Frontend

### 1. Lors de la création d'une demande de devis

```typescript
// Dans ClientQuotePage.tsx ou équivalent
const handleSubmit = async (formData) => {
  // Utiliser Google Maps Geocoding API pour obtenir les coordonnées
  const fromCoords = await geocodeAddress(formData.from_address);
  const toCoords = await geocodeAddress(formData.to_address);

  const quoteData = {
    ...formData,
    from_latitude: fromCoords.lat,
    from_longitude: fromCoords.lng,
    to_latitude: toCoords.lat,
    to_longitude: toCoords.lng
  };

  await supabase.from('quote_requests').insert([quoteData]);
};
```

### 2. Affichage des notifications

Les notifications de type `nearby_mission_opportunity` doivent être affichées avec :
- Une icône spéciale (ex: RouteIcon ou MapPinIcon)
- La distance en km mise en évidence
- Un bouton pour voir les détails de la demande

```typescript
// Dans NotificationBell.tsx
if (notification.type === 'nearby_mission_opportunity') {
  return (
    <div className="notification-nearby-mission">
      <MapPinIcon className="text-green-500" />
      <div>
        <strong>Opportunité proche !</strong>
        <p>{notification.message}</p>
        <span className="badge">
          {notification.data?.distance_km} km
        </span>
      </div>
    </div>
  );
}
```

## Avantages

1. **Optimisation logistique** : Réduction des trajets à vide
2. **Augmentation de rentabilité** : Plus de missions par trajet
3. **Expérience utilisateur** : Notifications pertinentes et utiles
4. **Automatisation** : Aucune intervention manuelle nécessaire

## Migration à appliquer

Le fichier de migration `20260127225000_add_nearby_mission_notifications.sql` contient :
- Ajout des colonnes de coordonnées
- Fonction de calcul de distance
- Fonction de notification automatique
- Trigger sur insertion de nouvelle demande
- Vue d'analyse
