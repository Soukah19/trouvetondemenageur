import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { companyName, email, prospectId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create in-app notifications for all admins
    const { data: admins } = await supabase.from("admins").select("user_id, email");
    
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        user_type: 'admin',
        title: `🎉 Nouveau déménageur inscrit via invitation`,
        message: `${companyName || email} a accepté l'invitation et finalisé son inscription. Compte en attente de validation.`,
        type: 'mover_registration',
        related_id: prospectId || null,
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);

      // 2. Send email notification to all admins
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const adminEmails = admins.map(a => a.email).filter(Boolean);
        
        if (adminEmails.length > 0) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f4;">
              <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 25px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 22px;">🎉 Nouvelle inscription déménageur</h1>
                </div>
                <div style="padding: 25px;">
                  <p><strong>${companyName || "Un déménageur"}</strong> (${email}) a accepté l'invitation et finalisé son inscription sur la plateforme.</p>
                  <p>Son compte est en <strong>attente de validation</strong>. Rendez-vous dans le tableau d'administration pour vérifier ses documents et valider son compte.</p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="https://www.trouvetondemenageur.fr/admin/dashboard/pending_movers" style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Voir les demandes en attente →</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

          // Send to each admin individually to respect Resend limits
          for (const adminEmail of adminEmails) {
            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "TrouveTonDemenageur <noreply@trouvetondemenageur.fr>",
                  to: [adminEmail],
                  subject: `🎉 ${companyName || email} a rejoint la plateforme`,
                  html: emailHtml,
                }),
              });
            } catch (e) {
              console.error("Failed to email admin:", adminEmail, e);
            }
            // Small delay between emails (Resend free: 2/sec)
            await new Promise(r => setTimeout(r, 600));
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
