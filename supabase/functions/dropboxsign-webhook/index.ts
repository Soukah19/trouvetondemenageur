import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const DROPBOXSIGN_API_KEY = Deno.env.get("DROPBOXSIGN_API_KEY")!;
  const authHeader = "Basic " + btoa(DROPBOXSIGN_API_KEY + ":");

  try {
    // Dropbox Sign sends webhook events as form data with a "json" field
    const contentType = req.headers.get("content-type") || "";
    let event: any;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const jsonStr = formData.get("json") as string;
      event = JSON.parse(jsonStr);
    } else {
      // Fallback: try JSON body
      event = await req.json();
    }

    console.log("Dropbox Sign webhook event:", JSON.stringify(event).substring(0, 500));

    const eventType = event.event?.event_type;
    const signatureRequestData = event.signature_request;
    const signatureRequestId = signatureRequestData?.signature_request_id;

    console.log(`Webhook: event=${eventType}, srId=${signatureRequestId}`);

    // Dropbox Sign requires this exact response to validate the callback URL
    // On the initial "callback_test" event, we must respond with this
    if (eventType === "callback_test") {
      console.log("Callback test received, responding with confirmation");
      return new Response("Hello API Event Received", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (!signatureRequestId) {
      return new Response("Hello API Event Received", { status: 200 });
    }

    // Find contract in our database
    const { data: contract } = await supabase
      .from("mover_contracts")
      .select("*, movers(*)")
      .eq("signature_request_id", signatureRequestId)
      .single();

    if (!contract) {
      console.log("Contract not found for signature request:", signatureRequestId);
      return new Response("Hello API Event Received", { status: 200 });
    }

    console.log(`Contract ${contract.id}, mover ${contract.mover_id}, current status: ${contract.status}`);

    // ════════════════════════════════════════════════════════════
    // Handle: signature_request_all_signed (all signers done)
    // ════════════════════════════════════════════════════════════
    if (eventType === "signature_request_all_signed") {

      // Download signed PDF
      let signedPdfUrl: string | null = null;
      try {
        const dlRes = await fetch(
          `https://api.hellosign.com/v3/signature_request/files/${signatureRequestId}`,
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
          if (uploadData) signedPdfUrl = uploadData.path;
          console.log("Signed PDF stored:", signedPdfUrl);
        } else {
          console.error("PDF download failed:", dlRes.status);
        }
      } catch (e) { console.error("PDF error:", e); }

      // Update contract
      await supabase.from("mover_contracts").update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signed_pdf_url: signedPdfUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", contract.id);

      // ⭐ ACTIVATE MOVER
      await supabase.from("movers").update({
        verification_status: "verified",
        is_active: true,
        last_verification_date: new Date().toISOString(),
      }).eq("id", contract.mover_id);
      console.log("Mover activated:", contract.mover_id);

      // Welcome email to mover
      try {
        const mover = contract.movers;
        if (mover?.user_id) {
          await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userType: "mover",
              userId: mover.user_id,
              companyName: mover.company_name,
              isValidation: true,
            }),
          });
        }
      } catch (e) { console.error("Welcome email error:", e); }

      // Admin notifications + emails
      const companyName = contract.movers?.company_name || contract.contract_data?.company_name || "Un déménageur";
      try {
        const { data: admins } = await supabase.from("admins").select("user_id, email");
        if (admins?.length) {
          await supabase.from("notifications").insert(admins.map((a: any) => ({
            user_id: a.user_id,
            user_type: "admin",
            type: "mover_registration",
            title: "✅ Contrat signé !",
            message: `${companyName} a signé son contrat partenaire. Compte activé automatiquement.`,
            related_id: contract.mover_id,
            read: false,
          })));

          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            for (const admin of admins) {
              if (!admin.email) continue;
              try {
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "TrouveTonDemenageur <noreply@trouvetondemenageur.fr>",
                    to: [admin.email],
                    subject: `✅ ${companyName} a signé le contrat partenaire`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;"><h2 style="color:#10B981;">Contrat signé !</h2><p><strong>${companyName}</strong> a signé le contrat partenaire via Dropbox Sign.</p><p>Compte <strong>automatiquement activé</strong>.</p><a href="https://www.trouvetondemenageur.fr/admin/dashboard/contracts" style="display:inline-block;background:#10B981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;margin-top:10px;">Voir les contrats →</a></div>`,
                  }),
                });
              } catch (e) { console.error("Admin email error:", e); }
              await new Promise(r => setTimeout(r, 600));
            }
          }
        }
      } catch (e) { console.error("Notification error:", e); }

    // ════════════════════════════════════════════════════════════
    // Handle: signature_request_declined
    // ════════════════════════════════════════════════════════════
    } else if (eventType === "signature_request_declined") {
      await supabase.from("mover_contracts").update({
        status: "declined",
        declined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", contract.id);

      await supabase.from("movers").update({
        verification_status: "documents_verified",
      }).eq("id", contract.mover_id);

      const { data: admins } = await supabase.from("admins").select("user_id");
      if (admins?.length) {
        await supabase.from("notifications").insert(admins.map((a: any) => ({
          user_id: a.user_id,
          user_type: "admin",
          type: "mover_registration",
          title: "❌ Contrat refusé",
          message: `${contract.movers?.company_name || "Un déménageur"} a refusé le contrat.`,
          related_id: contract.mover_id,
          read: false,
        })));
      }

    // ════════════════════════════════════════════════════════════
    // Handle: signature_request_signed (individual signer signed)
    // For single-signer flows this is the same as all_signed,
    // but we let all_signed handle activation to be safe
    // ════════════════════════════════════════════════════════════
    } else if (eventType === "signature_request_signed") {
      // Update status to "opened" to indicate activity, but don't activate yet
      if (contract.status === "sent") {
        await supabase.from("mover_contracts").update({
          status: "opened",
          updated_at: new Date().toISOString(),
        }).eq("id", contract.id);
        console.log("Contract marked as opened (signer interacted)");
      }

    // ════════════════════════════════════════════════════════════
    // Handle: signature_request_viewed
    // ════════════════════════════════════════════════════════════
    } else if (eventType === "signature_request_viewed") {
      if (contract.status === "sent") {
        await supabase.from("mover_contracts").update({
          status: "opened",
          opened_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", contract.id);
        console.log("Contract marked as opened (viewed)");
      }

    } else {
      console.log("Unhandled event:", eventType);
    }

    // Dropbox Sign expects this exact response text
    return new Response("Hello API Event Received", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent retries on processing errors
    return new Response("Hello API Event Received", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
