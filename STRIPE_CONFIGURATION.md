# Configuration de Stripe pour TrouveTonDéménageur

## État actuel

La plateforme fonctionne actuellement en **mode test** sans intégration Stripe réelle. Les paiements sont simulés et enregistrés dans la base de données avec un ID de transaction fictif (`test_` + timestamp).

## Prérequis pour l'intégration Stripe

### 1. Créer un compte Stripe

1. Créez un compte sur [https://stripe.com](https://stripe.com)
2. Vérifiez votre identité et configurez votre compte entreprise
3. Accédez au tableau de bord: [https://dashboard.stripe.com](https://dashboard.stripe.com)

### 2. Obtenir les clés API

1. Allez dans **Développeurs > Clés API**: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copiez la **Clé publiable** (commence par `pk_test_` ou `pk_live_`)
3. Copiez la **Clé secrète** (commence par `sk_test_` ou `sk_live_`)

⚠️ **Important**: Utilisez les clés de **test** pendant le développement, et les clés de **production** uniquement en production.

### 3. Configurer les variables d'environnement

Ajoutez vos clés dans le fichier `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_ici
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_ici
```

## Architecture d'intégration recommandée

### Option 1: Stripe Checkout (Recommandé - Plus simple)

**Avantages:**
- Interface de paiement hébergée par Stripe
- Gestion automatique de la sécurité PCI-DSS
- Support multi-devises et méthodes de paiement
- Moins de code à maintenir

**Flux:**
1. Client clique sur "Payer"
2. Une Edge Function crée une session Stripe Checkout
3. Client est redirigé vers la page de paiement Stripe
4. Après paiement, client est redirigé vers la page de succès
5. Webhook Stripe notifie le serveur du paiement

### Option 2: Stripe Elements (Plus personnalisable)

**Avantages:**
- Interface de paiement intégrée dans votre site
- Contrôle total du design et de l'UX
- Expérience utilisateur fluide sans redirection

**Inconvénients:**
- Plus de code à écrire et maintenir
- Nécessite plus de configuration

## Étapes d'intégration (Stripe Checkout - Recommandé)

### 1. Créer une Edge Function pour les sessions de paiement

Créez `supabase/functions/create-payment-session/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { quoteId, clientEmail } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les détails du devis
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, quote_requests(*)')
      .eq('id', quoteId)
      .single();

    if (error || !quote) {
      throw new Error("Quote not found");
    }

    // Calculer les montants
    const totalAmount = quote.client_display_price;
    const depositAmount = Math.round(totalAmount * 0.4);

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte déménagement - ${quote.quote_requests.from_city} → ${quote.quote_requests.to_city}`,
              description: `Date: ${new Date(quote.quote_requests.moving_date).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: depositAmount * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment-cancelled`,
      customer_email: clientEmail,
      metadata: {
        quote_id: quoteId,
        quote_request_id: quote.quote_request_id,
        mover_id: quote.mover_id,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating payment session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

### 2. Créer une Edge Function pour les webhooks Stripe

Créez `supabase/functions/stripe-webhook/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { calculatePriceBreakdown } from "./priceCalculation.ts"; // À créer

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata || !metadata.quote_id) {
        throw new Error("Missing metadata");
      }

      // Récupérer le devis
      const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', metadata.quote_id)
        .single();

      if (!quote) {
        throw new Error("Quote not found");
      }

      const breakdown = calculatePriceBreakdown(quote.client_display_price);

      // Enregistrer le paiement
      await supabase.from('payments').insert({
        quote_request_id: metadata.quote_request_id,
        quote_id: metadata.quote_id,
        client_id: session.client_reference_id,
        mover_id: metadata.mover_id,
        total_amount: breakdown.totalAmount,
        amount_paid: breakdown.depositAmount,
        platform_fee: breakdown.platformFee,
        mover_deposit: breakdown.moverDeposit,
        escrow_amount: breakdown.escrowAmount,
        direct_payment_amount: breakdown.remainingAmount,
        remaining_amount: breakdown.remainingAmount,
        payment_status: 'completed',
        stripe_payment_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      });

      // Mettre à jour le statut de la demande
      await supabase
        .from('quote_requests')
        .update({ payment_status: 'deposit_paid' })
        .eq('id', metadata.quote_request_id);

      // Envoyer notification
      // ... (appeler send-notification edge function)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
```

### 3. Modifier ClientPaymentPage.tsx

Remplacer la fonction `handlePayment` pour utiliser Stripe:

```typescript
const handlePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setProcessing(true);

  try {
    if (!quote || !user) {
      throw new Error('Données manquantes');
    }

    // Appeler la edge function pour créer la session Stripe
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          quoteId: quote.id,
          clientEmail: user.email,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la session de paiement');
    }

    const { url } = await response.json();

    // Rediriger vers Stripe Checkout
    window.location.href = url;
  } catch (err: any) {
    console.error('Payment error:', err);
    setError(err.message || 'Erreur lors du paiement');
    setProcessing(false);
  }
};
```

### 4. Configurer les webhooks dans Stripe

1. Allez dans **Développeurs > Webhooks**: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur **Ajouter un point de terminaison**
3. URL: `https://votre-projet.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements: `checkout.session.completed`
5. Copiez la **clé de signature du webhook**
6. Ajoutez-la dans `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Gestion de l'escrow avec Stripe Connect

Pour implémenter le système d'escrow (retenue de 20% jusqu'à la fin du déménagement), vous devrez utiliser **Stripe Connect**:

1. Configurez Stripe Connect pour votre plateforme
2. Les déménageurs créent un compte Stripe Connect
3. Utilisez les **transferts avec retenue** pour gérer l'escrow
4. Libérez les fonds quand le déménagement est terminé

Documentation: [https://stripe.com/docs/connect](https://stripe.com/docs/connect)

## Tests

### Cartes de test Stripe

Utilisez ces numéros de carte en mode test:

- **Succès**: `4242 4242 4242 4242`
- **Échec**: `4000 0000 0000 0002`
- **Authentification 3D Secure**: `4000 0027 6000 3184`
- Date d'expiration: n'importe quelle date future
- CVV: n'importe quel code à 3 chiffres

### Tester les webhooks localement

Utilisez Stripe CLI pour tester les webhooks:

```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

## Checklist avant production

- [ ] Remplacer les clés de test par les clés de production
- [ ] Vérifier que les webhooks sont configurés en production
- [ ] Tester tous les flux de paiement
- [ ] Configurer Stripe Connect pour les déménageurs
- [ ] Mettre en place la surveillance des paiements
- [ ] Configurer les emails de confirmation de paiement
- [ ] Vérifier la conformité PCI-DSS
- [ ] Tester les remboursements et litiges

## Support

- Documentation Stripe: [https://stripe.com/docs](https://stripe.com/docs)
- Support Stripe: [https://support.stripe.com](https://support.stripe.com)
- API Reference: [https://stripe.com/docs/api](https://stripe.com/docs/api)

---

**Note**: L'intégration Stripe est optionnelle pour les tests. Le mode test actuel permet de valider toutes les fonctionnalités de la plateforme sans paiement réel.
