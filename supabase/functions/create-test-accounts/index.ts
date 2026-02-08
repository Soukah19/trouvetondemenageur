import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];

    // Créer le compte déménageur
    const { data: moverUser, error: moverError } = await supabaseAdmin.auth.admin.createUser({
      email: 'dropit.transport@gmail.com',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Drop It Transport'
      }
    });

    if (moverError) {
      results.push({ type: 'mover', error: moverError.message });
    } else {
      // Créer le profil déménageur
      const { error: moverProfileError } = await supabaseAdmin
        .from('movers')
        .insert({
          user_id: moverUser.user.id,
          email: 'dropit.transport@gmail.com',
          company_name: 'Drop It Transport',
          manager_firstname: 'Jean',
          manager_lastname: 'Dupont',
          manager_phone: '0612345678',
          phone: '0612345678',
          siret: '12345678901234',
          address: '123 Rue Test',
          city: 'Paris',
          postal_code: '75001',
          activity_departments: ['75', '92', '93', '94'],
          max_distance_km: 500,
          has_furniture_lift: true,
          insurance_number: 'INS123456789',
          verification_status: 'verified',
          is_active: true,
          average_rating: 4.5,
          total_reviews: 10,
          identity_verified: true
        });

      if (moverProfileError) {
        results.push({ type: 'mover', error: moverProfileError.message });
      } else {
        results.push({ type: 'mover', success: true, email: 'dropit.transport@gmail.com', password: '123456' });
      }
    }

    // Créer le compte client
    const { data: clientUser, error: clientError } = await supabaseAdmin.auth.admin.createUser({
      email: 'pelluard.zizou@gmail.com',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Pelluard Zizou'
      }
    });

    if (clientError) {
      results.push({ type: 'client', error: clientError.message });
    } else {
      results.push({ type: 'client', success: true, email: 'pelluard.zizou@gmail.com', password: '123456' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comptes de test créés',
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err: any) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
