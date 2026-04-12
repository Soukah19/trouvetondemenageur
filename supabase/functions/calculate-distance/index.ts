import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DistanceRequest {
  fromAddress: string;
  fromCity: string;
  fromPostalCode: string;
  toAddress: string;
  toCity: string;
  toPostalCode: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { fromAddress, fromCity, fromPostalCode, toAddress, toCity, toPostalCode }: DistanceRequest = await req.json();

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const origin = `${fromAddress}, ${fromPostalCode} ${fromCity}`;
    const destination = `${toAddress}, ${toPostalCode} ${toCity}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
      const element = data.rows[0].elements[0];
      
      return new Response(
        JSON.stringify({
          success: true,
          distance: element.distance.value / 1000,
          distanceText: element.distance.text,
          duration: element.duration.value / 60,
          durationText: element.duration.text,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    throw new Error(`Distance calculation failed: ${data.status}`);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});