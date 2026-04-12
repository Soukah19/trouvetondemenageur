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
    const { email, password, companyName, prospectId, token } = await req.json();

    if (!email || !password || !token) {
      return new Response(
        JSON.stringify({ error: "email, password, and token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify the prospect exists and is valid
    const { data: prospect, error: prospectError } = await supabase
      .from("mover_prospects")
      .select("*")
      .eq("invitation_token", token)
      .single();

    if (prospectError || !prospect) {
      return new Response(
        JSON.stringify({ error: "Invalid invitation token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (prospect.invitation_status === "signed_up") {
      return new Response(
        JSON.stringify({ error: "This invitation has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if email already exists in movers table
    const { data: existingMover } = await supabase
      .from("movers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingMover) {
      return new Response(
        JSON.stringify({ error: "already_exists", message: "Ce compte existe déjà. Essayez de vous connecter." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Try to create the user, handle "already exists" gracefully
    let userId: string;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_type: "mover",
        company_name: companyName || prospect.company_name,
      },
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        // User exists in auth but no mover profile — try to update their password
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
        
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "already_exists", message: "Ce compte existe déjà. Essayez de vous connecter." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update their password and metadata
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: { user_type: "mover", company_name: companyName || prospect.company_name },
        });

        userId = existingUser.id;
        console.log("Reused existing auth user:", userId);
      } else {
        throw authError;
      }
    } else {
      if (!authData.user) throw new Error("User creation failed");
      userId = authData.user.id;
      console.log("Created new user:", userId, "for email:", email);
    }

    // 4. Notify admins (in-app notifications + email)
    try {
      const { data: admins } = await supabase.from("admins").select("user_id, email");
      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: any) => ({
          user_id: admin.user_id,
          user_type: 'admin',
          title: '🎉 Nouveau déménageur via invitation',
          message: `${prospect.company_name || email} a accepté l'invitation et finalisé son inscription. Compte en attente de validation.`,
          type: 'mover_registration',
          related_id: prospect.id || null,
          read: false,
        }));
        await supabase.from("notifications").insert(notifications);

        // Send email to admins
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          for (const admin of admins) {
            if (!admin.email) continue;
            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "TrouveTonDemenageur <noreply@trouvetondemenageur.fr>",
                  to: [admin.email],
                  subject: `🎉 ${prospect.company_name || email} a rejoint la plateforme`,
                  html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;"><h2 style="color:#10B981;">Nouvelle inscription déménageur</h2><p><strong>${prospect.company_name || email}</strong> a finalisé son inscription via invitation.</p><p>Compte en attente de validation.</p><a href="https://www.trouvetondemenageur.fr/admin/dashboard/pending_movers" style="display:inline-block;background:#10B981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;margin-top:10px;">Valider le compte →</a></div>`,
                }),
              });
            } catch (e) { console.error("Admin email error:", e); }
            await new Promise(r => setTimeout(r, 600)); // Resend free tier: 2 emails/sec
          }
        }
      }
    } catch (e) {
      console.error("Admin notification error (non-blocking):", e);
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
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
