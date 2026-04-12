import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY non configurée");
    }

    if (!stripeWebhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET non configurée");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration manquante");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook event received:", event.type);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        const quoteId = paymentIntent.metadata?.quote_id;
        if (!quoteId) {
          console.log("No quote_id in metadata, skipping");
          break;
        }

        // Try to get fee — may not be available yet (balance_transaction created async)
        let stripeFee = 0;
        let cardCountry = '';
        let cardBrand = '';
        try {
          const chargeId = paymentIntent.latest_charge as string;
          console.log("latest_charge ID:", chargeId);
          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId, {
              expand: ['balance_transaction'],
            });
            console.log("balance_transaction type:", typeof charge.balance_transaction, "value:", charge.balance_transaction ? 'exists' : 'null');
            
            const balanceTx = charge.balance_transaction;
            if (balanceTx && typeof balanceTx === 'object' && 'fee' in balanceTx) {
              stripeFee = (balanceTx as any).fee / 100;
              console.log("Stripe fee (expanded):", stripeFee, "EUR");
            } else if (typeof balanceTx === 'string') {
              const bt = await stripe.balanceTransactions.retrieve(balanceTx);
              stripeFee = bt.fee / 100;
              console.log("Stripe fee (fetched):", stripeFee, "EUR");
            }

            const card = charge.payment_method_details?.card;
            if (card) {
              cardCountry = card.country || '';
              cardBrand = card.brand || '';
              console.log("Card:", cardBrand, "country:", cardCountry);
            }
          }
        } catch (feeErr: any) {
          console.error("Fee retrieval error:", feeErr?.message || feeErr);
        }

        // Update the payment record to mark it as verified + store fee
        const updateData: Record<string, any> = {
          payment_status: "completed",
          stripe_verified: true,
          stripe_verified_at: new Date().toISOString(),
        };
        if (stripeFee > 0) updateData.stripe_fee = stripeFee;
        if (cardCountry) updateData.stripe_card_country = cardCountry;
        if (cardBrand) updateData.stripe_card_brand = cardBrand;

        const { error: updateError } = await supabase
          .from("payments")
          .update(updateData)
          .eq("stripe_payment_id", paymentIntent.id);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        } else {
          console.log("Payment verified successfully for quote:", quoteId, "fee:", stripeFee);
        }

        // ── Record promo code usage (only on successful payment) ──────────
        const promoCodeId   = paymentIntent.metadata?.promo_code_id;
        const promoUserId   = paymentIntent.metadata?.user_id;
        const discountAmt   = parseFloat(paymentIntent.metadata?.discount_amount || "0");
        const originalAmt   = parseFloat(paymentIntent.metadata?.original_amount || "0");
        const finalAmt      = parseFloat(paymentIntent.metadata?.final_amount || "0");

        if (promoCodeId && promoUserId && discountAmt > 0 && quoteId) {
          // Insert usage (ignore conflict — idempotent via unique constraint on promo_code_id+user_id+quote_id)
          const { error: usageError } = await supabase
            .from("promo_code_usage")
            .insert({
              promo_code_id:   promoCodeId,
              user_id:         promoUserId,
              quote_id:        quoteId,
              discount_amount: discountAmt,
              original_amount: originalAmt,
              final_amount:    finalAmt,
            })
            .select()
            .maybeSingle();

          if (usageError && !usageError.message.includes("duplicate")) {
            console.error("Error recording promo usage:", usageError);
          } else {
            // Increment current_uses atomically
            const { error: rpcError } = await supabase.rpc("increment_promo_code_uses", {
              p_promo_code_id: promoCodeId,
            });
            if (rpcError) console.error("Error incrementing promo uses:", rpcError);
            else console.log("Promo usage recorded for code:", paymentIntent.metadata?.promo_code);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", paymentIntent.id);

        const quoteId = paymentIntent.metadata?.quote_id;
        if (!quoteId) {
          console.log("No quote_id in metadata, skipping");
          break;
        }

        // Update the payment record to mark it as failed
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            payment_status: "failed",
            stripe_error: paymentIntent.last_payment_error?.message || "Payment failed",
          })
          .eq("stripe_payment_id", paymentIntent.id);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        }

        // Revert the quote status
        const { data: paymentData } = await supabase
          .from("payments")
          .select("quote_id, quote_request_id")
          .eq("stripe_payment_id", paymentIntent.id)
          .single();

        if (paymentData) {
          await supabase
            .from("quotes")
            .update({ status: "pending" })
            .eq("id", paymentData.quote_id);

          await supabase
            .from("quote_requests")
            .update({ 
              payment_status: "no_payment",
              accepted_quote_id: null 
            })
            .eq("id", paymentData.quote_request_id);
        }
        break;
      }

      case "charge.updated":
      case "charge.succeeded": {
        // This fires when the charge is finalized with balance_transaction
        const charge = event.data.object as Stripe.Charge;
        const piId = charge.payment_intent as string;
        console.log("Charge event:", event.type, "charge:", charge.id, "pi:", piId);

        if (piId && charge.balance_transaction) {
          try {
            let fee = 0;
            const bt = charge.balance_transaction;
            if (typeof bt === 'object' && 'fee' in bt) {
              fee = (bt as any).fee / 100;
            } else if (typeof bt === 'string') {
              const balanceTx = await stripe.balanceTransactions.retrieve(bt);
              fee = balanceTx.fee / 100;
            }

            if (fee > 0) {
              console.log("Updating stripe_fee:", fee, "for PI:", piId);
              await supabase
                .from("payments")
                .update({ stripe_fee: fee })
                .eq("stripe_payment_id", piId);
            }
          } catch (err: any) {
            console.error("charge.updated fee error:", err?.message || err);
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);

        const paymentIntentId = charge.payment_intent as string;
        if (paymentIntentId) {
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              payment_status: charge.amount_refunded === charge.amount 
                ? "refunded_full" 
                : "refunded_partial",
              refund_amount: charge.amount_refunded / 100,
              refunded_at: new Date().toISOString(),
            })
            .eq("stripe_payment_id", paymentIntentId);

          if (updateError) {
            console.error("Error updating refund:", updateError);
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors du traitement du webhook",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});