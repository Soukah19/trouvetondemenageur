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

    // Supprimer les comptes existants d'abord
    await supabaseAdmin.from('admins').delete().in('email', ['admin@trouveton.fr', 'adminagent@trouveton.fr']);

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    for (const user of existingUsers?.users || []) {
      if (user.email === 'admin@trouveton.fr' || user.email === 'adminagent@trouveton.fr') {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }

    // Créer Super Admin
    const { data: superAdminUser, error: superAdminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@trouveton.fr',
      password: '123456',
      email_confirm: true,
    });

    if (superAdminError) {
      console.error('Erreur création super admin:', superAdminError);
      throw superAdminError;
    }

    // Insérer dans la table admins
    const { error: superAdminInsertError } = await supabaseAdmin
      .from('admins')
      .insert({
        user_id: superAdminUser.user.id,
        email: 'admin@trouveton.fr',
        role: 'super_admin',
      });

    if (superAdminInsertError) {
      console.error('Erreur insertion super admin:', superAdminInsertError);
      throw superAdminInsertError;
    }

    // Créer Admin Agent
    const { data: adminAgentUser, error: adminAgentError } = await supabaseAdmin.auth.admin.createUser({
      email: 'adminagent@trouveton.fr',
      password: '123456',
      email_confirm: true,
    });

    if (adminAgentError) {
      console.error('Erreur création admin agent:', adminAgentError);
      throw adminAgentError;
    }

    // Insérer dans la table admins
    const { error: adminAgentInsertError } = await supabaseAdmin
      .from('admins')
      .insert({
        user_id: adminAgentUser.user.id,
        email: 'adminagent@trouveton.fr',
        role: 'admin_agent',
      });

    if (adminAgentInsertError) {
      console.error('Erreur insertion admin agent:', adminAgentInsertError);
      throw adminAgentInsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comptes administrateurs créés avec succès',
        superAdmin: {
          email: 'admin@trouveton.fr',
          role: 'super_admin',
          password: '123456',
        },
        adminAgent: {
          email: 'adminagent@trouveton.fr',
          role: 'admin_agent',
          password: '123456',
        },
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