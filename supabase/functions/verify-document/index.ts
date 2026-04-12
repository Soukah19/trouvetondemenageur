import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerificationRequest {
  documentUrl: string;
  documentType: 'id_card' | 'passport' | 'insurance' | 'business_license' | 'driver_license';
  userId: string;
}

interface OCRResult {
  verified: boolean;
  extractedData: Record<string, any>;
  confidence: number;
  warnings: string[];
}

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

    const { documentUrl, documentType, userId }: VerificationRequest = await req.json();

    if (!documentUrl || !documentType || !userId) {
      throw new Error('Missing required fields: documentUrl, documentType, userId');
    }

    const ocrResult = await performOCR(documentUrl, documentType);

    const fraudAlerts = await detectFraud(supabase, ocrResult, userId, documentType);

    const { data: verification, error: verificationError } = await supabase
      .from('document_verifications')
      .insert({
        user_id: userId,
        document_type: documentType,
        document_url: documentUrl,
        verification_status: ocrResult.verified ? 'verified' : 'rejected',
        verification_data: ocrResult.extractedData,
        verified_at: new Date().toISOString(),
        verified_by: 'auto',
        rejection_reason: !ocrResult.verified ? ocrResult.warnings.join(', ') : null,
      })
      .select()
      .single();

    if (verificationError) {
      throw verificationError;
    }

    if (fraudAlerts.length > 0) {
      await supabase
        .from('fraud_alerts')
        .insert(fraudAlerts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification,
        fraudAlerts,
        ocrResult,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error verifying document:', error);
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

async function performOCR(documentUrl: string, documentType: string): Promise<OCRResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompts = {
    id_card: `Extract information from this French ID card. Return ONLY JSON:
{
  "documentNumber": "string",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "issueDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "nationality": "string"
}`,
    passport: `Extract information from this passport. Return ONLY JSON:
{
  "passportNumber": "string",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "issueDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "nationality": "string"
}`,
    business_license: `Extract information from this business license (KBIS). Return ONLY JSON:
{
  "businessName": "string",
  "siret": "string",
  "registrationDate": "YYYY-MM-DD",
  "legalStatus": "string"
}`,
    insurance: `Extract information from this insurance document. Return ONLY JSON:
{
  "policyNumber": "string",
  "insuranceCompany": "string",
  "coverageAmount": "string",
  "startDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD"
}`,
    driver_license: `Extract information from this driver's license. Return ONLY JSON:
{
  "licenseNumber": "string",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "issueDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "categories": ["array of strings"]
}`
  };

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
              { type: "text", text: prompts[documentType] },
              { type: "image_url", image_url: { url: documentUrl } }
            ]
          }
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
      throw new Error("No JSON found in AI response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    const warnings: string[] = [];
    let verified = true;
    let confidence = 0.95;

    if (extractedData.expiryDate) {
      const expiryDate = new Date(extractedData.expiryDate);
      if (expiryDate < new Date()) {
        warnings.push('Document expiré');
        verified = false;
        confidence = 0.3;
      }
    }

    return {
      verified,
      extractedData,
      confidence,
      warnings,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      verified: false,
      extractedData: {},
      confidence: 0,
      warnings: [`OCR failed: ${error.message}`],
    };
  }
}

async function detectFraud(
  supabase: any,
  ocrResult: OCRResult,
  userId: string,
  documentType: string
): Promise<any[]> {
  const alerts: any[] = [];

  const { data: existingDocs } = await supabase
    .from('document_verifications')
    .select('*')
    .eq('document_type', documentType)
    .neq('user_id', userId);

  if (existingDocs && existingDocs.length > 0) {
    for (const doc of existingDocs) {
      const docData = doc.verification_data;

      if (
        documentType === 'id_card' &&
        docData.documentNumber === ocrResult.extractedData.documentNumber
      ) {
        alerts.push({
          user_id: userId,
          alert_type: 'duplicate_document',
          severity: 'critical',
          details: {
            message: 'Numéro de document déjà utilisé par un autre utilisateur',
            documentType,
            documentNumber: ocrResult.extractedData.documentNumber,
            originalUserId: doc.user_id,
          },
        });
      }

      if (
        documentType === 'business_license' &&
        docData.siret === ocrResult.extractedData.siret
      ) {
        alerts.push({
          user_id: userId,
          alert_type: 'duplicate_document',
          severity: 'high',
          details: {
            message: 'SIRET déjà enregistré',
            siret: ocrResult.extractedData.siret,
            originalUserId: doc.user_id,
          },
        });
      }
    }
  }

  if (ocrResult.confidence < 0.7) {
    alerts.push({
      user_id: userId,
      alert_type: 'suspicious_activity',
      severity: 'medium',
      details: {
        message: 'Confiance OCR faible - vérification manuelle recommandée',
        confidence: ocrResult.confidence,
        documentType,
      },
    });
  }

  if (!ocrResult.verified) {
    alerts.push({
      user_id: userId,
      alert_type: 'fake_id',
      severity: 'high',
      details: {
        message: 'Document rejeté par la vérification automatique',
        warnings: ocrResult.warnings,
        documentType,
      },
    });
  }

  return alerts;
}