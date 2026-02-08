import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { path, bucket } = await req.json();

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Path is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Liste des buckets privés à essayer dans l'ordre
    const bucketsToTry = bucket ? [bucket] : [
      'identity-documents',
      'truck-documents',
      'moving-photos',
      'furniture-photos'
    ];

    let signedUrl = null;
    let lastError = null;

    // Essayer chaque bucket jusqu'à trouver le fichier
    for (const bucketName of bucketsToTry) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, 3600);

      if (!error && data?.signedUrl) {
        signedUrl = data.signedUrl;
        break;
      }
      lastError = error;
    }

    if (!signedUrl) {
      console.error('Error creating signed URL:', lastError);
      return new Response(
        JSON.stringify({
          error: lastError?.message || 'Document not found in any bucket',
          path: path,
          bucketsChecked: bucketsToTry
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Exception:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
