# Déploiement de la fonction calculate-distance

## Prérequis
- Compte Supabase avec accès au projet
- Clé API Google Maps avec l'API Distance Matrix activée

## Méthode 1: Via le Dashboard Supabase (Recommandé)

### Étape 1: Créer la fonction
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **Edge Functions** dans le menu de gauche
4. Cliquez sur **New Function** ou **Create a new function**
5. Nom de la fonction: `calculate-distance`

### Étape 2: Coller le code
Copiez et collez ce code:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DistanceRequest {
  fromAddress: string;
  fromCity: string;
  fromPostalCode: string;
  toAddress: string;
  toCity: string;
  toPostalCode: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { fromAddress, fromCity, fromPostalCode, toAddress, toCity, toPostalCode }: DistanceRequest = await req.json();

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const origin = `${fromAddress}, ${fromPostalCode} ${fromCity}`;
    const destination = `${toAddress}, ${toPostalCode} ${toCity}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
      const element = data.rows[0].elements[0];
      
      return new Response(
        JSON.stringify({
          success: true,
          distance: element.distance.value / 1000,
          distanceText: element.distance.text,
          duration: element.duration.value / 60,
          durationText: element.duration.text,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    throw new Error(`Distance calculation failed: ${data.status}`);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
```

### Étape 3: Configurer la clé API Google Maps
1. Allez dans **Project Settings** (icône engrenage)
2. Cliquez sur **Edge Functions** dans le menu
3. Cliquez sur **Manage Secrets**
4. Ajoutez un nouveau secret:
   - **Nom**: `GOOGLE_MAPS_API_KEY`
   - **Valeur**: `AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg`

### Étape 4: Vérifier le déploiement
Testez la fonction avec curl:

```bash
curl -X POST 'https://bvvbkaluajgdurxnnqqu.supabase.co/functions/v1/calculate-distance' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmJrYWx1YWpnZHVyeG5ucXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzc5NDUsImV4cCI6MjA4NTIxMzk0NX0.kbNeCEFy19pcvZhbSXUldeR52SfQS6wjTcbZsqryLRA' \
  -d '{
    "fromAddress": "10 Rue de Rivoli",
    "fromCity": "Paris",
    "fromPostalCode": "75001",
    "toAddress": "1 Place Bellecour",
    "toCity": "Lyon",
    "toPostalCode": "69002"
  }'
```

Réponse attendue:
```json
{
  "success": true,
  "distance": 465.2,
  "distanceText": "465 km",
  "duration": 267,
  "durationText": "4 heures 27 min"
}
```

## Méthode 2: Via Supabase CLI

```bash
# Se connecter
supabase login

# Lier le projet
supabase link --project-ref bvvbkaluajgdurxnnqqu

# Définir le secret
supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSyBabRmqkmMOKOL9UrZXuTbZ_EIFoMZZLYg

# Déployer la fonction
supabase functions deploy calculate-distance
```

## Configuration Google Maps API

Assurez-vous que votre clé Google Maps a les APIs suivantes activées:
1. **Distance Matrix API** (obligatoire pour cette fonction)
2. **Places API** (pour l'autocomplétion d'adresses)
3. **Geocoding API** (optionnel)

Pour vérifier/activer:
1. Allez sur https://console.cloud.google.com
2. Sélectionnez votre projet
3. APIs & Services → Library
4. Recherchez "Distance Matrix API" et activez-la

## Dépannage

### Erreur "Google Maps API key not configured"
→ Vérifiez que le secret `GOOGLE_MAPS_API_KEY` est bien configuré dans les secrets Edge Functions

### Erreur "REQUEST_DENIED"
→ Vérifiez que l'API Distance Matrix est activée dans votre projet Google Cloud

### Erreur "OVER_QUERY_LIMIT"
→ Vous avez dépassé votre quota. Vérifiez votre facturation Google Cloud

### La fonction ne répond pas
→ Vérifiez que la fonction est bien déployée et active dans le dashboard Supabase
