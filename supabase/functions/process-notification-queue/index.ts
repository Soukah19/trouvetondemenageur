import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select(`
        id,
        mover_id,
        quote_request_id,
        notification_type,
        movers:mover_id (
          id,
          company_name,
          contact_email
        ),
        quote_requests:quote_request_id (
          id,
          from_city,
          from_postal_code,
          to_city,
          to_postal_code,
          moving_date,
          home_size,
          volume_m3,
          surface_m2,
          services_needed
        )
      `)
      .eq('sent', false)
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending notifications',
          processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];
    
    for (const notification of pendingNotifications) {
      try {
        const mover = notification.movers;
        const quoteRequest = notification.quote_requests;

        if (!mover || !mover.contact_email) {
          console.error(`Mover not found for notification ${notification.id}`);
          continue;
        }

        let emailType = '';
        let emailData = {};

        if (notification.notification_type === 'return_trip') {
          const { data: acceptedMove } = await supabase
            .from('accepted_moves')
            .select('*')
            .eq('mover_id', notification.mover_id)
            .eq('arrival_city', quoteRequest.from_city)
            .eq('status', 'scheduled')
            .maybeSingle();

          if (acceptedMove) {
            emailType = 'return_trip_opportunity';
            emailData = {
              yourArrivalCity: acceptedMove.arrival_city,
              yourArrivalDate: new Date(acceptedMove.estimated_arrival_date).toLocaleDateString('fr-FR'),
              newDepartureCity: quoteRequest.from_city,
              newDeparturePostalCode: quoteRequest.from_postal_code,
              newArrivalCity: quoteRequest.to_city,
              newArrivalPostalCode: quoteRequest.to_postal_code,
              newMovingDate: new Date(quoteRequest.moving_date).toLocaleDateString('fr-FR'),
              homeSize: quoteRequest.home_size,
              volumeM3: quoteRequest.volume_m3,
            };
          }
        } else if (notification.notification_type === 'activity_zone') {
          emailType = 'activity_zone_new_quote';
          emailData = {
            fromCity: quoteRequest.from_city,
            fromPostalCode: quoteRequest.from_postal_code,
            toCity: quoteRequest.to_city,
            toPostalCode: quoteRequest.to_postal_code,
            movingDate: new Date(quoteRequest.moving_date).toLocaleDateString('fr-FR'),
            homeSize: quoteRequest.home_size,
            volumeM3: quoteRequest.volume_m3,
            surfaceM2: quoteRequest.surface_m2,
            servicesNeeded: quoteRequest.services_needed,
          };
        }

        if (emailType) {
          const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`;
          const response = await fetch(notificationUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
            },
            body: JSON.stringify({
              type: emailType,
              recipientEmail: mover.contact_email,
              data: emailData,
            }),
          });

          if (response.ok) {
            await supabase
              .from('notification_queue')
              .update({ 
                sent: true, 
                sent_at: new Date().toISOString() 
              })
              .eq('id', notification.id);

            results.push({
              id: notification.id,
              status: 'sent',
              email: mover.contact_email,
            });
          } else {
            const errorText = await response.text();
            console.error(`Failed to send notification ${notification.id}:`, errorText);
            results.push({
              id: notification.id,
              status: 'failed',
              error: errorText,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        results.push({
          id: notification.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} notifications`,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error in process-notification-queue:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process notification queue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});