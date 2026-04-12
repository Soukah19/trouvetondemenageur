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

    // Determine user type (mover or client)
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

    // Helper to safely delete from a table (ignores errors for non-existent tables)
    async function safeDelete(table: string, column: string, value: string) {
      const { error } = await supabase.from(table).delete().eq(column, value);
      if (error) {
        console.warn(`Warning deleting from ${table}: ${error.message}`);
      }
    }

    // Helper to safely set null on a column
    async function safeSetNull(table: string, column: string, value: string) {
      const { error } = await supabase.from(table).update({ [column]: null }).eq(column, value);
      if (error) {
        console.warn(`Warning nullifying ${column} in ${table}: ${error.message}`);
      }
    }

    if (moverData) {
      console.log(`Deleting mover data (mover.id=${moverData.id}, user_id=${userId})...`);

      // 1. Delete tables referencing movers(id) — including payment_release_requests
      //    which has NO ON DELETE CASCADE and will block mover deletion
      await safeDelete('payment_release_requests', 'mover_id', moverData.id);
      await safeDelete('verification_reports', 'mover_id', moverData.id);
      await safeDelete('verification_documents', 'mover_id', moverData.id);
      await safeDelete('identity_verifications', 'mover_id', moverData.id);
      await safeDelete('mover_documents', 'mover_id', moverData.id);
      await safeDelete('mover_portfolio', 'mover_id', moverData.id);
      await safeDelete('mover_unavailability', 'mover_id', moverData.id);
      await safeDelete('mover_badges', 'mover_id', moverData.id);
      await safeDelete('trucks', 'mover_id', moverData.id);
      await safeDelete('notification_queue', 'mover_id', moverData.id);
      await safeDelete('accepted_moves', 'mover_id', moverData.id);
      await safeDelete('reviews', 'mover_id', moverData.id);
      await safeDelete('quotes', 'mover_id', moverData.id);
      await safeDelete('payments', 'mover_id', moverData.id);

      // Nullify mover references in mover_prospects (no CASCADE, would block mover deletion)
      await safeSetNull('mover_prospects', 'mover_id', moverData.id);

      // Nullify mover references in contracts and quote_requests (SET NULL behavior)
      await safeSetNull('contracts', 'mover_id', moverData.id);
      await safeSetNull('quote_requests', 'assigned_mover_id', moverData.id);

      // 2. Delete tables referencing auth.users(id) via user_id
      await safeDelete('notifications', 'user_id', userId);
      await safeDelete('document_verifications', 'user_id', userId);
      await safeDelete('mover_signup_progress', 'user_id', userId);
      await safeDelete('activity_logs', 'user_id', userId);
      await safeDelete('activity_timeline', 'user_id', userId);
      await safeDelete('fraud_alerts', 'user_id', userId);
      await safeDelete('user_checklist_items', 'user_id', userId);
      await safeDelete('moving_checklist_items', 'user_id', userId);

      // Messages — mover_id in messages refers to user_id, not movers.id
      await safeDelete('messages', 'mover_id', userId);
      // Conversations
      await safeDelete('conversations', 'mover_id', userId);

      // Nullify guarantee_decision_by in payments (no CASCADE, would block auth deletion)
      await safeSetNull('payments', 'guarantee_decision_by', userId);

      // Nullify called_by in mover_prospects (no CASCADE, would block auth deletion)
      await safeSetNull('mover_prospects', 'called_by', userId);

      // 3. Delete the mover profile itself
      await safeDelete('movers', 'user_id', userId);

      console.log('Mover data deleted successfully');
    } else if (clientData) {
      console.log(`Deleting client data (client.id=${clientData.id}, user_id=${userId})...`);

      // 1. Delete tables referencing auth.users(id) via client_id or user_id
      await safeDelete('notifications', 'user_id', userId);
      await safeDelete('messages', 'client_id', userId);
      await safeDelete('conversations', 'client_id', userId);
      await safeDelete('reviews', 'client_id', userId);
      await safeDelete('payments', 'client_id', userId);
      await safeDelete('favorites', 'client_id', userId);
      await safeDelete('electronic_signatures', 'client_id', userId);
      await safeDelete('contract_signatures', 'client_id', userId);
      await safeDelete('moving_checklist_items', 'user_id', userId);
      await safeDelete('user_checklist_items', 'user_id', userId);
      await safeDelete('inventory_items', 'user_id', userId);
      await safeDelete('refunds', 'client_id', userId);
      await safeDelete('activity_logs', 'user_id', userId);
      await safeDelete('activity_timeline', 'user_id', userId);
      await safeDelete('fraud_alerts', 'user_id', userId);
      await safeDelete('document_verifications', 'user_id', userId);

      // Nullify client references in contracts (ON DELETE SET NULL)
      await safeSetNull('contracts', 'client_user_id', userId);

      // Nullify guarantee_decision_by in payments (no CASCADE)
      await safeSetNull('payments', 'guarantee_decision_by', userId);

      // Nullify called_by in mover_prospects (no CASCADE, would block auth deletion)
      await safeSetNull('mover_prospects', 'called_by', userId);

      // Delete quotes linked to client's quote requests
      const { data: quoteRequests } = await supabase
        .from('quote_requests')
        .select('id')
        .eq('client_user_id', userId);

      if (quoteRequests && quoteRequests.length > 0) {
        const requestIds = quoteRequests.map(qr => qr.id);
        await supabase.from('quotes').delete().in('quote_request_id', requestIds);
      }

      // Delete quote requests
      await safeDelete('quote_requests', 'client_user_id', userId);

      // Delete client profile
      await safeDelete('clients', 'user_id', userId);

      console.log('Client data deleted successfully');
    } else {
      console.log('User is neither a mover nor a client, cleaning up generic user data...');

      // Clean up any generic user-linked data
      await safeDelete('notifications', 'user_id', userId);
      await safeDelete('activity_logs', 'user_id', userId);
      await safeDelete('activity_timeline', 'user_id', userId);
      await safeDelete('document_verifications', 'user_id', userId);
      await safeDelete('mover_signup_progress', 'user_id', userId);
      await safeSetNull('payments', 'guarantee_decision_by', userId);
      await safeSetNull('mover_prospects', 'called_by', userId);
    }

    // Delete the auth user
    console.log('Deleting auth user...');
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Auth deletion error:', JSON.stringify(error));
      throw new Error(`Auth deletion failed: ${error.message}`);
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