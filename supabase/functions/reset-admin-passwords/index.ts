import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
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
        persistSession: false,
      },
    });

    // Récupérer TOUS les comptes admin
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('user_id, email, username, role');

    if (adminsError) {
      throw new Error(`Erreur récupération admins: ${adminsError.message}`);
    }

    if (!admins || admins.length === 0) {
      throw new Error('Aucun compte admin trouvé');
    }

    console.log('Admins trouvés:', admins);

    const results = [];
    const newPassword = '123456';

    // Mettre à jour le mot de passe pour chaque admin
    for (const admin of admins) {
      try {
        console.log(`Mise à jour du mot de passe pour ${admin.email} (${admin.user_id})`);

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          admin.user_id,
          {
            password: newPassword,
            email_confirm: true
          }
        );

        if (error) {
          console.error(`Erreur pour ${admin.username || admin.email}:`, error);
          results.push({
            username: admin.username || 'N/A',
            email: admin.email,
            role: admin.role,
            success: false,
            error: error.message,
          });
        } else {
          console.log(`Mot de passe mis à jour pour ${admin.email}`);
          results.push({
            username: admin.username || 'N/A',
            email: admin.email,
            role: admin.role,
            success: true,
          });
        }
      } catch (err) {
        console.error(`Exception pour ${admin.email}:`, err);
        results.push({
          username: admin.username || 'N/A',
          email: admin.email,
          role: admin.role,
          success: false,
          error: err.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mots de passe réinitialisés',
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
