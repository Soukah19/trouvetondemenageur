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
    const { type, record, userType, email, userId, companyName, isValidation, isProfileCompleted } = await req.json();

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
    } else if (isMoverEmail && isProfileCompleted) {
      emailSubject = '📋 Profil complété — Vérification en cours';
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
            .button { display: inline-block; background: #3B82F6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
            .status-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 28px;">📋 Profil complété avec succès !</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <p style="margin: 0; font-size: 16px;"><strong>✅ Toutes vos informations et documents ont été soumis !</strong></p>
              </div>
              
              <p>Bonjour ${moverCompanyName || 'Cher partenaire'},</p>
              
              <p>Merci d'avoir complété votre profil professionnel sur <strong>TrouveTonDemenageur</strong>. Nous avons bien reçu l'ensemble de vos informations et documents.</p>

              <div class="status-box">
                <p style="margin: 0; font-size: 16px;"><strong>⏳ Statut : EN COURS DE VÉRIFICATION</strong></p>
              </div>

              <h3 style="color: #1F2937;">🔍 Que se passe-t-il maintenant ?</h3>
              
              <ol>
                <li><strong>Vérification de vos documents</strong> — Notre système IA analyse automatiquement votre KBIS, attestation d'assurance et licence de transport</li>
                <li><strong>Révision par notre équipe</strong> — Un administrateur vérifie manuellement votre dossier</li>
                <li><strong>Activation de votre compte</strong> — Vous recevrez un email de confirmation</li>
              </ol>

              <div style="background: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏱️ Délai estimé :</strong> La vérification est généralement effectuée sous <strong>24 à 48 heures</strong> ouvrables.</p>
              </div>

              <h3 style="color: #1F2937;">🚀 Dès que votre compte sera validé, vous pourrez :</h3>
              <ul>
                <li>✅ Recevoir des demandes de devis dans votre zone d'activité</li>
                <li>✅ Envoyer vos propositions aux clients</li>
                <li>✅ Gérer vos missions depuis votre tableau de bord</li>
                <li>✅ Recevoir vos paiements sécurisés</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.trouvetondemenageur.fr/mover/dashboard" class="button">Accéder à mon espace →</a>
              </div>

              <p style="margin-top: 30px;">
                Merci de votre confiance !<br>
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
    } else if (isMoverEmail) {
      emailSubject = '✅ Inscription réussie — Complétez votre profil professionnel';
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
            .button { display: inline-block; background: #10B981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
            .action-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
            .step-num { background: #3B82F6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 28px;">🎉 Inscription réussie !</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Bienvenue dans le réseau TrouveTonDemenageur</p>
            </div>
            <div class="content">
              <div class="success-box">
                <p style="margin: 0; font-size: 16px;"><strong>✅ Votre compte a été créé avec succès !</strong></p>
              </div>
              
              <p>Bonjour,</p>
              
              <p>Merci de rejoindre <strong>TrouveTonDemenageur</strong> ! Votre compte déménageur est bien créé.</p>

              <div class="action-box">
                <p style="margin: 0; font-size: 16px;"><strong>⚡ Action requise : Complétez votre profil professionnel</strong></p>
                <p style="margin: 8px 0 0; font-size: 14px;">Pour recevoir des demandes de devis, vous devez compléter les informations suivantes :</p>
              </div>

              <h3 style="color: #1F2937;">📋 Étapes à compléter :</h3>
              
              <div class="step">
                <span class="step-num">1</span>
                <div>
                  <strong>Informations du gérant</strong><br>
                  <span style="color: #6B7280; font-size: 14px;">Prénom, nom, téléphone, pièce d'identité</span>
                </div>
              </div>

              <div class="step">
                <span class="step-num">2</span>
                <div>
                  <strong>Informations de l'entreprise</strong><br>
                  <span style="color: #6B7280; font-size: 14px;">Nom de société, SIRET, adresse, services proposés, zone de couverture</span>
                </div>
              </div>

              <div class="step">
                <span class="step-num">3</span>
                <div>
                  <strong>Documents obligatoires</strong><br>
                  <span style="color: #6B7280; font-size: 14px;">KBIS, attestation d'assurance RC PRO, licence de transport</span>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.trouvetondemenageur.fr/mover/profile-completion" class="button">Compléter mon profil maintenant →</a>
              </div>

              <div style="background: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
                <p style="margin: 0;"><strong>💡 Bon à savoir :</strong> Une fois votre profil complet, notre équipe vérifiera vos documents sous 24-48h. Vous serez notifié par email dès que votre compte sera activé et que vous pourrez recevoir des demandes de devis.</p>
              </div>

              <p style="margin-top: 30px;">
                À très bientôt sur la plateforme !<br>
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