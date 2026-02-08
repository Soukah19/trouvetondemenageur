import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const alertsSent = {
      movers: [] as any[],
      admins: [] as any[],
    };

    // Vérifier les documents expirant dans 30 jours
    const { data: expiringDocs, error: docsError } = await supabase
      .rpc('get_expiring_documents', { days_threshold: 30 });

    if (docsError) {
      console.error('Error fetching expiring documents:', docsError);
      throw docsError;
    }

    if (!expiringDocs || expiringDocs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun document à expirer',
          alertsSent: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Grouper les documents par déménageur
    const docsByMover = new Map<string, any[]>();
    for (const doc of expiringDocs) {
      if (!docsByMover.has(doc.mover_id)) {
        docsByMover.set(doc.mover_id, []);
      }
      docsByMover.get(doc.mover_id)!.push(doc);
    }

    // Envoyer des alertes aux déménageurs
    for (const [moverId, docs] of docsByMover.entries()) {
      // Récupérer les infos du déménageur
      const { data: mover } = await supabase
        .from('movers')
        .select('user_id, company_name, email')
        .eq('id', moverId)
        .single();

      if (!mover) continue;

      // Vérifier si une alerte similaire a déjà été envoyée dans les 7 derniers jours
      const { data: recentAlerts } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', mover.user_id)
        .eq('notification_type', 'document_expiring')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentAlerts && recentAlerts.length > 0) {
        // Alerte déjà envoyée récemment, on passe
        continue;
      }

      // Créer le message avec la liste des documents
      const docsList = docs
        .map(d => `- ${d.document_type}: expire le ${new Date(d.expiration_date).toLocaleDateString('fr-FR')} (${d.days_remaining} jours restants)`)
        .join('\n');

      const message = docs.length === 1
        ? `Votre ${docs[0].document_type} expire dans ${docs[0].days_remaining} jours. Merci de le renouveler au plus vite.`
        : `${docs.length} de vos documents expirent bientôt:\n${docsList}\n\nMerci de les renouveler au plus vite.`;

      // Créer la notification pour le déménageur
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: mover.user_id,
          notification_type: 'document_expiring',
          title: '📅 Documents à renouveler',
          message,
          related_entity_type: 'mover',
          related_entity_id: moverId,
        });

      if (!notifError) {
        alertsSent.movers.push({
          moverId,
          companyName: mover.company_name,
          documentsCount: docs.length,
        });
      }
    }

    // Envoyer une alerte récapitulative aux admins si beaucoup de documents expirent
    if (expiringDocs.length >= 5) {
      // Récupérer tous les admins
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id');

      if (admins && admins.length > 0) {
        const criticalDocs = expiringDocs.filter((d: any) => d.days_remaining <= 7);
        
        const message = criticalDocs.length > 0
          ? `Attention: ${criticalDocs.length} document(s) expirent dans moins de 7 jours !\n\nTotal de documents expirant dans 30 jours: ${expiringDocs.length}`
          : `${expiringDocs.length} documents de déménageurs expirent dans les 30 prochains jours.`;

        for (const admin of admins) {
          const { error: adminNotifError } = await supabase
            .from('notifications')
            .insert({
              user_id: admin.user_id,
              notification_type: 'admin_document_expiration_summary',
              title: '⚠️ Alertes expiration documents',
              message,
              related_entity_type: 'system',
              related_entity_id: null,
            });

          if (!adminNotifError) {
            alertsSent.admins.push(admin.user_id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiringDocumentsCount: expiringDocs.length,
        alertsSent: {
          movers: alertsSent.movers.length,
          admins: alertsSent.admins.length,
        },
        details: alertsSent,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error checking document expiration:', error);
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
