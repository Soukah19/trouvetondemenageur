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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending notifications
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const notification of pendingNotifications) {
      try {
        let emailHtml = '';
        let emailSubject = '';

        if (notification.type === 'mover_account_validated') {
          emailSubject = '🎉 Votre compte déménageur est validé !';
          emailHtml = generateMoverValidatedEmail(notification.recipient_name, notification.data);
        } else if (notification.type === 'client_welcome') {
          emailSubject = 'Bienvenue sur TrouveTonDemenageur !';
          emailHtml = generateClientWelcomeEmail(notification.recipient_name);
        } else {
          console.log(`Unknown notification type: ${notification.type}`);
          continue;
        }

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'TrouveTonDemenageur <noreply@trouvetondemenageur.fr>',
            to: [notification.recipient_email],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          // Update notification status
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'sent',
              processed_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          
          processed++;
        } else {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email: ${errorText}`);
          
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'failed',
              data: { ...notification.data, error: errorText }
            })
            .eq('id', notification.id);
          
          errors++;
        }
      } catch (err) {
        console.error(`Error processing notification ${notification.id}:`, err);
        errors++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed, 
      errors,
      total: pendingNotifications.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error processing welcome emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateMoverValidatedEmail(companyName: string, data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">🎉 Félicitations ${companyName || 'Partenaire'} !</h1>
        </div>
        <div class="content">
          <div class="success-box">
            <p style="margin: 0; font-size: 18px;"><strong>✅ Votre compte a été validé !</strong></p>
          </div>
          
          <p>Excellente nouvelle ! Après vérification de vos documents, votre compte déménageur sur <strong>TrouveTonDemenageur</strong> a été validé par notre équipe.</p>
          
          <h3>🚀 Vous êtes maintenant opérationnel !</h3>
          <p>Vous pouvez désormais :</p>
          <ul>
            <li>✅ <strong>Recevoir des demandes de devis</strong> dans votre zone d'activité</li>
            <li>✅ <strong>Envoyer vos propositions</strong> aux clients</li>
            <li>✅ <strong>Gérer vos missions</strong> depuis votre tableau de bord</li>
            <li>✅ <strong>Recevoir vos paiements</strong> sécurisés</li>
          </ul>

          <div style="text-align: center;">
            <a href="https://trouvetondemenageur.fr/mover/dashboard" class="button">Accéder à mon tableau de bord</a>
          </div>

          <h3>📧 Comment ça marche ?</h3>
          <ol>
            <li>Vous recevrez automatiquement les demandes de devis dans votre zone</li>
            <li>Envoyez vos propositions aux clients intéressés</li>
            <li>Si un client accepte votre devis, vous êtes notifié</li>
            <li>Réalisez la mission et recevez votre paiement</li>
          </ol>

          <div style="background: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Conseil :</strong> Répondez rapidement aux demandes de devis pour augmenter vos chances d'être sélectionné !</p>
          </div>

          <p>Notre équipe est à votre disposition pour toute question.</p>
          
          <p>Bonne route avec TrouveTonDemenageur ! 🚚</p>
          
          <p style="margin-top: 30px;">
            Cordialement,<br>
            <strong>L'équipe TrouveTonDemenageur</strong>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 TrouveTonDemenageur - Tous droits réservés</p>
          <p>Besoin d'aide ? Contactez-nous à support@trouvetondemenageur.fr</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateClientWelcomeEmail(firstName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">🏠 Bienvenue sur TrouveTonDemenageur !</h1>
        </div>
        <div class="content">
          <p>Bonjour ${firstName || 'Cher client'},</p>
          
          <p>Merci d'avoir créé votre compte sur <strong>TrouveTonDemenageur</strong>, votre plateforme de confiance pour trouver des déménageurs professionnels vérifiés.</p>
          
          <h3>Votre compte est prêt !</h3>
          <p>Vous pouvez maintenant :</p>
          <ul>
            <li>✅ Créer vos demandes de devis en quelques clics</li>
            <li>✅ Recevoir des propositions de déménageurs vérifiés</li>
            <li>✅ Comparer les offres et choisir la meilleure</li>
            <li>✅ Suivre votre déménagement en temps réel</li>
          </ul>

          <div style="text-align: center;">
            <a href="https://trouvetondemenageur.fr" class="button">Accéder à mon espace</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <h3>📧 Quand allez-vous recevoir vos devis ?</h3>
          <p><strong>Après avoir créé votre demande de déménagement</strong>, voici ce qui va se passer :</p>
          <ol>
            <li>Vous créez votre demande avec les détails de votre déménagement</li>
            <li>Les déménageurs de votre région reçoivent instantanément votre demande</li>
            <li>Ils vous envoient leurs devis sous 24-48h</li>
            <li>Vous recevez un email pour chaque nouveau devis</li>
            <li>Vous pouvez comparer et choisir la meilleure offre</li>
          </ol>

          <div style="background: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Conseil :</strong> Plus votre demande est détaillée, plus les devis seront précis !</p>
          </div>

          <p>Si vous avez des questions, notre équipe est à votre disposition.</p>
          
          <p>Bonne chance pour votre déménagement ! 🚚</p>
          
          <p style="margin-top: 30px;">
            Cordialement,<br>
            <strong>L'équipe TrouveTonDemenageur</strong>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 TrouveTonDemenageur - Tous droits réservés</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
