import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisResult {
  success: boolean;
  blocked?: boolean;
  reason?: string;
  furniture_type?: string;
  estimated_volume?: number;
  description?: string;
}

function detectPersonalInfo(text: string): boolean {
  const patterns = [
    /\b\d{10}\b/g,
    /\b\d{2}[-.]?\s?\d{2}[-.]?\s?\d{2}[-.]?\s?\d{2}[-.]?\s?\d{2}\b/g,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b(?:\+33|0033|0)[1-9](?:[0-9]{8})\b/g,
    /\b(?:facebook|twitter|instagram|linkedin|whatsapp|telegram)(?:\.com)?\/[^\s]+/gi,
    /\b@[A-Za-z0-9_]+\b/g,
    /\b(?:contact|appelez|appelle|écrivez|email|mail|tel|telephone|mobile|portable)\s*[:=\s]\s*[^\s]+/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

async function analyzeFurnitureImage(imageBase64: string): Promise<AnalysisResult> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `Analysez cette image de mobilier et répondez UNIQUEMENT en JSON avec ce format exact:
{
  "has_personal_info": false,
  "furniture_type": "nom du meuble",
  "estimated_volume": 1.5,
  "description": "description courte"
}

IMPORTANT:
1. Détectez si l'image contient du TEXTE avec des informations personnelles (emails, téléphones, réseaux sociaux, URLs)
2. Si oui, mettez "has_personal_info": true
3. Sinon, identifiez le meuble et estimez son volume en m³
4. Volume typiques: canapé 2-3m³, lit 2-3m³, armoire 2-4m³, table 1-2m³, chaise 0.3-0.5m³

Répondez UNIQUEMENT avec le JSON, rien d'autre.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    if (analysis.has_personal_info || detectPersonalInfo(JSON.stringify(analysis))) {
      return {
        success: false,
        blocked: true,
        reason: "Image bloquée : détection d'informations personnelles (email, téléphone, réseaux sociaux). Pour votre sécurité, n'incluez pas de coordonnées dans les photos."
      };
    }

    return {
      success: true,
      furniture_type: analysis.furniture_type || "Meuble non identifié",
      estimated_volume: analysis.estimated_volume || 1.0,
      description: analysis.description || "",
    };

  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      success: false,
      reason: `Erreur d'analyse: ${error.message}`,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "Image base64 requise" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await analyzeFurnitureImage(image_base64);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});