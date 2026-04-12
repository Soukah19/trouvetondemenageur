import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransferRequest {
  paymentId: string; // ID in our payments table
  amount: number; // Amount in EUR to transfer
  moverId: string; // Mover ID to look up bank details
  method: "stripe_connect" | "manual_sepa"; // Transfer method
  manualReference?: string; // SEPA transfer reference (for manual)
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
      amount,
      moverId,
      method,
      manualReference,
    }: TransferRequest = await req.json();

    // ─── Validation ───
    if (!paymentId || !moverId) {
      throw new Error("paymentId et moverId sont requis");
    }
    if (!amount || amount <= 0) {
      throw new Error("Montant de transfert invalide");
    }

    // ─── 1. Get the payment record ───
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, guarantee_amount, guarantee_status, mover_payout_status")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error(`Paiement introuvable: ${paymentError?.message}`);
    }

    // Only allow transfer if guarantee has been released
    if (
      payment.guarantee_status !== "released_to_mover" &&
      payment.guarantee_status !== "partial_release"
    ) {
      throw new Error(
        `La garantie doit être libérée avant le virement. Statut actuel: ${payment.guarantee_status}`
      );
    }

    // Don't allow double payment
    if (payment.mover_payout_status === "paid") {
      throw new Error("Ce virement a déjà été effectué");
    }

    // ─── 2. Get mover bank details ───
    const { data: mover, error: moverError } = await supabase
      .from("movers")
      .select(
        "id, company_name, iban, bic, bank_name, account_holder_name, email, stripe_account_id"
      )
      .eq("id", moverId)
      .single();

    if (moverError || !mover) {
      throw new Error(`Déménageur introuvable: ${moverError?.message}`);
    }

    let transferResult: {
      transferId: string;
      status: string;
      method: string;
    };

    // ─── 3A. Stripe Connect transfer (automated) ───
    if (method === "stripe_connect") {
      if (!mover.stripe_account_id) {
        throw new Error(
          "Ce déménageur n'a pas de compte Stripe Connect. Utilisez le virement SEPA manuel."
        );
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // cents
        currency: "eur",
        destination: mover.stripe_account_id,
        description: `Garantie déménagement - ${mover.company_name}`,
        metadata: {
          payment_id: paymentId,
          mover_id: moverId,
          platform: "trouvetondemenageur",
        },
      });

      console.log(`✅ Stripe transfer created: ${transfer.id}`);

      transferResult = {
        transferId: transfer.id,
        status: "paid",
        method: "stripe_connect",
      };
    }
    // ─── 3B. Manual SEPA tracking ───
    else {
      // Validate mover has bank details
      if (!mover.iban) {
        throw new Error(
          `Le déménageur ${mover.company_name} n'a pas d'IBAN enregistré. Vérifiez son profil.`
        );
      }

      const reference =
        manualReference || `TTD-${paymentId.substring(0, 8).toUpperCase()}`;

      console.log(
        `📋 Manual SEPA transfer marked: ${amount}€ to ${mover.company_name} (IBAN: ${mover.iban})`
      );

      transferResult = {
        transferId: `sepa_manual_${reference}`,
        status: "ready_to_pay", // Admin needs to do the actual bank transfer
        method: "manual_sepa",
      };
    }

    // ─── 4. Update payment record with payout info ───
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        mover_payout_status: transferResult.status,
        mover_payout_date: new Date().toISOString(),
        mover_payout_reference: transferResult.transferId,
        mover_payout_amount: amount,
        mover_payout_method: transferResult.method,
      })
      .eq("id", paymentId);

    if (updateError) {
      console.error("Error updating payment:", updateError);
    }

    // ─── 5. Notify the mover ───
    const { data: moverUser } = await supabase
      .from("movers")
      .select("user_id")
      .eq("id", moverId)
      .single();

    if (moverUser) {
      const title =
        method === "stripe_connect"
          ? "✅ Virement reçu"
          : "💰 Virement en cours";
      const message =
        method === "stripe_connect"
          ? `Votre garantie de ${amount}€ a été transférée sur votre compte Stripe.`
          : `Votre garantie de ${amount}€ sera virée sur votre compte bancaire (${mover.bank_name || "IBAN: " + (mover.iban || "").substring(0, 10) + "..."}) sous 24-48h.`;

      await supabase.from("notifications").insert({
        user_id: moverUser.user_id,
        user_type: "mover",
        title,
        message,
        type: "payment",
        related_id: paymentId,
        read: false,
      });
    }

    // ─── 6. Return response with mover bank details (for admin manual transfer) ───
    return new Response(
      JSON.stringify({
        success: true,
        transfer: transferResult,
        amount,
        moverDetails: {
          companyName: mover.company_name,
          iban: mover.iban,
          bic: mover.bic,
          bankName: mover.bank_name,
          accountHolderName: mover.account_holder_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Transfer error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors du virement",
        details: error.raw?.message || error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
