import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ValidateRequest {
  code: string;
  amount: number;   // depositAmount (platform commission) in euros
  userId?: string;  // used to check single_use_per_user constraint
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ValidateRequest = await req.json();
    const { code, amount, userId } = body;

    if (!code || typeof code !== "string") {
      return json({ valid: false, error: "Code manquant" }, 400);
    }
    if (!amount || amount <= 0) {
      return json({ valid: false, error: "Montant invalide" }, 400);
    }

    const normalizedCode = code.trim().toUpperCase();

    // Fetch promo code
    const { data: promoCode, error: fetchError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching promo code:", fetchError);
      return json({ valid: false, error: "Erreur interne" }, 500);
    }

    if (!promoCode) {
      return json({ valid: false, error: "Code promo invalide" });
    }

    // is_active check
    if (!promoCode.is_active) {
      return json({ valid: false, error: "Ce code promo n'est plus actif" });
    }

    // validity dates
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      return json({ valid: false, error: "Ce code promo n'est pas encore valide" });
    }
    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return json({ valid: false, error: "Ce code promo a expiré" });
    }

    // max_uses check (global cap)
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return json({ valid: false, error: "Ce code promo a atteint sa limite d'utilisation" });
    }

    // min_amount check
    if (promoCode.min_amount !== null && amount < promoCode.min_amount) {
      return json({
        valid: false,
        error: `Ce code promo est valide à partir de ${promoCode.min_amount.toFixed(2)} € de commission`,
      });
    }

    // ── Single-use per user — only if the flag is enabled AND userId provided ──
    if (promoCode.single_use_per_user && userId) {
      const { data: existingUsage } = await supabase
        .from("promo_code_usage")
        .select("id")
        .eq("promo_code_id", promoCode.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingUsage) {
        return json({ valid: false, error: "Vous avez déjà utilisé ce code promo" });
      }
    }

    // Calculate discount amount
    let discountAmount: number;
    if (promoCode.discount_type === "percentage") {
      discountAmount = (amount * promoCode.discount_value) / 100;
      if (promoCode.max_discount_amount !== null) {
        discountAmount = Math.min(discountAmount, promoCode.max_discount_amount);
      }
    } else {
      discountAmount = promoCode.discount_value;
    }

    // Clamp so that final amount >= 1€ (Stripe minimum)
    discountAmount = Math.min(discountAmount, amount - 1);
    discountAmount = Math.max(discountAmount, 0);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return json({
      valid: true,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      discount_amount: discountAmount,
      max_discount_amount: promoCode.max_discount_amount,
      single_use_per_user: promoCode.single_use_per_user,
      code: normalizedCode,
    });
  } catch (error: any) {
    console.error("validate-promo-code error:", error);
    return json({ valid: false, error: "Erreur interne du serveur" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
