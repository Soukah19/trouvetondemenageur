import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ═══════════════════════════════════════════════════════════════
// Helper: Add a "Fiche Partenaire" page to the contract PDF
// with the mover's information (name, email, SIRET, phone, etc.)
// ═══════════════════════════════════════════════════════════════
async function addMoverInfoPage(pdfBytes: ArrayBuffer, mover: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add a new page at the end
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // ── Colors ──
  const green = rgb(0.30, 0.69, 0.31);
  const darkGreen = rgb(0.22, 0.56, 0.24);
  const darkText = rgb(0.13, 0.13, 0.13);
  const grayText = rgb(0.46, 0.46, 0.46);
  const lightGray = rgb(0.88, 0.88, 0.88);

  // ── Title ──
  page.drawText("FICHE PARTENAIRE", {
    x: margin,
    y,
    size: 22,
    font: helveticaBold,
    color: darkGreen,
  });
  y -= 8;

  // Green line under title
  page.drawRectangle({
    x: margin,
    y,
    width: width - margin * 2,
    height: 2,
    color: green,
  });
  y -= 25;

  // ── Subtitle ──
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  page.drawText(`Contrat de partenariat — Généré le ${today}`, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: grayText,
  });
  y -= 35;

  // ── Helper functions ──
  const drawSectionTitle = (title: string) => {
    page.drawRectangle({
      x: margin,
      y: y - 2,
      width: width - margin * 2,
      height: 22,
      color: green,
    });
    page.drawText(title, {
      x: margin + 10,
      y: y + 3,
      size: 11,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    y -= 30;
  };

  const drawField = (label: string, value: string) => {
    page.drawText(label, {
      x: margin + 10,
      y,
      size: 10,
      font: helveticaBold,
      color: darkText,
    });
    page.drawText(value || "Non renseigné", {
      x: margin + 180,
      y,
      size: 10,
      font: helvetica,
      color: value ? darkText : grayText,
    });
    y -= 18;
  };

  const drawSeparator = () => {
    page.drawRectangle({
      x: margin + 10,
      y: y + 8,
      width: width - margin * 2 - 20,
      height: 0.5,
      color: lightGray,
    });
  };

  // ── SECTION 1: Entreprise ──
  drawSectionTitle("INFORMATIONS DE L'ENTREPRISE");

  drawField("Raison sociale", mover.company_name || "");
  drawSeparator();
  drawField("SIRET", mover.siret || "");
  drawSeparator();
  drawField("Adresse", mover.address || "");
  drawSeparator();
  const cityLine = [mover.postal_code, mover.city].filter(Boolean).join(" ");
  drawField("Ville", cityLine);
  drawSeparator();
  drawField("Téléphone", mover.phone || "");
  drawSeparator();
  drawField("Email", mover.email || "");
  y -= 15;

  // ── SECTION 2: Responsable ──
  drawSectionTitle("RESPONSABLE / GÉRANT");

  const managerName = `${mover.manager_firstname || ""} ${mover.manager_lastname || ""}`.trim();
  drawField("Nom complet", managerName);
  drawSeparator();
  drawField("Téléphone", mover.manager_phone || mover.phone || "");
  drawSeparator();
  drawField("Email", mover.email || "");
  y -= 15;

  // ── SECTION 3: Services ──
  if (mover.services && mover.services.length > 0) {
    drawSectionTitle("SERVICES PROPOSÉS");
    const services = (mover.services || []).filter((s: string) => s && s !== "null");
    const servicesText = services.join(", ");
    const maxLineWidth = width - margin * 2 - 20;
    const words = servicesText.split(", ");
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine}, ${word}` : word;
      const testWidth = helvetica.widthOfTextAtSize(testLine, 10);
      if (testWidth > maxLineWidth && currentLine) {
        page.drawText(currentLine, { x: margin + 10, y, size: 10, font: helvetica, color: darkText });
        y -= 16;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, { x: margin + 10, y, size: 10, font: helvetica, color: darkText });
      y -= 16;
    }
    y -= 10;
  }

  // ── SECTION 4: Couverture ──
  if (mover.coverage_area && mover.coverage_area.length > 0) {
    drawSectionTitle("ZONES DE COUVERTURE");
    const areas = (mover.coverage_area || []).filter((s: string) => s && s !== "null");
    const areasText = areas.join(", ");
    const maxLineWidth = width - margin * 2 - 20;
    const words = areasText.split(", ");
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine}, ${word}` : word;
      const testWidth = helvetica.widthOfTextAtSize(testLine, 10);
      if (testWidth > maxLineWidth && currentLine) {
        page.drawText(currentLine, { x: margin + 10, y, size: 10, font: helvetica, color: darkText });
        y -= 16;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, { x: margin + 10, y, size: 10, font: helvetica, color: darkText });
      y -= 16;
    }
    y -= 10;
  }

  // ── Footer ──
  page.drawRectangle({
    x: margin,
    y: 45,
    width: width - margin * 2,
    height: 0.5,
    color: green,
  });
  page.drawText("Document généré automatiquement par TrouveTonDéménageur.fr", {
    x: margin,
    y: 32,
    size: 7,
    font: helvetica,
    color: grayText,
  });

  // ── Page numbers on ALL pages ──
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdfDoc.getPage(i);
    const { width: pw } = p.getSize();
    p.drawText(`${i + 1}/${totalPages}`, {
      x: pw - 70,
      y: 32,
      size: 7,
      font: helvetica,
      color: grayText,
    });
  }

  return pdfDoc.save();
}

// ═══════════════════════════════════════════════════════════════
// Main Edge Function
// ═══════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const DROPBOXSIGN_API_KEY = Deno.env.get("DROPBOXSIGN_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { moverId } = await req.json();
    if (!moverId) throw new Error("moverId requis");

    // 1. Fetch mover
    const { data: mover, error: moverErr } = await supabase
      .from("movers").select("*").eq("id", moverId).single();
    if (moverErr || !mover) throw new Error("Déménageur introuvable");

    // 2. Check no active contract already exists
    const { data: existing } = await supabase
      .from("mover_contracts")
      .select("id, status")
      .eq("mover_id", moverId)
      .in("status", ["sent", "opened"])
      .limit(1);
    if (existing && existing.length > 0) {
      throw new Error("Un contrat est déjà en attente de signature pour ce déménageur.");
    }

    // 3. Load static contract PDF template from Supabase Storage
    const templateUrl = `${supabaseUrl}/storage/v1/object/public/contract-templates/contrat_partenariat.pdf`;
    const pdfResp = await fetch(templateUrl);
    if (!pdfResp.ok) throw new Error("Impossible de charger le template PDF du contrat. Vérifiez que le fichier contrat_partenariat.pdf est dans le bucket contract-templates.");
    const templatePdfBuffer = await pdfResp.arrayBuffer();

    // 4. Generate personalized PDF with mover info page appended
    console.log("Generating personalized PDF for:", mover.company_name);
    const personalizedPdf = await addMoverInfoPage(templatePdfBuffer, mover);
    console.log("Personalized PDF generated:", personalizedPdf.byteLength, "bytes");

    // 5. Create Signature Request via Dropbox Sign API (single call)
    const signerName = `${mover.manager_firstname || "Gérant"} ${mover.manager_lastname || mover.company_name}`.trim();

    const formData = new FormData();
    formData.append("title", `Contrat Partenaire TTD - ${mover.company_name}`);
    formData.append("subject", `Contrat de partenariat TrouveTonDéménageur`);
    formData.append("message", `Bonjour ${signerName},\n\nVeuillez signer le contrat de partenariat TrouveTonDéménageur ci-joint.\n\nCordialement,\nL'équipe TrouveTonDéménageur`);
    formData.append("signers[0][email_address]", mover.email);
    formData.append("signers[0][name]", signerName);
    formData.append("signers[0][order]", "0");
    formData.append("file[0]", new Blob([personalizedPdf], { type: "application/pdf" }), `contrat_partenaire_${mover.company_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    formData.append("signing_options[draw]", "true");
    formData.append("signing_options[type]", "true");
    formData.append("signing_options[upload]", "true");
    formData.append("signing_options[phone]", "false");
    formData.append("signing_options[default_type]", "draw");
    formData.append("test_mode", Deno.env.get("DROPBOXSIGN_TEST_MODE") || "false");

    const authHeader = "Basic " + btoa(DROPBOXSIGN_API_KEY + ":");

    const srRes = await fetch("https://api.hellosign.com/v3/signature_request/send", {
      method: "POST",
      headers: { "Authorization": authHeader },
      body: formData,
    });
    const srData = await srRes.json();
    if (!srRes.ok) {
      throw new Error(`Erreur création signature Dropbox Sign: ${JSON.stringify(srData)}`);
    }

    const signatureRequest = srData.signature_request;
    const signatureRequestId = signatureRequest.signature_request_id;
    const signatures = signatureRequest.signatures || [];
    const signerId = signatures[0]?.signature_id || null;

    console.log("Signature request created:", signatureRequestId);
    console.log("Signer ID:", signerId);

    // 6. Save to database
    const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from("mover_contracts").insert({
      mover_id: moverId,
      signature_request_id: signatureRequestId,
      signer_id: signerId,
      status: "sent",
      sent_at: new Date().toISOString(),
      expires_at: expirationDate.toISOString(),
      contract_data: {
        company_name: mover.company_name,
        siret: mover.siret,
        email: mover.email,
        manager: signerName,
        phone: mover.phone,
        manager_phone: mover.manager_phone,
        address: mover.address,
        city: mover.city,
        postal_code: mover.postal_code,
      },
    });

    // 7. Update mover verification_status
    await supabase.from("movers").update({
      verification_status: "contract_sent",
    }).eq("id", moverId);

    // 8. Notify admins
    try {
      const { data: admins } = await supabase.from("admins").select("user_id");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a: any) => ({
            user_id: a.user_id,
            user_type: "admin",
            type: "mover_registration",
            title: "📝 Contrat Dropbox Sign envoyé",
            message: `Le contrat partenaire a été envoyé à ${mover.company_name} (${mover.email}) via Dropbox Sign.`,
            related_id: moverId,
            read: false,
          }))
        );
      }
    } catch (e) { console.error("Notification error:", e); }

    return new Response(
      JSON.stringify({ success: true, signatureRequestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
