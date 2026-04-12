import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  missionLetterContent: string;
  paymentId: string;
  clientComments?: string;
  clientSignature?: boolean;
}

interface AnalysisResult {
  isApproved: boolean;
  hasNegativeComments: boolean;
  hasClientSignature: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  detectedIssues: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { missionLetterContent, paymentId, clientComments, clientSignature }: AnalysisRequest = await req.json();

    if (!missionLetterContent || !paymentId) {
      return new Response(
        JSON.stringify({ error: 'Mission letter content and payment ID are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const analysis = await analyzeMissionLetter(missionLetterContent, clientComments, clientSignature);

    if (analysis.isApproved && analysis.riskLevel === 'low') {
      const authHeader = req.headers.get('Authorization');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

      if (supabaseUrl && supabaseKey && authHeader) {
        const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_payment_release_request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            p_payment_id: paymentId,
            p_ai_analysis: analysis,
          }),
        });

        if (!createResponse.ok) {
          console.error('Failed to create release request:', await createResponse.text());
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error analyzing mission letter:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzeMissionLetter(
  content: string,
  clientComments?: string,
  clientSignature?: boolean
): Promise<AnalysisResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  const detectedIssues: string[] = [];
  const recommendations: string[] = [];
  let hasNegativeComments = false;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (!clientSignature) {
    detectedIssues.push('La lettre de mission n\'est pas signée par le client');
    riskLevel = 'high';
    recommendations.push('Obtenir la signature du client avant de débloquer le paiement');
  }

  if (clientComments && openaiApiKey) {
    try {
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
              content: `Analyze these client comments about a moving service. Return ONLY JSON:
{
  "hasNegativeComments": true/false,
  "sentiment": "positive/neutral/negative",
  "issues": ["list of issues mentioned"],
  "summary": "brief summary"
}

Client comments: ${clientComments}`
            }
          ],
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const aiAnalysis = JSON.parse(jsonMatch[0]);
          hasNegativeComments = aiAnalysis.hasNegativeComments || aiAnalysis.sentiment === 'negative';

          if (hasNegativeComments) {
            detectedIssues.push(`Commentaires négatifs détectés: ${aiAnalysis.summary}`);
            if (aiAnalysis.issues) {
              aiAnalysis.issues.forEach((issue: string) => detectedIssues.push(issue));
            }
            riskLevel = 'high';
            recommendations.push('Examiner les commentaires du client avant d\'approuver le déblocage');
            recommendations.push('Contacter le client pour résoudre les problèmes mentionnés');
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing comments with AI:', error);
    }
  } else if (clientComments) {
    const negativeKeywords = [
      'insatisfait', 'problème', 'dégât', 'casse', 'retard', 'mauvais',
      'incomplet', 'manquant', 'abîmé', 'endommagé', 'plainte', 'réclamation',
      'litige', 'désaccord', 'mécontent',
    ];

    const lowerComments = clientComments.toLowerCase();
    for (const keyword of negativeKeywords) {
      if (lowerComments.includes(keyword)) {
        hasNegativeComments = true;
        detectedIssues.push(`Commentaire négatif détecté: "${keyword}"`);
        break;
      }
    }

    if (hasNegativeComments) {
      riskLevel = 'high';
      recommendations.push('Examiner les commentaires du client avant d\'approuver le déblocage');
      recommendations.push('Contacter le client pour résoudre les problèmes mentionnés');
    }
  }

  const contentLower = content.toLowerCase();

  const hasDate = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(content);
  const hasAddress = contentLower.includes('adresse') || contentLower.includes('rue');
  const hasServices = contentLower.includes('service') || contentLower.includes('prestation');

  if (!hasDate) {
    detectedIssues.push('Date manquante dans la lettre de mission');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  if (!hasAddress) {
    detectedIssues.push('Adresse manquante dans la lettre de mission');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  if (!hasServices) {
    detectedIssues.push('Services non spécifiés dans la lettre de mission');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  const isApproved = !hasNegativeComments && clientSignature === true && detectedIssues.length === 0;

  let summary = '';
  if (isApproved) {
    summary = 'Mission terminée avec succès. Tous les critères sont remplis pour le déblocage du paiement.';
  } else if (hasNegativeComments) {
    summary = 'Mission terminée mais des commentaires négatifs du client nécessitent une vérification manuelle.';
  } else if (!clientSignature) {
    summary = 'Mission terminée mais la signature du client est manquante. Déblocage non recommandé.';
  } else {
    summary = `Mission terminée avec ${detectedIssues.length} problème(s) mineur(s). Vérification recommandée.`;
  }

  if (isApproved) {
    recommendations.push('Le déblocage du paiement peut être effectué automatiquement');
  } else {
    recommendations.push('Une vérification manuelle par un administrateur est recommandée');
  }

  return {
    isApproved,
    hasNegativeComments,
    hasClientSignature: clientSignature === true,
    riskLevel,
    summary,
    recommendations,
    detectedIssues,
  };
}