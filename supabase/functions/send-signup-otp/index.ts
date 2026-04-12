import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateOTP(): string {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, userType, profileData } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userType || !["client", "mover"].includes(userType)) {
      return new Response(
        JSON.stringify({ error: "Type d'utilisateur invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // Check role
      const { data: moverData } = await supabaseAdmin
        .from("movers").select("id").eq("user_id", existingUser.id).maybeSingle();
      const { data: clientData } = await supabaseAdmin
        .from("clients").select("id").eq("user_id", existingUser.id).maybeSingle();
      const { data: adminData } = await supabaseAdmin
        .from("admins").select("id").eq("user_id", existingUser.id).maybeSingle();

      if (adminData) {
        return new Response(
          JSON.stringify({ error: "Cette adresse email est déjà utilisée par un compte administrateur." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (moverData && userType === "client") {
        return new Response(
          JSON.stringify({ error: "Cette adresse email est déjà utilisée par un compte déménageur. Veuillez utiliser la connexion partenaire." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (clientData && userType === "mover") {
        return new Response(
          JSON.stringify({ error: "Cette adresse email est déjà utilisée par un compte client. Veuillez utiliser la connexion client." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Ce compte existe déjà. Veuillez vous connecter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP and hash password
    const otpCode = generateOTP();
    const passwordHash = await hashPassword(password);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Upsert into pending_signups (replace if email already pending)
    const { error: upsertError } = await supabaseAdmin
      .from("pending_signups")
      .upsert(
        {
          email: normalizedEmail,
          password_hash: passwordHash,
          user_type: userType,
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt,
          profile_data: profileData || {},
          verified: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (upsertError) {
      console.error("Error saving pending signup:", upsertError);
      throw upsertError;
    }

    // Send OTP email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TrouveTonDemenageur <noreply@trouvetondemenageur.fr>",
        to: [normalizedEmail],
        subject: `${otpCode} — Code de vérification TrouveTonDemenageur`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin:0; font-size: 24px;">Vérification de votre email</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
              <p>Bonjour,</p>
              <p>Voici votre code de vérification pour créer votre compte sur <strong>TrouveTonDemenageur</strong> :</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: #F3F4F6; border: 2px solid #3B82F6; border-radius: 12px; padding: 20px 40px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #1F2937;">
                  ${otpCode}
                </div>
              </div>
              <p style="text-align: center; color: #6B7280; font-size: 14px;">Ce code expire dans <strong>15 minutes</strong>.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6B7280; font-size: 13px;">Si vous n'avez pas demandé ce code, ignorez simplement cet email.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    console.log("OTP sent to:", normalizedEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Code de vérification envoyé" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-signup-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});