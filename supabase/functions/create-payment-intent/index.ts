import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentIntentRequest {
  amount: number;       // depositAmount (commission) BEFORE any promo discount
  quoteId: string;
  description?: string;
  promoCode?: string;   // optional promo code entered by client
  userId?: string;      // client user_id (stored in Stripe metadata for webhook)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY non configurée");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    const { amount, quoteId, description, promoCode, userId }: PaymentIntentRequest = await req.json();

    if (!amount || amount <= 0) return json({ error: "Montant invalide" }, 400);
    if (!quoteId) return json({ error: "ID de devis manquant" }, 400);

    // ── Validate and apply promo code if provided ──────────────────────────
    let finalAmount = amount;
    let discountAmount = 0;
    let promoCodeId: string | null = null;
    let normalizedCode: string | null = null;

    if (promoCode && promoCode.trim().length > 0) {
      normalizedCode = promoCode.trim().toUpperCase();

      const { data: pc, error: pcError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (pcError || !pc) return json({ error: "Code promo invalide ou introuvable" }, 400);
      if (!pc.is_active) return json({ error: "Ce code promo n'est plus actif" }, 400);

      const now = new Date();
      if (pc.valid_from && new Date(pc.valid_from) > now)
        return json({ error: "Ce code promo n'est pas encore valide" }, 400);
      if (pc.valid_until && new Date(pc.valid_until) < now)
        return json({ error: "Ce code promo a expiré" }, 400);
      if (pc.max_uses !== null && pc.current_uses >= pc.max_uses)
        return json({ error: "Ce code promo a atteint sa limite d'utilisation" }, 400);
      if (pc.min_amount !== null && amount < pc.min_amount)
        return json({ error: `Montant minimum requis: ${pc.min_amount.toFixed(2)} €` }, 400);

      // Single-use check — only if the flag is set on this promo code
      if (pc.single_use_per_user && userId) {
        const { data: usageExists } = await supabase
          .from("promo_code_usage")
          .select("id")
          .eq("promo_code_id", pc.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (usageExists) return json({ error: "Vous avez déjà utilisé ce code promo" }, 400);
      }

      if (pc.discount_type === "percentage") {
        discountAmount = (amount * pc.discount_value) / 100;
        if (pc.max_discount_amount !== null) {
          discountAmount = Math.min(discountAmount, pc.max_discount_amount);
        }
      } else {
        discountAmount = pc.discount_value;
      }

      discountAmount = Math.min(discountAmount, amount - 1);
      discountAmount = Math.max(discountAmount, 0);
      discountAmount = Math.round(discountAmount * 100) / 100;

      finalAmount = Math.round((amount - discountAmount) * 100) / 100;
      promoCodeId = pc.id;
    }

    // ── Create Stripe PaymentIntent ────────────────────────────────────────
    const amountInCents = Math.round(finalAmount * 100);

    // Store everything needed for the webhook in Stripe metadata
    const metadata: Record<string, string> = {
      quote_id: quoteId,
      platform: "trouvetondemenageur",
      original_amount: amount.toString(),
    };
    if (normalizedCode && promoCodeId) {
      metadata.promo_code        = normalizedCode;
      metadata.promo_code_id     = promoCodeId;
      metadata.discount_amount   = discountAmount.toString();
      metadata.final_amount      = finalAmount.toString();
      if (userId) metadata.user_id = userId;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      description:
        description ||
        `Paiement déménagement - Devis ${quoteId}${normalizedCode ? ` (code: ${normalizedCode})` : ""}`,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    console.log("PaymentIntent créé:", paymentIntent.id, "amount:", finalAmount, "€");

    // NOTE: promo usage is NOT recorded here.
    // It is recorded exclusively in the stripe-webhook function
    // on payment_intent.succeeded, so only real successful payments count.

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      finalAmount,
      discountAmount,
      promoCode: normalizedCode,
    });
  } catch (error: any) {
    console.error("Erreur création PaymentIntent:", error);
    return json(
      { error: error.message || "Erreur lors de la création du paiement", details: error.raw?.message || error.toString() },
      500
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
