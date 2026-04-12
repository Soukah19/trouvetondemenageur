import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessRefundRequest {
  paymentId: string; // ID in our payments table
  refundAmount: number; // Amount in EUR (not cents)
  reason: string;
  refundId?: string; // ID in our refunds table (to update status)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY non configurée");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuration Supabase manquante");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      paymentId,
      refundAmount,
      reason,
      refundId,
    }: ProcessRefundRequest = await req.json();

    // ─── Validation ───
    if (!paymentId) {
      throw new Error("paymentId est requis");
    }
    if (!refundAmount || refundAmount <= 0) {
      throw new Error("Montant de remboursement invalide");
    }

    // ─── 1. Get the payment record from Supabase ───
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, stripe_payment_id, deposit_amount, payment_status, total_amount")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error(`Paiement introuvable: ${fetchError?.message || "ID invalide"}`);
    }

    if (!payment.stripe_payment_id) {
      throw new Error("Aucun ID de paiement Stripe associé à ce paiement");
    }

    // Don't allow refunding fake/test payment IDs from old system
    if (payment.stripe_payment_id.startsWith("pi_test_")) {
      throw new Error(
        "Ce paiement a été effectué en mode simulé (pas via Stripe). Remboursement impossible via Stripe."
      );
    }

    // Validate refund amount doesn't exceed what was charged
    const maxRefundable = payment.deposit_amount || payment.total_amount;
    if (refundAmount > maxRefundable) {
      throw new Error(
        `Le montant de remboursement (${refundAmount}€) dépasse le montant encaissé (${maxRefundable}€)`
      );
    }

    console.log(
      `Processing refund: ${refundAmount}€ for payment ${paymentId} (Stripe: ${payment.stripe_payment_id})`
    );

    // ─── 2. Create the ACTUAL Stripe refund ───
    const amountInCents = Math.round(refundAmount * 100);

    const stripeRefund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_id,
      amount: amountInCents,
      reason: "requested_by_customer",
      metadata: {
        internal_payment_id: paymentId,
        internal_reason: reason || "Remboursement admin",
        platform: "trouvetondemenageur",
      },
    });

    console.log(`✅ Stripe refund created: ${stripeRefund.id} - Status: ${stripeRefund.status}`);

    // ─── 3. Update the refund record in Supabase (if refundId provided) ───
    if (refundId) {
      const { error: refundUpdateError } = await supabase
        .from("refunds")
        .update({
          status: "completed",
          stripe_refund_id: stripeRefund.id,
          processed_at: new Date().toISOString(),
          notes: `Remboursement Stripe effectué: ${stripeRefund.id} - ${stripeRefund.status}`,
        })
        .eq("id", refundId);

      if (refundUpdateError) {
        console.error("Error updating refund record:", refundUpdateError);
      }
    }

    // ─── 4. Update the payment record ───
    const isFullRefund = refundAmount >= (payment.deposit_amount || 0);
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        payment_status: isFullRefund ? "refunded_full" : "refunded_partial",
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (paymentUpdateError) {
      console.error("Error updating payment record:", paymentUpdateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        stripeRefundId: stripeRefund.id,
        stripeRefundStatus: stripeRefund.status,
        amountRefunded: refundAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Refund error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors du remboursement",
        details: error.raw?.message || error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
