import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { moverId } = await req.json();

    if (!moverId) {
      throw new Error('Missing moverId');
    }

    console.log(`Analyzing documents for mover: ${moverId}`);

    const { data: mover, error: moverError } = await supabase
      .from('movers')
      .select('*')
      .eq('id', moverId)
      .single();

    if (moverError || !mover) {
      throw new Error('Mover not found');
    }

    console.log(`Found mover: ${mover.company_name}`);

    const { data: documents, error: docsError } = await supabase
      .from('mover_documents')
      .select('*')
      .eq('mover_id', moverId);

    if (docsError) {
      throw new Error('Error loading documents: ' + docsError.message);
    }

    console.log(`Found ${documents?.length || 0} documents`);

    const verificationReport = {
      moverId,
      moverName: mover.company_name,
      siret: mover.siret,
      managerName: `${mover.manager_firstname} ${mover.manager_lastname}`,
      overallStatus: 'verified' as 'verified' | 'needs_review' | 'rejected',
      checks: [] as any[],
      alerts: [] as any[],
      expirationWarnings: [] as any[],
      score: 100,
      documentAnalysis: [] as any[]
    };

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      verificationReport.alerts.push({
        type: 'configuration',
        severity: 'warning',
        message: 'IA non disponible - vérification manuelle requise'
      });
    }

    for (const doc of documents || []) {
      console.log(`\nAnalyzing document: ${doc.document_type}`);
      
      const docAnalysis: any = {
        documentType: doc.document_type,
        documentName: doc.document_name,
        verificationStatus: doc.verification_status,
        findings: []
      };

      if (openaiApiKey) {
        try {
          console.log(`Downloading document from storage: ${doc.document_url}`);
          
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('identity-documents')
            .download(doc.document_url);

          if (downloadError) {
            throw new Error(`Storage download error: ${downloadError.message}`);
          }

          if (!fileData) {
            throw new Error('No file data returned');
          }

          console.log(`Downloaded file, size: ${fileData.size} bytes`);

          const arrayBuffer = await fileData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const base64 = btoa(String.fromCharCode(...bytes));

          console.log(`Converted to base64, length: ${base64.length}`);

          const isPDF = doc.document_url.toLowerCase().endsWith('.pdf');
          const mimeType = isPDF ? 'application/pdf' : 'image/jpeg';

          let prompt = '';
          switch (doc.document_type) {
            case 'kbis':
              prompt = `Analyse ce document KBIS et vérifie les éléments suivants:
- Nom de l'entreprise: "${mover.company_name}"
- SIRET: "${mover.siret}"
- Nom du gérant: "${mover.manager_firstname} ${mover.manager_lastname}"
- Date d'immatriculation
- Adresse: "${mover.address}, ${mover.postal_code} ${mover.city}"

Vérifie la cohérence de toutes les informations. Détecte toute anomalie, incohérence ou information manquante.`;
              break;
            case 'insurance':
              prompt = `Analyse ce document d'assurance RC PRO et vérifie:
- Nom de l'entreprise assuré: "${mover.company_name}"
- SIRET: "${mover.siret}"
- Type d'assurance (doit être RC PRO pour déménagement)
- Date de validité et d'expiration
- Montant de couverture
- Numéro de police

Identifie toute anomalie ou date expirée.`;
              break;
            case 'license':
              prompt = `Analyse cette licence de transport et vérifie:
- Nom de l'entreprise: "${mover.company_name}"
- SIRET: "${mover.siret}"
- Type de licence (transport de marchandises)
- Date de validité et d'expiration
- Numéro de licence

Identifie toute anomalie ou date expirée.`;
              break;
            case 'identity_recto':
            case 'identity_verso':
              prompt = `Analyse cette pièce d'identité et vérifie:
- Nom: "${mover.manager_lastname}"
- Prénom: "${mover.manager_firstname}"
- Date de naissance
- Date d'expiration
- Numéro du document

Identifie toute anomalie, document expiré ou incohérence avec les informations fournies.`;
              break;
            default:
              prompt = `Analyse ce document et vérifie sa validité et sa cohérence.`;
          }

          console.log(`Calling OpenAI API...`);

          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: prompt + '\n\nRéponds en JSON avec: { "isValid": boolean, "findings": string[], "anomalies": string[], "expirationDate": "YYYY-MM-DD" ou null, "confidence": number }'
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:${mimeType};base64,${base64}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1000
            }),
          });

          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
          }

          const openaiResult = await openaiResponse.json();
          console.log(`OpenAI response received`);
          
          const content = openaiResult.choices[0]?.message?.content || '{}';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            docAnalysis.aiAnalysis = analysis;
            docAnalysis.findings = analysis.findings || [];
            
            console.log(`Analysis result - isValid: ${analysis.isValid}, confidence: ${analysis.confidence}`);

            if (!analysis.isValid) {
              verificationReport.score -= 15;
              verificationReport.overallStatus = 'needs_review';
            }

            if (analysis.anomalies && analysis.anomalies.length > 0) {
              analysis.anomalies.forEach((anomaly: string) => {
                verificationReport.alerts.push({
                  type: doc.document_type,
                  severity: 'warning',
                  message: anomaly
                });
              });
            }

            if (analysis.expirationDate) {
              const expDate = new Date(analysis.expirationDate);
              const today = new Date();
              const daysUntilExpiration = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (daysUntilExpiration < 0) {
                verificationReport.alerts.push({
                  type: doc.document_type,
                  severity: 'critical',
                  message: `Document expiré depuis le ${analysis.expirationDate}`
                });
                verificationReport.overallStatus = 'rejected';
                verificationReport.score -= 30;
              } else if (daysUntilExpiration < 30) {
                verificationReport.expirationWarnings.push({
                  documentType: doc.document_name,
                  expirationDate: analysis.expirationDate,
                  daysUntilExpiration
                });
              }
            }
          }
        } catch (error: any) {
          console.error(`Error analyzing ${doc.document_type}:`, error);
          docAnalysis.error = error.message;
          docAnalysis.findings.push(`Erreur d'analyse: ${error.message}`);
        }
      }

      verificationReport.documentAnalysis.push(docAnalysis);
    }

    if (!documents || documents.length === 0) {
      verificationReport.alerts.push({
        type: 'documents',
        severity: 'critical',
        message: 'Aucun document trouvé pour ce déménageur'
      });
      verificationReport.overallStatus = 'rejected';
    }

    const requiredDocs = ['kbis', 'insurance', 'license', 'identity_recto', 'identity_verso'];
    const missingDocs = requiredDocs.filter(type => 
      !documents?.some(doc => doc.document_type === type)
    );

    if (missingDocs.length > 0) {
      verificationReport.alerts.push({
        type: 'documents',
        severity: 'critical',
        message: `Documents manquants: ${missingDocs.join(', ')}`
      });
      verificationReport.overallStatus = 'needs_review';
      verificationReport.score -= 20 * missingDocs.length;
    }

    if (verificationReport.score < 0) verificationReport.score = 0;

    console.log(`\nVerification complete - Status: ${verificationReport.overallStatus}, Score: ${verificationReport.score}`);

    return new Response(JSON.stringify(verificationReport), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
