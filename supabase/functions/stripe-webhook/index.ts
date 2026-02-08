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
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
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

        // Update the payment record to mark it as verified
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            payment_status: "completed",
            stripe_verified: true,
            stripe_verified_at: new Date().toISOString(),
          })
          .eq("stripe_payment_id", paymentIntent.id);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        } else {
          console.log("Payment verified successfully for quote:", quoteId);
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
