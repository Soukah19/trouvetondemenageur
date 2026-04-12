import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedEmail = email.toLowerCase().trim();

    // Check auth.users via admin API
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }

    const existingUser = users.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!existingUser) {
      return new Response(
        JSON.stringify({ exists: false, userType: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User exists — determine their role and provider
    const userId = existingUser.id;
    const provider = existingUser.app_metadata?.provider || "email";

    const { data: adminData } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminData) {
      return new Response(
        JSON.stringify({ exists: true, userType: "admin", provider }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: moverData } = await supabaseAdmin
      .from("movers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (moverData) {
      return new Response(
        JSON.stringify({ exists: true, userType: "mover", provider }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: clientData } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientData) {
      return new Response(
        JSON.stringify({ exists: true, userType: "client", provider }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User exists in auth but not in any role table (incomplete signup)
    return new Response(
      JSON.stringify({ exists: true, userType: "unknown", provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error checking email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});