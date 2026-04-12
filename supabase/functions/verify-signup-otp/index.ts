import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const { email, code, password } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email et code requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // Find pending signup
    const { data: pending, error: fetchError } = await supabaseAdmin
      .from("pending_signups")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (fetchError || !pending) {
      return new Response(
        JSON.stringify({ error: "Aucune inscription en attente pour cet email. Veuillez vous réinscrire." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (pending.verified) {
      return new Response(
        JSON.stringify({ error: "Ce code a déjà été utilisé. Veuillez vous connecter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(pending.otp_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Le code a expiré. Veuillez demander un nouveau code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP code
    if (pending.otp_code !== normalizedCode) {
      return new Response(
        JSON.stringify({ error: "Code invalide. Veuillez vérifier et réessayer." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password matches (compare hashes)
    const passwordHash = await hashPassword(password);
    if (pending.password_hash !== passwordHash) {
      return new Response(
        JSON.stringify({ error: "Erreur de vérification. Veuillez vous réinscrire." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP verified! Now create the real auth user
    const profileData = pending.profile_data || {};
    const userType = pending.user_type;

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true, // Auto-confirm since we verified the email ourselves
      user_metadata: {
        email: normalizedEmail,
        user_type: userType,
        ...(profileData.firstName ? { first_name: profileData.firstName } : {}),
        ...(profileData.lastName ? { last_name: profileData.lastName } : {}),
        ...(profileData.phone ? { phone: profileData.phone } : {}),
      },
    });

    if (createError) {
      console.error("Error creating auth user:", createError);
      if (createError.message?.includes("already been registered")) {
        // Clean up pending signup
        await supabaseAdmin.from("pending_signups").delete().eq("email", normalizedEmail);
        return new Response(
          JSON.stringify({ error: "Ce compte existe déjà. Veuillez vous connecter." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    const userId = authData.user.id;

    // Create the role-specific record
    if (userType === "client") {
      const { error: clientError } = await supabaseAdmin
        .from("clients")
        .insert({
          user_id: userId,
          email: normalizedEmail,
          first_name: profileData.firstName || "",
          last_name: profileData.lastName || "",
          phone: profileData.phone || "",
          created_at: new Date().toISOString(),
        });

      if (clientError) {
        console.error("Error creating client record:", clientError);
      }
    } else if (userType === "mover") {
      // Create minimal mover record so the user is recognized as mover on next login
      const { error: moverError } = await supabaseAdmin
        .from("movers")
        .insert({
          user_id: userId,
          email: normalizedEmail,
          company_name: "",
          siret: "",
          phone: "",
          manager_firstname: "",
          manager_lastname: "",
          manager_phone: "",
          address: "",
          city: "",
          postal_code: "",
          description: "",
          services: [],
          coverage_area: [],
          verification_status: "pending",
          is_active: false,
        });

      if (moverError) {
        console.error("Error creating mover record:", moverError);
      }
    }

    // Mark pending signup as verified
    await supabaseAdmin
      .from("pending_signups")
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq("email", normalizedEmail);

    // Send welcome email (non-blocking)
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const welcomeSubject = userType === "client"
          ? "Bienvenue sur TrouveTonDemenageur !"
          : "Bienvenue dans le réseau TrouveTonDemenageur !";

        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            userType,
            email: normalizedEmail,
            userId,
            record: { first_name: profileData.firstName || "" },
          }),
        });
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
    }

    console.log(`User created successfully: ${normalizedEmail} (${userType})`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        userType,
        message: "Compte créé avec succès",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-signup-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});