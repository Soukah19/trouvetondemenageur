import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Helper function to create email template wrapper
const createEmailTemplate = (title: string, subtitle: string, content: string) => `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); padding:40px 30px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:28px;">🏠 TrouveTonDéménageur</h1>
                <p style="color:#ffffff; margin-top:8px; font-size:14px;">${subtitle}</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:40px 30px;">
                <h2 style="color:#333; margin-bottom:16px;">${title}</h2>
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8f9fa; padding:30px; text-align:center; border-top:1px solid #e0e0e0;">
                <p style="color:#999; font-size:14px; margin-bottom:10px;">
                  Besoin d'aide ? 📧 support@trouvetondemenageur.fr
                </p>
                <p style="color:#ccc; font-size:12px; margin:0;">
                  © 2025 TrouveTonDéménageur. Tous droits réservés.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, recipientEmail, data, attachments } = await req.json();

    if (!type || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, recipientEmail" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "quote_request_submitted":
        subject = "Bienvenue sur TrouveTonDéménageur - Votre demande a été envoyée!";
        htmlContent = createEmailTemplate(
          "Bienvenue sur TrouveTonDéménageur! 🎉",
          "Votre demande a été envoyée",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Merci d'avoir choisi TrouveTonDéménageur! Nous avons bien reçu votre demande de déménagement.
            </p>

            <h3 style="color:#667eea; font-size:18px; margin:30px 0 16px;">📦 Récapitulatif de votre demande</h3>
            
            <div style="background:#f0f4ff; padding:20px; border-radius:10px; margin-bottom:20px;">
              <p style="color:#333; margin:8px 0;"><strong>📅 Date du déménagement:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:8px 0;"><strong>📊 Volume estimé:</strong> ${data.volume} m³</p>
            </div>

            <div style="background:#f8f9fa; padding:20px; border-radius:10px; margin-bottom:20px;">
              <p style="color:#333; margin:8px 0;"><strong>📍 Adresse de départ:</strong><br/>
              ${data.fromAddress}<br/>${data.fromCity}</p>
              <p style="color:#333; margin:16px 0 8px;"><strong>📍 Adresse d'arrivée:</strong><br/>
              ${data.toAddress}<br/>${data.toCity}</p>
            </div>

            <div style="background:#fff9e6; padding:20px; border-radius:10px; margin-bottom:20px;">
              <p style="color:#333; margin:8px 0;"><strong>🏠 Logement de départ:</strong> ${data.propertyType}${data.fromSurface ? ` (${data.fromSurface} m²)` : ''}<br/>
              ${data.floorFrom ? `Étage: ${data.floorFrom}${data.elevatorFrom ? ' - Avec ascenseur' : ' - Sans ascenseur'}` : ''}</p>
              <p style="color:#333; margin:16px 0 8px;"><strong>🏠 Logement d'arrivée:</strong> ${data.propertyType}${data.toSurface ? ` (${data.toSurface} m²)` : ''}<br/>
              ${data.floorTo ? `Étage: ${data.floorTo}${data.elevatorTo ? ' - Avec ascenseur' : ' - Sans ascenseur'}` : ''}</p>
            </div>

            ${data.servicesNeeded && data.servicesNeeded.length > 0 ? `
              <div style="background:#e6f7ff; padding:20px; border-radius:10px; margin-bottom:20px;">
                <p style="color:#333; margin:0 0 8px;"><strong>✨ Services demandés:</strong></p>
                <ul style="color:#666; margin:0; padding-left:20px;">
                  ${data.servicesNeeded.map((s: string) => `<li style="margin:4px 0;">${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${data.additionalInfo ? `
              <div style="background:#f0f0f0; padding:20px; border-radius:10px; margin-bottom:20px;">
                <p style="color:#333; margin:0;"><strong>💬 Informations complémentaires:</strong><br/>
                ${data.additionalInfo}</p>
              </div>
            ` : ''}

            <h3 style="color:#667eea; font-size:18px; margin:30px 0 16px;">📬 Prochaines étapes</h3>
            <div style="background:#f0f9ff; border-left:4px solid #667eea; padding:20px; border-radius:6px; margin-bottom:20px;">
              <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                <li>✅ Votre demande est maintenant visible par nos déménageurs professionnels vérifiés</li>
                <li>📨 Vous recevrez des propositions de devis par email sous 24-48 heures</li>
                <li>💰 Comparez les offres et choisissez celle qui vous convient</li>
                <li>🔒 Paiement 100% sécurisé avec protection IA anti-litiges</li>
              </ul>
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border:2px dashed #ffd700; margin-top:24px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>💡 Conseil:</strong> Connectez-vous régulièrement à votre espace client pour suivre les devis reçus et échanger avec les déménageurs.
              </p>
            </div>

            <div style="text-align:center; margin:30px 0;">
              <a href="https://www.trouvetondemenageur.fr/client/dashboard" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#ffffff; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
                Consulter / Modifier votre demande
              </a>
            </div>
          `
        );
        break;

      case "quote_received":
        subject = "Nouveau devis reçu pour votre déménagement";
        htmlContent = createEmailTemplate(
          "Vous avez reçu un nouveau devis 💰",
          "Nouvelle proposition disponible",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Une société vient de vous envoyer une proposition pour votre déménagement.
            </p>

            <div style="background:#f0f9ff; padding:24px; border-radius:10px; text-align:center; margin:30px 0; border:2px solid #667eea;">
              <p style="color:#667eea; font-size:32px; font-weight:700; margin:0;">${data.price} €</p>
              <p style="color:#999; font-size:14px; margin:8px 0 0;">Montant du devis</p>
            </div>

            ${data.message ? `
              <div style="background:#f8f9fa; padding:20px; border-radius:10px; margin-bottom:20px;">
                <p style="color:#333; margin:0;"><strong>💬 Message du déménageur:</strong><br/><br/>
                ${data.message}</p>
              </div>
            ` : ''}

            <div style="background:#eef2ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #3b82f6;">
              <p style="color:#1e3a8a; margin:0 0 8px; font-size:14px;">
                <strong>✨ Recommandé:</strong> Cette proposition est alignée sur vos disponibilités et les déménageurs gardent souvent leurs créneaux pour les clients rapides.
              </p>
              <p style="color:#334155; margin:0; font-size:14px;">
                Votre espace client est le meilleur endroit pour vérifier ce devis et confirmer votre date avant que les calendriers ne se remplissent.
              </p>
            </div>

            <div style="text-align:center; margin:30px 0;">
              <a href="https://www.trouvetondemenageur.fr/client/quotes" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#ffffff; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
                Consulter mes devis reçus
              </a>
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700; margin-top:24px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>👉 Prochaine étape:</strong> Connectez-vous à votre espace client pour consulter tous les détails et accepter ce devis.</p>
            </div>
          `
        );
        break;

      case "quote_accepted":
        subject = "Votre devis a été accepté";
        htmlContent = createEmailTemplate(
          "Félicitations! Votre devis a été accepté 🎉",
          "Confirmation de mission",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Le client a accepté votre devis de <strong>${data.price} €</strong> pour le déménagement du <strong>${data.movingDate}</strong>.
            </p>

            <div style="background:#ecfdf5; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #10b981;">
              <h3 style="color:#065f46; font-size:16px; margin:0 0 12px;">📋 Informations du déménagement</h3>
              <p style="color:#333; margin:4px 0;"><strong>De:</strong> ${data.fromCity}</p>
              <p style="color:#333; margin:4px 0;"><strong>Vers:</strong> ${data.toCity}</p>
              <p style="color:#333; margin:4px 0;"><strong>Contact client:</strong> ${data.clientEmail}</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px; margin-top:24px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📬 Prochaine étape:</strong> Le client va procéder au paiement de l'acompte. Vous recevrez une confirmation une fois le paiement effectué.
              </p>
            </div>
          `
        );
        break;

      case "payment_received":
        subject = "Paiement de l'acompte confirmé";
        htmlContent = createEmailTemplate(
          "L'acompte a été reçu ✅",
          "Confirmation de paiement",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Le client a effectué le paiement de l'acompte pour le déménagement du <strong>${data.movingDate}</strong>.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#667eea; font-size:16px; margin:0 0 12px;">💰 Détails du paiement</h3>
              <p style="color:#333; margin:8px 0;"><strong>Montant en escrow:</strong> ${data.escrowAmount} €</p>
              <p style="color:#333; margin:8px 0;"><strong>Solde à recevoir directement:</strong> ${data.remainingAmount} €</p>
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>ℹ️ Information:</strong> Le montant escrow de ${data.escrowAmount} € sera libéré après la fin du déménagement, sous réserve de l'acceptation de toutes les conditions.
              </p>
            </div>
          `
        );
        break;

      case "contract_sent":
        subject = `📄 Votre lettre de mission - Contrat n°${data.contractNumber}`;
        htmlContent = createEmailTemplate(
          "Votre lettre de mission 📄",
          `Contrat n°${data.contractNumber}`,
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Félicitations ! Votre déménagement est confirmé. Voici les détails de votre lettre de mission (contrat).
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #3b82f6;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">📋 Contrat n°${data.contractNumber}</h3>
              <p style="color:#333; margin:4px 0;"><strong>Déménageur:</strong> ${data.moverCompanyName}</p>
              <p style="color:#333; margin:4px 0;"><strong>Date du déménagement:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Trajet:</strong> ${data.fromCity} → ${data.toCity}</p>
            </div>

            <div style="background:#ecfdf5; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#065f46; font-size:16px; margin:0 0 12px;">💰 Détails financiers</h3>
              <p style="color:#333; margin:8px 0;"><strong>Montant total:</strong> ${data.totalAmount} €</p>
              <p style="color:#333; margin:8px 0;"><strong>Acompte versé:</strong> ${data.depositAmount} €</p>
              <p style="color:#333; margin:8px 0;"><strong>Solde à payer au déménageur:</strong> ${data.remainingAmount} €</p>
            </div>

            <div style="background:#fef3c7; padding:16px; border-radius:10px; border-left:4px solid #f59e0b; margin-bottom:20px;">
              <p style="color:#92400e; margin:0; font-size:14px;">
                <strong>⚠️ Important:</strong> Le solde de ${data.remainingAmount} € sera à régler directement au déménageur le jour du déménagement (espèces ou virement).
              </p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📥 Téléchargement:</strong> Vous pouvez télécharger votre contrat en PDF depuis votre espace client.
              </p>
            </div>
          `
        );
        break;

      case "contract_sent_mover":
        subject = `📄 Nouvelle mission confirmée - Contrat n°${data.contractNumber}`;
        htmlContent = createEmailTemplate(
          "Nouvelle mission de déménagement 🚚",
          `Contrat n°${data.contractNumber}`,
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Félicitations ! Un client vient de confirmer sa réservation avec vous. Voici les détails de la mission.
            </p>

            <div style="background:#ecfdf5; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #10b981;">
              <h3 style="color:#065f46; font-size:16px; margin:0 0 12px;">📋 Contrat n°${data.contractNumber}</h3>
              <p style="color:#333; margin:4px 0;"><strong>Client:</strong> ${data.clientName}</p>
              <p style="color:#333; margin:4px 0;"><strong>Email client:</strong> ${data.clientEmail}</p>
              <p style="color:#333; margin:4px 0;"><strong>Téléphone client:</strong> ${data.clientPhone || 'Non renseigné'}</p>
              <p style="color:#333; margin:4px 0;"><strong>Date du déménagement:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Trajet:</strong> ${data.fromCity} → ${data.toCity}</p>
            </div>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">💰 Détails financiers</h3>
              <p style="color:#333; margin:8px 0;"><strong>Votre devis accepté:</strong> ${data.totalAmount} €</p>
              <p style="color:#333; margin:8px 0;"><strong>Garantie:</strong> Vous avez une garantie de ${data.totalAmount - data.remainingAmount} €, qui sera versée après la mission si vous acceptez toutes les conditions.</p>
              <p style="color:#333; margin:8px 0;"><strong>Solde que vous recevrez du client:</strong> ${data.remainingAmount} €</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px; border-left:4px solid #3b82f6; margin-bottom:20px;">
              <p style="color:#1e40af; margin:0; font-size:14px;">
                <strong>💡 À noter:</strong> Le client vous paiera le solde de ${data.remainingAmount} € directement le jour du déménagement.
              </p>
            </div>

            <div style="background:#f0f0f0; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📥 Téléchargement:</strong> Vous pouvez télécharger la lettre de mission depuis votre espace déménageur.
              </p>
            </div>
          `
        );
        break;

      case "move_started":
        subject = "Votre déménagement a commencé";
        htmlContent = createEmailTemplate(
          "Votre déménagement est en cours 🚚",
          "Déménagement démarré",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Le déménageur a commencé votre déménagement.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; text-align:center; margin-bottom:20px;">
              <p style="color:#667eea; font-size:48px; margin:0;">🚚</p>
              <p style="color:#667eea; font-size:18px; font-weight:600; margin:12px 0 0;">Déménagement en cours...</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px; margin-bottom:16px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📱 Suivi en temps réel:</strong> Vous pouvez suivre la progression depuis votre espace client.
              </p>
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📸 N'oubliez pas:</strong> Prenez des photos avant et après le déménagement pour documenter l'état de vos biens.
              </p>
            </div>
          `
        );
        break;

      case "move_completed":
        subject = "Déménagement terminé - Merci de confirmer";
        htmlContent = createEmailTemplate(
          "Votre déménagement est terminé ✅",
          "Confirmation requise",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Le déménageur a indiqué que votre déménagement est terminé.
            </p>

            <div style="background:#ecfdf5; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #10b981;">
              <h3 style="color:#065f46; font-size:16px; margin:0 0 12px;">✓ Actions à effectuer</h3>
              <ul style="color:#333; margin:0; padding-left:20px; line-height:1.8;">
                <li>Vérifier l'état de tous vos biens</li>
                <li>Prendre des photos après le déménagement</li>
                <li>Signaler tout dommage éventuel dans les 24 heures</li>
                <li>Effectuer le paiement du solde au déménageur</li>
              </ul>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>ℹ️ Information:</strong> Si tout s'est bien passé, l'escrow sera libéré automatiquement au déménageur dans 48 heures.
              </p>
            </div>
          `
        );
        break;

      case "damage_reported":
        subject = "Rapport de dommage soumis";
        htmlContent = createEmailTemplate(
          "Un rapport de dommage a été soumis ⚠️",
          "Signalement de dommage",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Un rapport de dommage a été créé pour le déménagement du <strong>${data.movingDate}</strong>.
            </p>

            <div style="background:#fef3c7; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #f59e0b;">
              <h3 style="color:#92400e; font-size:16px; margin:0 0 12px;">📋 Détails du rapport</h3>
              <p style="color:#333; margin:4px 0;"><strong>Description:</strong> ${data.description}</p>
              <p style="color:#333; margin:4px 0;"><strong>Sévérité:</strong> ${data.severity}</p>
              <p style="color:#333; margin:4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>🔍 Prochaine étape:</strong> Notre équipe va examiner le rapport et vous contacter sous 24-48 heures.
              </p>
            </div>
          `
        );
        break;

      case "escrow_released":
        subject = "Escrow libéré - Paiement transféré";
        htmlContent = createEmailTemplate(
          "L'escrow a été libéré 💸",
          "Paiement transféré",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              L'escrow de <strong>${data.escrowAmount} €</strong> a été libéré et transféré sur votre compte.
            </p>

            <div style="background:#ecfdf5; padding:24px; border-radius:10px; text-align:center; margin:30px 0; border:2px solid #10b981;">
              <p style="color:#10b981; font-size:48px; margin:0;">✓</p>
              <p style="color:#065f46; font-size:18px; font-weight:600; margin:12px 0 0;">Paiement effectué</p>
              <p style="color:#10b981; font-size:32px; font-weight:700; margin:12px 0 0;">${data.escrowAmount} €</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>✅ Confirmation:</strong> Le déménagement du ${data.movingDate} est maintenant complètement finalisé. Merci d'avoir utilisé TrouveTonDéménageur!
              </p>
            </div>
          `
        );
        break;

      case "contract_signature_request":
        subject = "Signature de contrat requise";
        htmlContent = createEmailTemplate(
          "Veuillez signer le contrat de déménagement ✍️",
          "Signature électronique requise",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Le contrat de déménagement pour le <strong>${data.movingDate}</strong> est prêt et attend votre signature électronique.
            </p>

            <div style="background:#f0f9ff; padding:24px; border-radius:10px; text-align:center; margin:30px 0; border:2px solid #667eea;">
              <p style="color:#667eea; font-size:32px; font-weight:700; margin:0;">${data.price} €</p>
              <p style="color:#999; font-size:14px; margin:8px 0 0;">Montant du devis</p>
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700; margin-bottom:16px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>👉 Action requise:</strong> Connectez-vous à votre espace pour consulter et signer le contrat en ligne.
              </p>
            </div>

            <div style="background:#f0f0f0; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>ℹ️ Information:</strong> La signature électronique est conforme à la réglementation eIDAS et a la même valeur juridique qu'une signature manuscrite.
              </p>
            </div>
          `
        );
        break;

      case "contract_fully_signed":
        subject = "Contrat signé - Déménagement confirmé";
        htmlContent = createEmailTemplate(
          "Contrat entièrement signé ✓",
          "Déménagement confirmé",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Le contrat de déménagement a été signé par toutes les parties.
            </p>

            <div style="background:#ecfdf5; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #10b981;">
              <h3 style="color:#065f46; font-size:16px; margin:0 0 12px;">📋 Détails du contrat</h3>
              <p style="color:#333; margin:4px 0;"><strong>Date du déménagement:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Montant:</strong> ${data.price} €</p>
              <p style="color:#333; margin:4px 0;"><strong>De:</strong> ${data.fromCity}</p>
              <p style="color:#333; margin:4px 0;"><strong>Vers:</strong> ${data.toCity}</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📥 Téléchargement:</strong> Vous pouvez télécharger une copie du contrat signé depuis votre espace client.
              </p>
            </div>
          `
        );
        break;

      case "document_verified":
        subject = "Document vérifié avec succès";
        htmlContent = createEmailTemplate(
          "Votre document a été vérifié ✅",
          "Vérification réussie",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Votre <strong>${data.documentType}</strong> a été vérifié avec succès.
            </p>

            <div style="background:#ecfdf5; padding:24px; border-radius:10px; text-align:center; margin:30px 0; border:2px solid #10b981;">
              <p style="color:#10b981; font-size:48px; margin:0;">✓</p>
              <p style="color:#065f46; font-size:18px; font-weight:600; margin:12px 0;">Document vérifié</p>
              <p style="color:#666; font-size:14px; margin:8px 0 0;">Confiance: ${data.confidence}%</p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>✅ Confirmation:</strong> Vous pouvez maintenant continuer à utiliser nos services.
              </p>
            </div>
          `
        );
        break;

      case "document_rejected":
        subject = "Document rejeté - Action requise";
        htmlContent = createEmailTemplate(
          "Votre document a été rejeté ⚠️",
          "Action requise",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Bonjour,<br/><br/>
              Votre document <strong>"${data.documentType}"</strong> a été rejeté par notre équipe de vérification.
            </p>

            <div style="background:#fef3c7; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #f59e0b;">
              <p style="color:#92400e; margin:0;"><strong>Raison du rejet :</strong> ${data.rejectionReason}</p>
            </div>

            <div style="background:#f0f0f0; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#333; font-size:16px; margin:0 0 12px;">✓ Actions recommandées</h3>
              <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                <li>Vérifier que le document est valide et non expiré</li>
                <li>S'assurer que la photo est claire et lisible</li>
                <li>Télécharger un nouveau document de meilleure qualité</li>
              </ul>
            </div>

            <div style="text-align:center; margin:30px 0;">
              <a href="https://www.trouvetondemenageur.fr/mover/documents" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#ffffff; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
                📄 Accéder à mes documents
              </a>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>ℹ️ Support:</strong> Si vous pensez qu'il s'agit d'une erreur, contactez notre support à support@trouvetondemenageur.fr.
              </p>
            </div>
          `
        );
        break;

      case "fraud_alert":
        subject = "⚠️ Alerte de sécurité - Action requise";
        htmlContent = createEmailTemplate(
          "Alerte de sécurité sur votre compte 🔒",
          "Action de sécurité requise",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Nous avons détecté une activité suspecte sur votre compte.
            </p>

            <div style="background:#fef2f2; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #ef4444;">
              <h3 style="color:#991b1b; font-size:16px; margin:0 0 12px;">⚠️ Détails de l'alerte</h3>
              <p style="color:#333; margin:4px 0;"><strong>Type d'alerte:</strong> ${data.alertType}</p>
              <p style="color:#333; margin:4px 0;"><strong>Sévérité:</strong> ${data.severity}</p>
            </div>

            <div style="background:#fef3c7; padding:16px; border-radius:10px; border-left:4px solid #f59e0b; margin-bottom:16px;">
              <p style="color:#92400e; margin:0; font-size:14px;">
                <strong>⚠️ Mesure de sécurité:</strong> Certaines fonctionnalités de votre compte peuvent être temporairement limitées.
              </p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>🔍 Prochaine étape:</strong> Notre équipe examine cette alerte et vous contactera sous 24-48 heures. Si vous pensez qu'il s'agit d'une erreur, contactez immédiatement notre support.
              </p>
            </div>
          `
        );
        break;

      case "review_request":
        subject = "Donnez votre avis sur votre déménagement";
        htmlContent = createEmailTemplate(
          "Comment s'est passé votre déménagement? ⭐",
          "Votre avis compte",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Votre déménagement du ${data.movingDate} avec <strong>${data.moverName}</strong> est terminé.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; text-align:center;">
              <p style="color:#667eea; font-size:48px; margin:0;">⭐⭐⭐⭐⭐</p>
              <p style="color:#667eea; font-size:18px; font-weight:600; margin:12px 0 0;">Votre avis nous intéresse!</p>
            </div>

            <div style="background:#f8f9fa; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#333; font-size:16px; margin:0 0 12px;">Évaluez votre expérience</h3>
              <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                <li>Ponctualité</li>
                <li>Professionnalisme</li>
                <li>Soin des biens</li>
                <li>Rapport qualité-prix</li>
              </ul>
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>💡 Le saviez-vous?</strong> Votre retour aide d'autres clients à faire le bon choix et permet aux déménageurs d'améliorer leurs services.
              </p>
            </div>
          `
        );
        break;

      case "mover_registration_received":
        subject = "Inscription reçue - Vérification en cours";
        htmlContent = createEmailTemplate(
          `Merci pour votre inscription ! 🎉`,
          "Demande d'adhésion reçue",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Bonjour ${data.company_name ? data.company_name : ''},<br/><br/>
              Nous avons bien reçu votre demande d'adhésion en tant que déménageur professionnel sur TrouveTonDéménageur.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #667eea;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">📋 Prochaines étapes</h3>
              <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                <li>✓ Votre dossier est maintenant en cours de vérification par notre équipe</li>
                <li>Nous examinerons vos informations et documents sous 48 heures ouvrées</li>
                <li>Vous recevrez un email de confirmation dès validation de votre compte</li>
                <li>Vous pourrez alors accéder aux demandes de devis et développer votre activité</li>
              </ul>
            </div>

            <div style="background:#f8f9fa; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#333; font-size:16px; margin:0 0 12px;">🔍 Notre équipe vérifie notamment</h3>
              <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                <li>Votre extrait KBIS</li>
                <li>Votre attestation d'assurance professionnelle</li>
                <li>Votre pièce d'identité</li>
                <li>Les cartes grises de vos véhicules</li>
              </ul>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>📧 Notifications:</strong> Vous recevrez des notifications à chaque étape de validation. Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
            </div>
          `
        );
        break;

      case "mover_approval":
        subject = "Votre profil déménageur a été approuvé";
        htmlContent = createEmailTemplate(
          "Bienvenue sur TrouveTonDéménageur! 🎉",
          "Inscription approuvée",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Votre inscription en tant que déménageur professionnel a été approuvée.
            </p>

            <div style="background:#ecfdf5; padding:24px; border-radius:10px; text-align:center; margin:30px 0; border:2px solid #10b981;">
              <p style="color:#10b981; font-size:48px; margin:0;">✓</p>
              <p style="color:#065f46; font-size:18px; font-weight:600; margin:12px 0;">Profil approuvé</p>
            </div>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">🚀 Vous pouvez maintenant</h3>
              <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                <li>Consulter les demandes de devis</li>
                <li>Envoyer des propositions aux clients</li>
                <li>Gérer vos déménagements</li>
                <li>Recevoir des paiements sécurisés</li>
              </ul>
            </div>


            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>👉 Prochaine étape:</strong> Connectez-vous à votre espace pour commencer!
              </p>
            </div>
          `
        );
        break;

      case "return_trip_opportunity":
        subject = "🚚 Opportunité de retour - Évitez le retour à vide!";
        htmlContent = createEmailTemplate(
          "Nouvelle opportunité de retour! 🎯",
          "Optimisez votre rentabilité",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Bonne nouvelle! Un déménagement correspond à votre itinéraire de retour.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #667eea;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">📍 Votre déménagement prévu</h3>
              <p style="color:#333; margin:4px 0;"><strong>Arrivée à:</strong> ${data.yourArrivalCity}</p>
              <p style="color:#333; margin:4px 0;"><strong>Date d'arrivée estimée:</strong> ${data.yourArrivalDate}</p>
            </div>

            <div style="background:#ecfdf5; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #10b981;">
              <h3 style="color:#065f46; font-size:16px; margin:0 0 12px;">🆕 Nouveau déménagement disponible</h3>
              <p style="color:#333; margin:4px 0;"><strong>Départ de:</strong> ${data.newDepartureCity} (${data.newDeparturePostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Arrivée à:</strong> ${data.newArrivalCity} (${data.newArrivalPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Date:</strong> ${data.newMovingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Type:</strong> ${data.homeSize}</p>
              ${data.volumeM3 ? `<p style="color:#333; margin:4px 0;"><strong>Volume:</strong> ${data.volumeM3} m³</p>` : ''}
            </div>

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>🎯 Astuce:</strong> Optimisez votre rentabilité en évitant le retour à vide! Connectez-vous rapidement pour consulter cette demande et soumettre votre devis.
              </p>
            </div>
          `
        );
        break;

      case "activity_zone_new_quote":
        subject = "📍 Nouvelle demande dans votre zone d'activité";
        htmlContent = createEmailTemplate(
          "Nouvelle demande de déménagement 📦",
          "Dans votre zone d'activité",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Une nouvelle demande de devis correspond à votre zone d'activité.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #667eea;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">📋 Détails du déménagement</h3>
              <p style="color:#333; margin:4px 0;"><strong>Départ:</strong> ${data.fromCity} (${data.fromPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Arrivée:</strong> ${data.toCity} (${data.toPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Date:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Type de bien:</strong> ${data.homeSize}</p>
              ${data.volumeM3 ? `<p style="color:#333; margin:4px 0;"><strong>Volume:</strong> ${data.volumeM3} m³</p>` : ''}
              ${data.surfaceM2 ? `<p style="color:#333; margin:4px 0;"><strong>Surface:</strong> ${data.surfaceM2} m²</p>` : ''}
            </div>

            ${data.servicesNeeded && data.servicesNeeded.length > 0 ? `
              <div style="background:#e6f7ff; padding:20px; border-radius:10px; margin-bottom:20px;">
                <h3 style="color:#0369a1; font-size:16px; margin:0 0 12px;">✨ Services demandés</h3>
                <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                  ${data.servicesNeeded.map((s: string) => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="background:#fffbe6; padding:16px; border-radius:10px; border-left:4px solid #ffd700;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>⏱️ Soyez rapide!</strong> Les premiers devis ont plus de chances d'être acceptés. Connectez-vous pour consulter tous les détails et soumettre votre devis.
              </p>
            </div>
          `
        );
        break;

      case "quote_update":
        subject = "🔄 Demande de déménagement modifiée";
        htmlContent = createEmailTemplate(
          "Une demande a été modifiée 🔄",
          "Mise à jour requise",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              ${data.modifiedBy === 'admin' ? 'Un administrateur' : 'Le client'} a modifié la demande de déménagement pour laquelle vous avez soumis un devis.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #667eea;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">📋 Détails actualisés du déménagement</h3>
              <p style="color:#333; margin:4px 0;"><strong>Départ:</strong> ${data.fromCity} (${data.fromPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Arrivée:</strong> ${data.toCity} (${data.toPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Date:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Type de bien:</strong> ${data.homeSize}</p>
              ${data.volumeM3 ? `<p style="color:#333; margin:4px 0;"><strong>Volume:</strong> ${data.volumeM3} m³</p>` : ''}
              ${data.surfaceM2 ? `<p style="color:#333; margin:4px 0;"><strong>Surface:</strong> ${data.surfaceM2} m²</p>` : ''}
            </div>

            ${data.servicesNeeded && data.servicesNeeded.length > 0 ? `
              <div style="background:#e6f7ff; padding:20px; border-radius:10px; margin-bottom:20px;">
                <h3 style="color:#0369a1; font-size:16px; margin:0 0 12px;">✨ Services demandés</h3>
                <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                  ${data.servicesNeeded.map((s: string) => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="background:#fef3c7; padding:16px; border-radius:10px; border-left:4px solid #f59e0b; margin-bottom:16px;">
              <p style="color:#92400e; margin:0; font-size:14px;">
                <strong>⚠️ Action requise:</strong> Veuillez vérifier votre devis et l'ajuster si nécessaire pour tenir compte de ces modifications.
              </p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>👉 Prochaine étape:</strong> Connectez-vous à votre espace déménageur pour consulter tous les détails et modifier votre proposition.
              </p>
            </div>
          `
        );
        break;

      case "admin_modified_client_request":
        subject = "✏️ Votre demande de déménagement a été mise à jour";
        htmlContent = createEmailTemplate(
          "Votre demande a été modifiée ✏️",
          "Mise à jour par l'équipe TrouveTonDéménageur",
          `
            <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:24px;">
              Bonjour${data.clientName ? ` ${data.clientName}` : ''},<br/><br/>
              Notre équipe a apporté des modifications à votre demande de déménagement afin de mieux correspondre à vos besoins.
            </p>

            <div style="background:#f0f9ff; padding:20px; border-radius:10px; margin-bottom:20px; border-left:4px solid #667eea;">
              <h3 style="color:#1e40af; font-size:16px; margin:0 0 12px;">📋 Détails actualisés de votre demande</h3>
              <p style="color:#333; margin:4px 0;"><strong>Départ:</strong> ${data.fromCity} (${data.fromPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Arrivée:</strong> ${data.toCity} (${data.toPostalCode})</p>
              <p style="color:#333; margin:4px 0;"><strong>Date:</strong> ${data.movingDate}</p>
              <p style="color:#333; margin:4px 0;"><strong>Type de bien:</strong> ${data.homeSize}</p>
              ${data.volumeM3 ? `<p style="color:#333; margin:4px 0;"><strong>Volume:</strong> ${data.volumeM3} m³</p>` : ''}
              ${data.surfaceM2 ? `<p style="color:#333; margin:4px 0;"><strong>Surface:</strong> ${data.surfaceM2} m²</p>` : ''}
            </div>

            ${data.servicesNeeded && data.servicesNeeded.length > 0 ? `
              <div style="background:#e6f7ff; padding:20px; border-radius:10px; margin-bottom:20px;">
                <h3 style="color:#0369a1; font-size:16px; margin:0 0 12px;">✨ Services demandés</h3>
                <ul style="color:#666; margin:0; padding-left:20px; line-height:1.8;">
                  ${data.servicesNeeded.map((s: string) => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="background:#ecfdf5; padding:16px; border-radius:10px; border-left:4px solid #10b981; margin-bottom:16px;">
              <p style="color:#065f46; margin:0; font-size:14px;">
                <strong>ℹ️ Information:</strong> Les déménageurs ayant déjà soumis un devis ont été notifiés de ces changements et pourront ajuster leurs propositions.
              </p>
            </div>

            <div style="background:#dbeafe; padding:16px; border-radius:10px;">
              <p style="color:#666; margin:0; font-size:14px;">
                <strong>👉 Prochaine étape:</strong> Connectez-vous à votre espace client pour vérifier les détails et suivre les nouveaux devis.
              </p>
            </div>
          `
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown notification type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("Email notification (dev mode):");
      console.log("To:", recipientEmail);
      console.log("Subject:", subject);
      console.log("Content:", htmlContent);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email logged (dev mode - no API key configured)",
          preview: { subject, to: recipientEmail }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TrouveTonDéménageur <noreply@trouvetondemenageur.fr>",
        to: [recipientEmail],
        subject: subject,
        html: htmlContent,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error("Failed to send email");
    }

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        message: "Notification sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-notification:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send notification"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});