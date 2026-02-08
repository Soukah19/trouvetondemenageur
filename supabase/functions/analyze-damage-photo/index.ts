import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { imageUrl, imageBase64, photoType } = body;

    // Accept either imageUrl or imageBase64
    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image URL or base64 data is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      // Return fallback if no API key
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            hasDamage: false,
            damageDescription: "Analyse automatique non disponible - vérification manuelle requise",
            severity: "unknown",
            items: [],
            condition: "À vérifier manuellement",
            recommendations: ["Veuillez examiner manuellement cette photo"],
            analyzedAt: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const analysisPrompt = `Analyze this moving photo taken ${photoType === 'before' ? 'BEFORE' : 'AFTER'} the move.

Provide a detailed JSON response with:
1. "hasDamage": boolean - true if any damage, scratches, dents, broken items, or concerns are visible
2. "damageDescription": string - detailed description of any damage found (empty string if none)
3. "severity": string - "none", "minor", "moderate", or "severe"
4. "items": array of strings - list of items/furniture visible in the photo
5. "condition": string - overall condition assessment
6. "recommendations": array of strings - any recommendations or concerns

Be thorough and objective. Even small scratches or dents should be noted.`;

    // Build the image content for OpenAI
    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              imageContent
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);

      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            hasDamage: false,
            damageDescription: "Analyse automatique non disponible - vérification manuelle requise",
            severity: "unknown",
            items: [],
            condition: "Requiert une inspection manuelle",
            recommendations: ["Veuillez examiner manuellement cette photo"],
            analyzedAt: new Date().toISOString(),
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResult = await openAIResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          hasDamage: analysis.hasDamage || false,
          damageDescription: analysis.damageDescription || "",
          severity: analysis.severity || "none",
          items: analysis.items || [],
          condition: analysis.condition || "Good",
          recommendations: analysis.recommendations || [],
          analyzedAt: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-damage-photo:", error);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          hasDamage: false,
          damageDescription: "Erreur lors de l'analyse - vérification manuelle requise",
          severity: "unknown",
          items: [],
          condition: "Erreur lors de l'analyse",
          recommendations: ["Inspection manuelle requise suite à une erreur d'analyse"]
        },
        analyzedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});