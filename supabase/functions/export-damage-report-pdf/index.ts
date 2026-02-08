import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { quoteId } = await req.json();

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: "Quote ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        quote_requests(*),
        movers(*)
      `)
      .eq("id", quoteId)
      .maybeSingle();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: photos, error: photosError } = await supabase
      .from("moving_photos")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });

    if (photosError) {
      console.error("Error fetching photos:", photosError);
    }

    const { data: damageReports, error: damageError } = await supabase
      .from("damage_reports")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });

    if (damageError) {
      console.error("Error fetching damage reports:", damageError);
    }

    const htmlContent = generateHTMLReport(quote, photos || [], damageReports || []);

    const jsPDFUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    const html2canvasUrl = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="${html2canvasUrl}"></script>
  <script src="${jsPDFUrl}"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .report-container { max-width: 800px; margin: 0 auto; }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #059669; margin-top: 30px; }
    .info-section { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #1f2937; }
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .photo-item { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
    .photo-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
    .photo-caption { margin-top: 8px; font-size: 12px; color: #6b7280; }
    .damage-card { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .damage-severity { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .severity-minor { background: #fef3c7; color: #92400e; }
    .severity-moderate { background: #fed7aa; color: #9a3412; }
    .severity-severe { background: #fecaca; color: #991b1b; }
    .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #d1d5db; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="report-container" id="report-content">
    ${htmlContent}
  </div>
  <script>
    window.onload = async function() {
      const { jsPDF } = window.jspdf;
      const element = document.getElementById('report-content');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const reader = new FileReader();
      reader.onloadend = function() {
        const base64data = reader.result.split(',')[1];
        console.log('PDF_BASE64:', base64data);
      };
      reader.readAsDataURL(pdfBlob);
    };
  </script>
</body>
</html>
    `;

    return new Response(
      JSON.stringify({
        success: true,
        html: fullHTML,
        message: "PDF report generated successfully",
        downloadUrl: `data:text/html;base64,${btoa(fullHTML)}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in export-damage-report-pdf:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to generate PDF report"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateHTMLReport(quote: any, photos: any[], damageReports: any[]): string {
  const quoteRequest = Array.isArray(quote.quote_requests) ? quote.quote_requests[0] : quote.quote_requests;
  const mover = Array.isArray(quote.movers) ? quote.movers[0] : quote.movers;
  
  const movingDate = quoteRequest?.moving_date ? new Date(quoteRequest.moving_date).toLocaleDateString('fr-FR') : 'N/A';
  const createdDate = new Date().toLocaleDateString('fr-FR');
  
  let photosHTML = '';
  if (photos.length > 0) {
    photosHTML = `
      <h2>Documentation photographique</h2>
      <div class="photo-grid">
        ${photos.map(photo => `
          <div class="photo-item">
            <img src="${photo.photo_url}" alt="Photo ${photo.photo_type}" />
            <div class="photo-caption">
              <strong>${photo.photo_type === 'before' ? 'Avant' : 'Après'} le déménagement</strong><br>
              ${photo.notes || 'Aucune note'}<br>
              ${new Date(photo.created_at).toLocaleString('fr-FR')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  let damagesHTML = '';
  if (damageReports && damageReports.length > 0) {
    damagesHTML = `
      <h2>Rapports de dommages</h2>
      ${damageReports.map(damage => {
        const severityClass = `severity-${damage.severity || 'minor'}`;
        return `
          <div class="damage-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; color: #991b1b;">${damage.item_description || 'Dommage signalé'}</h3>
              <span class="damage-severity ${severityClass}">${damage.severity || 'minor'}</span>
            </div>
            <p><strong>Description:</strong> ${damage.description || 'Aucune description'}</p>
            <p><strong>Date:</strong> ${new Date(damage.created_at).toLocaleString('fr-FR')}</p>
            ${damage.photo_url ? `<img src="${damage.photo_url}" style="max-width: 100%; height: auto; border-radius: 4px; margin-top: 10px;" />` : ''}
          </div>
        `;
      }).join('')}
    `;
  }
  
  return `
    <h1>Rapport de Déménagement</h1>
    <p style="color: #6b7280; font-style: italic;">Généré le ${createdDate}</p>
    
    <div class="info-section">
      <h2>Informations du déménagement</h2>
      <div class="info-row">
        <span class="label">Date du déménagement:</span>
        <span class="value">${movingDate}</span>
      </div>
      <div class="info-row">
        <span class="label">Départ:</span>
        <span class="value">${quoteRequest?.from_city || 'N/A'} (${quoteRequest?.from_postal_code || 'N/A'})</span>
      </div>
      <div class="info-row">
        <span class="label">Arrivée:</span>
        <span class="value">${quoteRequest?.to_city || 'N/A'} (${quoteRequest?.to_postal_code || 'N/A'})</span>
      </div>
      <div class="info-row">
        <span class="label">Type de bien:</span>
        <span class="value">${quoteRequest?.property_type || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Volume:</span>
        <span class="value">${quoteRequest?.total_volume || 'N/A'} m³</span>
      </div>
    </div>
    
    <div class="info-section">
      <h2>Déménageur</h2>
      <div class="info-row">
        <span class="label">Société:</span>
        <span class="value">${mover?.company_name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${mover?.email || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Téléphone:</span>
        <span class="value">${mover?.phone || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Prix:</span>
        <span class="value">${quote.client_display_price || quote.price} €</span>
      </div>
    </div>
    
    ${photosHTML}
    ${damagesHTML}
    
    <div class="footer">
      <p>Ce rapport a été généré automatiquement par TrouveTonDéménageur</p>
      <p>Pour toute question, contactez-nous à support@trouvetondemenageur.fr</p>
    </div>
  `;
}