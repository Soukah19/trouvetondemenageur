import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { documentUrl, documentType, managerName, kbisName } = await req.json();

    if (!documentUrl || !documentType) {
      throw new Error('Missing required fields: documentUrl, documentType');
    }

    const aiAnalysis = await analyzeIdentityDocument(documentUrl, documentType);

    const namesMatch = kbisName && managerName ?
      compareNames(aiAnalysis.extractedName, managerName, kbisName) : false;

    const { data: mover, error: moverError } = await supabase
      .from('movers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (moverError || !mover) {
      throw new Error('Mover profile not found');
    }

    const verificationData = {
      mover_id: mover.id,
      document_url: documentUrl,
      document_type: documentType,
      extracted_name: aiAnalysis.extractedName,
      extracted_birth_date: aiAnalysis.extractedBirthDate,
      is_authentic: aiAnalysis.isAuthentic,
      confidence_score: aiAnalysis.confidenceScore,
      verification_status: aiAnalysis.isAuthentic && aiAnalysis.confidenceScore >= 70 ? 'verified' : 'pending',
      kbis_name_match: namesMatch,
      verification_notes: aiAnalysis.notes,
      verified_at: aiAnalysis.isAuthentic && aiAnalysis.confidenceScore >= 70 ? new Date().toISOString() : null,
    };

    const { data: verification, error: verificationError } = await supabase
      .from('identity_verifications')
      .insert(verificationData)
      .select()
      .single();

    if (verificationError) {
      throw verificationError;
    }

    if (aiAnalysis.isAuthentic && aiAnalysis.confidenceScore >= 70 && namesMatch) {
      await supabase
        .from('movers')
        .update({ identity_verified: true })
        .eq('id', mover.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification,
        analysis: {
          isAuthentic: aiAnalysis.isAuthentic,
          confidenceScore: aiAnalysis.confidenceScore,
          extractedName: aiAnalysis.extractedName,
          namesMatch,
          status: verificationData.verification_status,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error verifying identity document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function analyzeIdentityDocument(documentUrl: string, documentType: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Analyze this French identity document (${documentType}).

Extract and return ONLY a JSON object with these exact fields:
{
  "isAuthentic": true/false,
  "confidenceScore": 0-100,
  "extractedName": "Full name from document",
  "extractedBirthDate": "DD/MM/YYYY",
  "notes": "Brief verification notes"
}

Check for:
- Document authenticity (security features, formatting, quality)
- Clear, readable text
- Valid French ID format
- No signs of tampering or forgery

Confidence score:
- 90-100: High confidence, clearly authentic
- 70-89: Moderate confidence, appears valid
- Below 70: Low confidence, may be suspect`;

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
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: documentUrl } }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      isAuthentic: analysis.isAuthentic || false,
      confidenceScore: analysis.confidenceScore || 0,
      extractedName: analysis.extractedName || '',
      extractedBirthDate: analysis.extractedBirthDate || '',
      notes: analysis.notes || 'Analysis completed',
    };
  } catch (error) {
    console.error("Error analyzing identity document:", error);
    return {
      isAuthentic: false,
      confidenceScore: 0,
      extractedName: '',
      extractedBirthDate: '',
      notes: `Analysis failed: ${error.message}. Manual review required.`,
    };
  }
}

function compareNames(extractedName: string, managerName: string, kbisName: string): boolean {
  const normalize = (name: string) =>
    name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim();

  const extracted = normalize(extractedName);
  const manager = normalize(managerName);
  const kbis = normalize(kbisName);

  return extracted === manager || extracted === kbis ||
         extracted.includes(manager) || manager.includes(extracted) ||
         extracted.includes(kbis) || kbis.includes(extracted);
}