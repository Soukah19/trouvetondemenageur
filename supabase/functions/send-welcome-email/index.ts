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
    const { type, record, userType, email, userId, companyName, isValidation } = await req.json();

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

    let userEmail = email;
    let emailHtml = '';
    let emailSubject = '';
    let isClientEmail = false;
    let isMoverEmail = false;
    let isMoverValidation = isValidation === true;
    let moverCompanyName = companyName;

    // If userId is provided, get the email from auth.users (this is the user's actual email)
    if (userId && !email) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError) {
        console.error('Error fetching user by userId:', userError);
      } else if (userData?.user?.email) {
        userEmail = userData.user.email;
        console.log('Got user email from auth.users:', userEmail);
      }
    }

    if (userType === 'client' && (email || userId)) {
      if (!userEmail && userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        userEmail = userData?.user?.email;
      }
      isClientEmail = true;
    } else if (userType === 'mover' && (email || userId)) {
      if (!userEmail && userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        userEmail = userData?.user?.email;
      }
      isMoverEmail = true;
    } else if (record && record.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(record.user_id);
      if (!userData || !userData.user?.email) {
        console.error('User email not found');
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userEmail = userData.user.email;

      if ('company_name' in record) {
        isMoverEmail = true;
        moverCompanyName = record.company_name;
      } else if ('first_name' in record) {
        isClientEmail = true;
      }
    }

    // Validate that we have an email
    if (!userEmail) {
      console.error('No email address found');
      return new Response(JSON.stringify({ error: 'No email address provided or found' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Sending email to:', userEmail, 'Type:', userType, 'isValidation:', isMoverValidation);

    // Handle mover account validation email
    if (isMoverValidation || (isMoverEmail && isValidation)) {
      emailSubject = '🎉 Votre compte déménageur est validé !';
      emailHtml = `
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
              <h1 style="margin:0; font-size: 28px;">🎉 Félicitations ${moverCompanyName || 'Partenaire'} !</h1>
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
                <a href="https://trouveton-demenageur.fr/mover/dashboard" class="button">Accéder à mon tableau de bord</a>
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
              <p>Besoin d'aide ? Contactez-nous à contact@trouveton-demenageur.fr</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (isClientEmail) {
      emailSubject = 'Bienvenue sur TrouveTonDemenageur !';
      emailHtml = `
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
              <p>Bonjour ${record?.first_name || 'Cher client'},</p>
              
              <p>Merci de votre inscription sur <strong>TrouveTonDemenageur</strong>, votre plateforme de confiance pour trouver des déménageurs professionnels vérifiés.</p>
              
              <h3>Votre compte est prêt !</h3>
              <p>Vous pouvez maintenant :</p>
              <ul>
                <li>✅ Créer vos demandes de devis en quelques clics</li>
                <li>✅ Recevoir des propositions de déménageurs vérifiés</li>
                <li>✅ Comparer les offres et choisir la meilleure</li>
                <li>✅ Suivre votre déménagement en temps réel</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://trouveton-demenageur.fr" class="button">Accéder à mon espace</a>
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
    } else if (isMoverEmail) {
      emailSubject = 'Bienvenue dans le réseau TrouveTonDemenageur !';
      emailHtml = `
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
            .status-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 28px;">🎉 Bienvenue dans notre réseau !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${moverCompanyName || record?.company_name || 'Cher partenaire'},</p>
              
              <p>Merci d'avoir rejoint le réseau <strong>TrouveTonDemenageur</strong> ! Votre inscription a bien été enregistrée.</p>
              
              <div class="status-box">
                <p style="margin: 0;"><strong>⏳ Statut de votre compte : EN ATTENTE DE VÉRIFICATION</strong></p>
              </div>

              <h3>📋 Prochaines étapes</h3>
              <p>Votre compte est actuellement en cours de vérification par notre équipe. Voici ce qui va se passer :</p>
              
              <ol>
                <li><strong>Vérification des documents</strong> (KBIS, assurance RC PRO, pièce d'identité)</li>
                <li><strong>Validation par notre système IA</strong> (analyse automatique des documents)</li>
                <li><strong>Révision manuelle par nos administrateurs</strong> (sous 24-48h)</li>
                <li><strong>Activation de votre compte</strong></li>
              </ol>

              <h3>📧 Quand allez-vous recevoir des demandes de devis ?</h3>
              <p><strong>Une fois votre compte validé par nos administrateurs</strong>, vous pourrez :</p>
              <ul>
                <li>✅ Recevoir des demandes de devis dans votre zone d'activité</li>
                <li>✅ Envoyer vos propositions aux clients</li>
                <li>✅ Gérer vos missions depuis votre tableau de bord</li>
                <li>✅ Recevoir vos paiements sécurisés</li>
              </ul>

              <div style="background: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
                <p style="margin: 0;"><strong>💡 Conseil :</strong> Assurez-vous que tous vos documents sont à jour pour accélérer la validation !</p>
              </div>

              <div style="text-align: center;">
                <a href="https://trouveton-demenageur.fr" class="button">Accéder à mon espace professionnel</a>
              </div>

              <h3>🔔 Notifications</h3>
              <p>Vous recevrez un email dès que :</p>
              <ul>
                <li>Votre compte sera validé</li>
                <li>Une nouvelle demande de devis correspondra à votre zone</li>
                <li>Un client acceptera votre devis</li>
                <li>Un paiement sera disponible</li>
              </ul>

              <p style="margin-top: 30px;">
                Merci de votre confiance !<br>
                <strong>L'équipe TrouveTonDemenageur</strong>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 TrouveTonDemenageur - Tous droits réservés</p>
              <p>Besoin d'aide ? Contactez-nous à contact@trouveton-demenageur.fr</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      return new Response(JSON.stringify({ skipped: true, reason: 'Unknown user type' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrouveTonDemenageur <noreply@trouvetondemenageur.fr>',
        to: [userEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log('Welcome email sent successfully:', result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
