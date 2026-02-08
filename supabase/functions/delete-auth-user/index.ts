import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // Déterminer le type d'utilisateur (déménageur ou client)
    const { data: moverData } = await supabase
      .from('movers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // Supprimer les données associées selon le type d'utilisateur
    if (moverData) {
      console.log('Deleting mover data...');

      // Supprimer les notifications
      await supabase.from('notifications').delete().eq('user_id', userId);

      // Supprimer les messages
      await supabase.from('messages').delete().eq('mover_id', userId);

      // Supprimer les reviews
      await supabase.from('reviews').delete().eq('mover_id', moverData.id);

      // Supprimer les devis
      await supabase.from('quotes').delete().eq('mover_id', moverData.id);

      // Supprimer les transactions
      await supabase.from('transactions').delete().eq('mover_id', moverData.id);

      // Supprimer les disponibilités
      await supabase.from('mover_availability').delete().eq('mover_id', moverData.id);

      // Supprimer les camions
      await supabase.from('trucks').delete().eq('mover_id', moverData.id);

      // Supprimer les badges
      await supabase.from('mover_badges').delete().eq('mover_id', moverData.id);

      // Supprimer le portfolio
      await supabase.from('portfolio_photos').delete().eq('mover_id', moverData.id);

      // Supprimer les documents de vérification
      await supabase.from('document_verifications').delete().eq('user_id', userId);

      // Supprimer le profil déménageur
      await supabase.from('movers').delete().eq('user_id', userId);

      console.log('Mover data deleted successfully');
    } else if (clientData) {
      console.log('Deleting client data...');

      // Supprimer les notifications
      await supabase.from('notifications').delete().eq('user_id', userId);

      // Supprimer les messages
      await supabase.from('messages').delete().eq('client_id', userId);

      // Supprimer les reviews
      await supabase.from('reviews').delete().eq('client_id', userId);

      // Supprimer les paiements
      await supabase.from('payments').delete().eq('client_id', userId);

      // Supprimer les favoris
      await supabase.from('favorites').delete().eq('client_id', userId);

      // Supprimer les signatures électroniques
      await supabase.from('electronic_signatures').delete().eq('client_id', userId);

      // Supprimer les checklists
      await supabase.from('moving_checklist_items').delete().eq('user_id', userId);

      // Supprimer les devis liés aux demandes du client
      const { data: quoteRequests } = await supabase
        .from('quote_requests')
        .select('id')
        .eq('client_user_id', userId);

      if (quoteRequests && quoteRequests.length > 0) {
        const requestIds = quoteRequests.map(qr => qr.id);
        await supabase.from('quotes').delete().in('quote_request_id', requestIds);
      }

      // Supprimer les demandes de devis
      await supabase.from('quote_requests').delete().eq('client_user_id', userId);

      // Supprimer le profil client
      await supabase.from('clients').delete().eq('user_id', userId);

      console.log('Client data deleted successfully');
    }

    // Supprimer l'utilisateur de auth
    console.log('Deleting auth user...');
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    console.log('User deleted successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'User and all associated data deleted successfully', data }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error('Error deleting auth user:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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