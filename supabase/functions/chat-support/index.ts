import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Server-side blocklist for confidential topics - extra safety net
const BLOCKED_PATTERNS = [
  /commission/i,
  /marge\s*(bénéficiaire|de la plateforme|nette|brute)?/i,
  /pourcentage\s*(que vous|prélevé|pris|de la plateforme)/i,
  /combien\s*(gagne|prend|prélève|touche)\s*(la plateforme|ttd|trouvetondemenageur)/i,
  /business\s*model/i,
  /modèle\s*(économique|de revenus|financier)/i,
  /répartition\s*(des revenus|financière)/i,
  /part\s*(de la plateforme|du déménageur|prélevée)/i,
  /frais\s*de\s*(service|plateforme)\s*(en|de)\s*pourcentage/i,
];

const CONFIDENTIAL_RESPONSE =
  "Ces informations sont confidentielles et internes à l'entreprise. Je peux en revanche vous aider avec toute question sur nos services de déménagement, les devis, les tarifs ou le fonctionnement de la plateforme! 😊";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "AI service not configured",
          response:
            "Notre assistant IA est temporairement indisponible. Veuillez réessayer plus tard ou contactez-nous au 01 89 70 78 81.",
        }),
        {
          status: 200, // Return 200 so frontend can use the fallback message
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Server-side check: block confidential questions before they reach OpenAI
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");
    if (lastUserMessage) {
      const userText = lastUserMessage.content.toLowerCase();
      const isBlocked = BLOCKED_PATTERNS.some((pattern) =>
        pattern.test(userText)
      );
      if (isBlocked) {
        return new Response(
          JSON.stringify({ response: CONFIDENTIAL_RESPONSE }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Cost-effective and very capable for support chat
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "AI service error",
          response:
            "Notre assistant rencontre un problème technique. Veuillez réessayer dans quelques instants ou contactez-nous directement au 01 89 70 78 81.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await openaiResponse.json();
    const assistantMessage =
      data.choices?.[0]?.message?.content ||
      "Je suis désolé, je n'ai pas pu générer de réponse. Contactez notre support au 01 89 70 78 81.";

    // Server-side safety: check if OpenAI accidentally leaked commission info
    const responseText = assistantMessage.toLowerCase();
    if (
      responseText.includes("30%") ||
      responseText.includes("70%") ||
      (responseText.includes("commission") &&
        (responseText.includes("%") || responseText.includes("pour cent")))
    ) {
      return new Response(
        JSON.stringify({ response: CONFIDENTIAL_RESPONSE }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ response: assistantMessage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat support error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        response:
          "Une erreur s'est produite. Veuillez réessayer ou contactez-nous au 01 89 70 78 81.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
