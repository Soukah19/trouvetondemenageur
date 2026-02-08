import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuoteRequestData {
  volume_m3?: number;
  surface_m2?: number;
  distance_km?: number;
  from_city: string;
  to_city: string;
  floor_from?: number;
  floor_to?: number;
  elevator_from?: boolean;
  elevator_to?: boolean;
  services_needed?: string[];
  furniture_lift_needed_departure?: boolean;
  furniture_lift_needed_arrival?: boolean;
  accepts_groupage?: boolean;
  moving_date?: string;
}

interface PriceEstimationRequest {
  quoteRequest: QuoteRequestData;
  moverPrice: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { quoteRequest, moverPrice }: PriceEstimationRequest = await req.json();
    
    // Calculate our own market estimate first (mover-level fair price)
    const marketEstimate = calculateMarketEstimate(quoteRequest);
    
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      // No AI key: use our own calculation to compare
      const result = compareToMarket(moverPrice, marketEstimate);
      return new Response(
        JSON.stringify({
          success: true,
          indicator: result.indicator,
          confidence: result.confidence,
          reasoning: result.reasoning,
          method: 'calculation'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // With AI: ask AI to estimate the fair MOVER price, then compare with moverPrice
    const prompt = buildPrompt(quoteRequest, moverPrice);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0,
        seed: 42,
        max_tokens: 400,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    let parsedResponse;
    try {
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      // Fallback to our own calculation
      const result = compareToMarket(moverPrice, marketEstimate);
      return new Response(
        JSON.stringify({
          success: true,
          indicator: result.indicator,
          confidence: result.confidence,
          reasoning: result.reasoning,
          method: 'calculation_fallback'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize reasoning: remove any euro amounts
    let sanitizedReasoning = parsedResponse.reasoning || '';
    sanitizedReasoning = sanitizedReasoning.replace(/\d[\d\s.,]*\s*€/g, '***€');
    sanitizedReasoning = sanitizedReasoning.replace(/\d[\d\s.,]*\s*euros?/gi, '*** euros');

    return new Response(
      JSON.stringify({
        success: true,
        indicator: parsedResponse.indicator,
        confidence: parsedResponse.confidence,
        reasoning: sanitizedReasoning,
        method: 'ai'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in estimate-market-price:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// =====================================================
// SYSTEM PROMPT FOR AI
// =====================================================
const SYSTEM_PROMPT = `Tu es un expert en tarification de déménagements en France et en Europe.

On te donne les détails d'un déménagement et le PRIX PROPOSÉ PAR LE DÉMÉNAGEUR (c'est le prix que le déménageur facture, AVANT la commission de la plateforme).

Ta mission:
1. Estime le juste prix du marché que facturerait un déménageur professionnel pour CE déménagement
2. Compare le prix proposé avec ton estimation
3. Donne ton verdict

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide:
{
  "estimated_market_price": number,
  "indicator": "conforme" | "proche" | "eloigne_bas" | "eloigne_haut",
  "confidence": number (0-100),
  "reasoning": "string (explication courte en français, SANS mentionner de montants en euros)"
}

BARÈME DE RÉFÉRENCE (prix déménageur professionnel):

=== PRIX DE BASE PAR VOLUME ===
- Local (<50km): 50€/m³
- National longue distance (>200km): 65€/m³
- International: 100€/m³

=== VOLUMES PAR TYPE DE LOGEMENT ===
Studio=15m³, T1=20m³, T2=30m³, T3=45m³, T4=60m³, T5=75m³, Maison=90m³

=== DISTANCE (3 paliers) ===
- 0-50 km: GRATUIT (inclus dans le prix de base)
- 51-200 km: (distance - 50) × 0.60€/km
- 201+ km: 90€ + (distance - 200) × 0.45€/km

=== INTERNATIONAL ===
- Volume: 100€/m³
- Distance: 2.00€/km + 400€ frais admin/douane

=== SUPPLÉMENTS ===
- Étage sans ascenseur: 80€/étage (départ ET arrivée)
- Avec ascenseur: 0€
- Monte-meuble: 400€/utilisation
- Emballage/Déballage: 250€
- Démontage/Remontage: 300€
- Fourniture cartons: 80€
- Garde-meubles: 150€
- Objets fragiles: 120€
- Nettoyage: 180€
- Piano: 350€
- Groupage: -25%

=== SEUILS DE COMPARAISON ===
Compare le prix du déménageur avec ton estimation:
- "conforme": à ±15% de ton estimation → bon prix
- "proche": à ±15-30% de ton estimation → acceptable mais décalé
- "eloigne_bas": < -30% → suspicieusement bas
- "eloigne_haut": > +30% → trop cher

=== FACTEURS SAISONNIERS ===
- Haute saison (juin-sept): +10-20%
- Week-end: +10%
- Paris/IDF: +10-20% vs province

RAPPELS:
- Le prix donné est celui du DÉMÉNAGEUR, pas du client
- Ne mentionne JAMAIS de montants en euros dans "reasoning"
- Donne "estimated_market_price" en nombre entier`;

// =====================================================
// BUILD USER PROMPT
// =====================================================
function buildPrompt(quoteRequest: QuoteRequestData, moverPrice: number): string {
  const details: string[] = [];
  
  details.push(`Trajet: ${quoteRequest.from_city} → ${quoteRequest.to_city}`);
  
  if (quoteRequest.distance_km) {
    details.push(`Distance: ${quoteRequest.distance_km} km`);
  }
  
  if (quoteRequest.volume_m3) {
    details.push(`Volume: ${quoteRequest.volume_m3} m³`);
  }
  
  if (quoteRequest.surface_m2) {
    details.push(`Surface du logement: ${quoteRequest.surface_m2} m²`);
  }
  
  if (quoteRequest.floor_from !== undefined) {
    const elevatorFrom = quoteRequest.elevator_from ? '(avec ascenseur)' : '(SANS ascenseur)';
    details.push(`Étage départ: ${quoteRequest.floor_from === 0 ? 'RDC' : `${quoteRequest.floor_from}e`} ${elevatorFrom}`);
  }
  
  if (quoteRequest.floor_to !== undefined) {
    const elevatorTo = quoteRequest.elevator_to ? '(avec ascenseur)' : '(SANS ascenseur)';
    details.push(`Étage arrivée: ${quoteRequest.floor_to === 0 ? 'RDC' : `${quoteRequest.floor_to}e`} ${elevatorTo}`);
  }
  
  if (quoteRequest.furniture_lift_needed_departure) {
    details.push("Monte-meuble au DÉPART: OUI");
  }
  
  if (quoteRequest.furniture_lift_needed_arrival) {
    details.push("Monte-meuble à l'ARRIVÉE: OUI");
  }
  
  if (quoteRequest.services_needed && quoteRequest.services_needed.length > 0) {
    details.push(`Services demandés: ${quoteRequest.services_needed.join(', ')}`);
  }
  
  if (quoteRequest.accepts_groupage) {
    details.push("Groupage: OUI (réduction attendue)");
  }
  
  if (quoteRequest.moving_date) {
    const date = new Date(quoteRequest.moving_date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const month = date.getMonth() + 1;
    const isHighSeason = month >= 6 && month <= 9;
    
    details.push(`Date: ${date.toLocaleDateString('fr-FR')}${isWeekend ? ' (WEEK-END)' : ''}${isHighSeason ? ' (HAUTE SAISON)' : ''}`);
  }

  return `Détails du déménagement:
${details.join('\n')}

Prix proposé par le déménageur: ${moverPrice}€

Estime le juste prix du marché pour ce déménagement et compare-le au prix proposé par le déménageur.`;
}

// =====================================================
// LOCAL MARKET ESTIMATE (fallback when no AI key)
// =====================================================
function calculateMarketEstimate(quoteRequest: QuoteRequestData): number {
  const distance = quoteRequest.distance_km || 0;
  const isInternational = detectInternational(quoteRequest);
  
  const ratePerM3 = isInternational ? 100 : (distance > 200 ? 65 : 50);
  
  let estimate = 0;
  
  // Base price
  if (quoteRequest.volume_m3 && quoteRequest.volume_m3 > 0) {
    estimate = quoteRequest.volume_m3 * ratePerM3;
  } else if (quoteRequest.surface_m2 && quoteRequest.surface_m2 > 0) {
    estimate = quoteRequest.surface_m2 * 22;
  } else {
    estimate = 1500; // T2 default
  }
  
  // Distance cost
  if (distance > 0) {
    if (isInternational) {
      estimate += distance * 2.0 + 400;
    } else if (distance > 200) {
      estimate += 90 + (distance - 200) * 0.45;
    } else if (distance > 50) {
      estimate += (distance - 50) * 0.60;
    }
  }
  
  // Floor costs
  if (quoteRequest.floor_from && !quoteRequest.elevator_from) {
    estimate += quoteRequest.floor_from * 80;
  }
  if (quoteRequest.floor_to && !quoteRequest.elevator_to) {
    estimate += quoteRequest.floor_to * 80;
  }
  
  // Furniture lift
  if (quoteRequest.furniture_lift_needed_departure) estimate += 400;
  if (quoteRequest.furniture_lift_needed_arrival) estimate += 400;
  
  // Services
  const serviceCosts: Record<string, number> = {
    'emballage/déballage': 250,
    'démontage/remontage meubles': 300,
    'fourniture de cartons': 80,
    'garde-meubles': 150,
    'transport d\'objets fragiles': 120,
    'nettoyage après déménagement': 180,
    'piano': 350,
  };
  
  if (quoteRequest.services_needed) {
    for (const service of quoteRequest.services_needed) {
      const key = service.toLowerCase();
      estimate += serviceCosts[key] || 0;
    }
  }
  
  // Groupage discount
  if (quoteRequest.accepts_groupage) {
    estimate *= 0.75;
  }
  
  // Season/weekend adjustments
  if (quoteRequest.moving_date) {
    const date = new Date(quoteRequest.moving_date);
    const month = date.getMonth() + 1;
    const isHighSeason = month >= 6 && month <= 9;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    if (isHighSeason) estimate *= 1.15;
    if (isWeekend) estimate *= 1.10;
  }
  
  return Math.round(estimate);
}

// =====================================================
// COMPARE MOVER PRICE TO MARKET ESTIMATE
// =====================================================
function compareToMarket(moverPrice: number, marketEstimate: number): {
  indicator: string;
  confidence: number;
  reasoning: string;
} {
  if (marketEstimate <= 0) {
    return { indicator: 'conforme', confidence: 30, reasoning: 'Données insuffisantes pour une estimation précise.' };
  }
  
  const deviation = ((moverPrice - marketEstimate) / marketEstimate) * 100;
  
  let indicator: string;
  let reasoning: string;
  let confidence = 70;
  
  if (Math.abs(deviation) <= 15) {
    indicator = 'conforme';
    reasoning = 'Le prix proposé est cohérent avec les tarifs habituels du marché pour ce type de déménagement.';
    confidence = 80;
  } else if (deviation > 15 && deviation <= 30) {
    indicator = 'proche';
    reasoning = 'Le prix est légèrement supérieur à la moyenne du marché. Cela reste acceptable mais le client pourrait trouver moins cher.';
    confidence = 75;
  } else if (deviation < -15 && deviation >= -30) {
    indicator = 'proche';
    reasoning = 'Le prix est en dessous de la moyenne du marché. Bon rapport qualité-prix mais assurez-vous de couvrir vos frais.';
    confidence = 75;
  } else if (deviation < -30) {
    indicator = 'eloigne_bas';
    reasoning = 'Le prix est significativement inférieur au marché. Le client pourrait douter de la qualité du service.';
    confidence = 70;
  } else {
    indicator = 'eloigne_haut';
    reasoning = 'Le prix est nettement au-dessus du marché. Le client risque de choisir un concurrent moins cher.';
    confidence = 70;
  }
  
  return { indicator, confidence, reasoning };
}

// =====================================================
// DETECT INTERNATIONAL MOVE
// =====================================================
function detectInternational(quoteRequest: QuoteRequestData): boolean {
  const distance = quoteRequest.distance_km || 0;
  const fromCity = (quoteRequest.from_city || '').toLowerCase();
  const toCity = (quoteRequest.to_city || '').toLowerCase();
  
  const foreignCities: string[] = [
    // Belgium
    'bruxelles', 'brussels', 'liège', 'anvers', 'gand', 'namur', 'mons', 'charleroi',
    'woluwe', 'ixelles', 'schaerbeek', 'anderlecht', 'uccle', 'etterbeek', 'molenbeek',
    'forest', 'jette', 'auderghem', 'evere', 'oostende', 'bruges', 'leuven', 'hasselt',
    'genk', 'mechelen', 'turnhout', 'kortrijk', 'aalst',
    // Switzerland
    'zurich', 'zürich', 'bern', 'berne', 'basel', 'bâle', 'genève', 'geneva',
    'lausanne', 'lucerne', 'luzern', 'winterthur', 'lugano', 'fribourg', 'neuchâtel',
    'sion', 'yverdon', 'thun',
    // Germany
    'berlin', 'münchen', 'munich', 'hamburg', 'köln', 'cologne', 'frankfurt',
    'stuttgart', 'düsseldorf', 'dortmund', 'essen', 'bremen', 'dresden', 'leipzig',
    'hannover', 'nürnberg', 'bonn', 'aachen', 'mannheim', 'karlsruhe',
    // Luxembourg
    'luxembourg', 'esch-sur-alzette', 'differdange', 'dudelange',
    // Netherlands
    'amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven', 'groningen',
    'maastricht', 'breda', 'arnhem',
  ];
  
  const fromIsForeign = foreignCities.some(city => fromCity.includes(city));
  const toIsForeign = foreignCities.some(city => toCity.includes(city));
  
  if (fromIsForeign !== toIsForeign) return true;
  if (fromIsForeign && toIsForeign) return true;
  if (distance > 500) return true;
  
  return false;
}
