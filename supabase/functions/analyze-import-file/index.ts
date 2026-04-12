import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImportRow {
  [key: string]: any;
}

interface AnalyzedData {
  userType: 'client' | 'mover' | 'unknown';
  mappedData: any[];
  confidence: number;
  suggestions: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY non configurée");
    }

    const { rows, userType } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune donnée fournie" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prendre les 3 premières lignes comme échantillon
    const sampleRows = rows.slice(0, 3);
    const columns = Object.keys(sampleRows[0]);

    console.log("Analyse IA de l'import:", { userType, colonnes: columns, lignes: rows.length });

    // Demander à l'IA d'analyser et mapper les colonnes
    const prompt = userType === 'client'
      ? `Tu es un expert en analyse de données. Analyse ce fichier d'import de CLIENTS pour une plateforme de déménagement.

Colonnes trouvées: ${columns.join(', ')}
Échantillon de données: ${JSON.stringify(sampleRows, null, 2)}

Pour chaque ligne, extrais et structure les informations suivantes:
- email (obligatoire)
- nom complet ou prénom + nom
- téléphone (format français si possible)
- adresse complète si disponible
- ville
- code postal
- date de déménagement prévue si mentionnée
- volume estimé si mentionné
- toute information supplémentaire pertinente

Retourne un JSON avec:
{
  "mappedData": [
    {
      "email": "...",
      "nom": "...",
      "telephone": "...",
      "adresse": "...",
      "ville": "...",
      "code_postal": "...",
      "date_demenagement": "YYYY-MM-DD" ou null,
      "notes": "informations supplémentaires",
      "confidence": 0-100
    }
  ],
  "confidence": 0-100,
  "suggestions": ["conseil 1", "conseil 2"]
}

Applique cette analyse à TOUTES les ${rows.length} lignes du fichier.`
      : `Tu es un expert en analyse de données. Analyse ce fichier d'import de DÉMÉNAGEURS pour une plateforme de déménagement.

Colonnes trouvées: ${columns.join(', ')}
Échantillon de données: ${JSON.stringify(sampleRows, null, 2)}

Pour chaque ligne, extrais et structure les informations suivantes:
- email (obligatoire)
- nom de l'entreprise
- SIRET (14 chiffres)
- prénom du gérant
- nom du gérant
- téléphone (format français si possible)
- adresse complète
- ville
- code postal
- site web si disponible
- toute information supplémentaire pertinente

Retourne un JSON avec:
{
  "mappedData": [
    {
      "email": "...",
      "entreprise": "...",
      "siret": "...",
      "prenom": "...",
      "nom": "...",
      "telephone": "...",
      "adresse": "...",
      "ville": "...",
      "code_postal": "...",
      "site_web": "...",
      "notes": "informations supplémentaires",
      "confidence": 0-100
    }
  ],
  "confidence": 0-100,
  "suggestions": ["conseil 1", "conseil 2"]
}

Applique cette analyse à TOUTES les ${rows.length} lignes du fichier.`;

    // Appel à l'API OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en extraction et normalisation de données. Tu réponds toujours en JSON valide."
          },
          {
            role: "user",
            content: prompt + "\n\nDonnées complètes:\n" + JSON.stringify(rows, null, 2)
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("Erreur OpenAI:", error);
      throw new Error(`Erreur OpenAI: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log("Analyse IA terminée:", {
      lignes_analysees: analysis.mappedData?.length || 0,
      confidence: analysis.confidence
    });

    return new Response(
      JSON.stringify({
        success: true,
        userType,
        mappedData: analysis.mappedData || [],
        confidence: analysis.confidence || 0,
        suggestions: analysis.suggestions || [],
        totalRows: rows.length,
        analyzedRows: analysis.mappedData?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Erreur analyse import:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors de l'analyse du fichier",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
