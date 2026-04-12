import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { email, companyName, managerFirstname, managerLastname, prospectType } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appUrl = Deno.env.get("APP_URL") || "https://www.trouvetondemenageur.fr";
    const isMover = prospectType === 'mover';

    const recipientName = [managerFirstname, managerLastname].filter(Boolean).join(" ") || (isMover ? "Cher professionnel" : "Bonjour");

    const emailHtml = isMover ? `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #10B981; color: white !important; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; border-radius: 0 0 12px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
          .highlight-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 26px;">🚚 Découvrez TrouveTonDemenageur</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 15px;">La plateforme qui connecte déménageurs et clients</p>
          </div>
          <div class="content">
            <p>Bonjour ${recipientName},</p>
            
            <p>Nous souhaitons vous présenter <strong>TrouveTonDemenageur</strong>, une plateforme innovante conçue pour les professionnels du déménagement comme ${companyName || "vous"}.</p>
            
            <div class="highlight-box">
              <p style="margin: 0;"><strong>💡 Pourquoi rejoindre TrouveTonDemenageur ?</strong></p>
              <ul style="margin: 10px 0 0; padding-left: 20px;">
                <li>Recevez des demandes de devis qualifiées dans votre zone</li>
                <li>Paiements sécurisés et garantis</li>
                <li>Tableau de bord professionnel pour gérer vos missions</li>
                <li>Visibilité accrue auprès de milliers de clients</li>
                <li>Inscription gratuite, vous ne payez que lorsque vous recevez des missions</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${appUrl}" class="button">Découvrir la plateforme →</a>
            </div>

            <p>Si notre plateforme vous intéresse, vous pouvez vous inscrire directement depuis notre site. Notre équipe se tient à votre disposition pour toute question.</p>
            
            <p style="margin-top: 25px;">
              Cordialement,<br>
              <strong>L'équipe TrouveTonDemenageur</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 TrouveTonDemenageur — Tous droits réservés</p>
            <p>Besoin d'aide ? Contactez-nous à support@trouvetondemenageur.fr</p>
            <p style="font-size: 11px; color: #9ca3af;">Si vous ne souhaitez plus recevoir ces emails, ignorez simplement ce message.</p>
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; border-radius: 0 0 12px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
          .highlight-box { background: #EFF6FF; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 26px;">🏠 TrouveTonDemenageur</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 15px;">Votre déménagement simplifié</p>
          </div>
          <div class="content">
            <p>${recipientName},</p>
            
            <p>Vous envisagez un déménagement ? <strong>TrouveTonDemenageur</strong> vous aide à trouver le meilleur déménageur au meilleur prix.</p>
            
            <div class="highlight-box">
              <p style="margin: 0;"><strong>✨ Ce que nous vous offrons</strong></p>
              <ul style="margin: 10px 0 0; padding-left: 20px;">
                <li>Comparez les devis de déménageurs vérifiés</li>
                <li>Paiement 100% sécurisé</li>
                <li>Protection IA anti-litiges</li>
                <li>Suivi en temps réel de votre déménagement</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${appUrl}" class="button">Demander un devis gratuit →</a>
            </div>
            
            <p style="margin-top: 25px;">
              À bientôt,<br>
              <strong>L'équipe TrouveTonDemenageur</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 TrouveTonDemenageur — Tous droits réservés</p>
            <p style="font-size: 11px; color: #9ca3af;">Si vous ne souhaitez plus recevoir ces emails, ignorez simplement ce message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = isMover
      ? `🚚 ${companyName || "Votre entreprise"} — Découvrez TrouveTonDemenageur`
      : `🏠 Simplifiez votre déménagement avec TrouveTonDemenageur`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TrouveTonDemenageur <noreply@trouvetondemenageur.fr>",
        to: [email],
        subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Discovery email sent to:", email, result);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
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
