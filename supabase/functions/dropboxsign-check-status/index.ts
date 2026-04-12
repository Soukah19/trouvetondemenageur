import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const DROPBOXSIGN_API_KEY = Deno.env.get("DROPBOXSIGN_API_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const authHeader = "Basic " + btoa(DROPBOXSIGN_API_KEY + ":");

    const { contractId, force } = await req.json();

    const { data: contract } = await supabase
      .from("mover_contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (!contract?.signature_request_id) {
      throw new Error("Contrat non trouvé");
    }

    // Fetch status from Dropbox Sign API
    const res = await fetch(
      `https://api.hellosign.com/v3/signature_request/${contract.signature_request_id}`,
      { headers: { "Authorization": authHeader } }
    );
    const srData = await res.json();
    if (!res.ok) throw new Error(`Dropbox Sign API: ${JSON.stringify(srData)}`);

    const signatureRequest = srData.signature_request;
    const isComplete = signatureRequest.is_complete;
    const isDeclined = signatureRequest.is_declined;
    const hasError = signatureRequest.has_error;

    // Check individual signer status
    const signatures = signatureRequest.signatures || [];
    const signerStatus = signatures[0]?.status_code || "unknown";

    console.log(`Dropbox Sign status for ${contract.id}: is_complete=${isComplete}, is_declined=${isDeclined}, signer=${signerStatus} (local: ${contract.status})`);

    // Map Dropbox Sign status to our internal status
    let newStatus = contract.status;
    if (isComplete) {
      newStatus = "signed";
    } else if (isDeclined) {
      newStatus = "declined";
    } else if (hasError) {
      newStatus = "error";
    } else if (signerStatus === "awaiting_signature") {
      newStatus = "sent";
    } else if (signerStatus === "signed") {
      newStatus = "signed";
    }

    // Check if expired (Dropbox Sign doesn't have a built-in expiry, we manage it ourselves)
    if (contract.expires_at && new Date(contract.expires_at) < new Date() && newStatus === "sent") {
      newStatus = "expired";
    }

    const statusChanged = newStatus !== contract.status;
    const shouldActivate = (newStatus === "signed") && (statusChanged || force);

    // Update contract status if changed
    if (statusChanged) {
      const updateData: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "signed") updateData.signed_at = new Date().toISOString();
      if (newStatus === "declined") updateData.declined_at = new Date().toISOString();
      if (newStatus === "expired") updateData.expired_at = new Date().toISOString();
      await supabase.from("mover_contracts").update(updateData).eq("id", contract.id);
      console.log(`Contract ${contract.id} status updated: ${contract.status} → ${newStatus}`);
    }

    let activated = false;
    let notified = false;
    let pdfStored = false;

    if (shouldActivate) {
      // ════════════════════════════════════════
      // 1. ACTIVATE MOVER
      // ════════════════════════════════════════
      const { error: moverErr } = await supabase.from("movers").update({
        verification_status: "verified",
        is_active: true,
        last_verification_date: new Date().toISOString(),
      }).eq("id", contract.mover_id);

      activated = !moverErr;
      if (moverErr) console.error("Mover activation error:", moverErr);
      else console.log("Mover activated:", contract.mover_id);

      // ════════════════════════════════════════
      // 2. DOWNLOAD & STORE SIGNED PDF
      // ════════════════════════════════════════
      if (!contract.signed_pdf_url) {
        try {
          // Dropbox Sign: GET /v3/signature_request/files/{id} returns the PDF directly
          const dlRes = await fetch(
            `https://api.hellosign.com/v3/signature_request/files/${contract.signature_request_id}`,
            {
              headers: {
                "Authorization": authHeader,
                "Accept": "application/pdf",
              },
            }
          );
          if (dlRes.ok) {
            const pdfBuffer = await dlRes.arrayBuffer();
            const filePath = `${contract.mover_id}/contrat_signe_${Date.now()}.pdf`;
            const { data: uploadData } = await supabase.storage
              .from("signed-contracts")
              .upload(filePath, pdfBuffer, { contentType: "application/pdf" });
            if (uploadData) {
              await supabase.from("mover_contracts").update({ signed_pdf_url: uploadData.path }).eq("id", contract.id);
              pdfStored = true;
              console.log("Signed PDF stored:", uploadData.path);
            }
          } else {
            console.error("PDF download failed:", dlRes.status, await dlRes.text());
          }
        } catch (e) { console.error("PDF error:", e); }
      } else {
        pdfStored = true;
      }

      // ════════════════════════════════════════
      // 3. ADMIN IN-APP NOTIFICATION
      // ════════════════════════════════════════
      const companyName = contract.contract_data?.company_name || "Un déménageur";
      try {
        const { data: admins } = await supabase.from("admins").select("user_id, email");
        console.log("Found admins:", JSON.stringify(admins));

        if (admins && admins.length > 0) {
          const { error: notifErr } = await supabase.from("notifications").insert(
            admins.map((a: any) => ({
              user_id: a.user_id,
              user_type: "admin",
              type: "mover_registration",
              title: "✅ Contrat signé !",
              message: `${companyName} a signé son contrat partenaire. Compte activé automatiquement.`,
              related_id: contract.mover_id,
              read: false,
            }))
          );
          if (notifErr) {
            console.error("Notification insert error:", notifErr);
          } else {
            notified = true;
            console.log("Admin notifications inserted");
          }

          // ════════════════════════════════════════
          // 4. ADMIN EMAIL via Resend
          // ════════════════════════════════════════
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          console.log("RESEND_API_KEY available:", !!resendApiKey);

          if (resendApiKey) {
            for (const admin of admins) {
              if (!admin.email) continue;
              try {
                const emailRes = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "TrouveTonDemenageur <noreply@trouvetondemenageur.fr>",
                    to: [admin.email],
                    subject: `✅ ${companyName} a signé le contrat partenaire`,
                    html: `
                      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                        <h2 style="color:#10B981;">✅ Contrat signé !</h2>
                        <p><strong>${companyName}</strong> a signé le contrat partenaire via Dropbox Sign.</p>
                        <p>Le compte a été <strong>automatiquement activé</strong>.</p>
                        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
                        <a href="https://www.trouvetondemenageur.fr/admin/dashboard/contracts" 
                           style="display:inline-block;background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">
                          Voir les contrats →
                        </a>
                      </div>`,
                  }),
                });
                const emailResult = await emailRes.json();
                console.log(`Email to ${admin.email}: status=${emailRes.status}`, JSON.stringify(emailResult));
              } catch (e) {
                console.error(`Email error for ${admin.email}:`, e);
              }
              await new Promise(r => setTimeout(r, 500));
            }
          } else {
            console.log("No RESEND_API_KEY — skipping admin emails");
          }
        }
      } catch (e) { console.error("Admin notification error:", e); }

      // ════════════════════════════════════════
      // 5. WELCOME EMAIL TO MOVER
      // ════════════════════════════════════════
      try {
        const { data: mover } = await supabase
          .from("movers")
          .select("user_id, company_name")
          .eq("id", contract.mover_id)
          .single();
        if (mover?.user_id) {
          const welRes = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userType: "mover",
              userId: mover.user_id,
              companyName: mover.company_name,
              isValidation: true,
            }),
          });
          console.log("Welcome email response:", welRes.status);
        }
      } catch (e) { console.error("Welcome email error:", e); }
    }

    return new Response(JSON.stringify({
      dropboxSignComplete: isComplete,
      localStatus: newStatus,
      statusChanged,
      activated,
      notified,
      pdfStored,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Check-status error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
