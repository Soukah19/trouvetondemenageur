import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Shield, AlertCircle, ArrowLeft, Building2, Banknote, Info, CheckCircle } from 'lucide-react';
import { calculatePriceBreakdown } from '../utils/marketPriceCalculation';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { ClientLayout } from '../components/ClientLayout';

// Initialize Stripe - use your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Quote {
  id: string;
  quote_request_id: string;
  mover_id: string;
  client_display_price: number;
  quote_requests: {
    id: string;
    from_city: string;
    to_city: string;
    moving_date: string;
    from_address: string;
    to_address: string;
  };
}

export default function ClientPaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Initialize Stripe
  useEffect(() => {
    stripePromise.then(stripeInstance => {
      if (stripeInstance) {
        setStripe(stripeInstance);
        const elementsInstance = stripeInstance.elements();
        setElements(elementsInstance);
      }
    });
  }, []);

  // Create card element when elements is ready
  useEffect(() => {
    if (elements && !cardElement) {
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1e293b',
            fontFamily: '"Inter", system-ui, sans-serif',
            '::placeholder': {
              color: '#94a3b8',
            },
          },
          invalid: {
            color: '#ef4444',
          },
        },
        hidePostalCode: true,
      });
      setCardElement(card);
    }
  }, [elements, cardElement]);

  // Mount card element
  useEffect(() => {
    if (cardElement && paymentMethod === 'card') {
      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        cardElement.mount('#card-element');
        cardElement.on('ready', () => setCardReady(true));
        cardElement.on('change', (event) => {
          if (event.error) {
            setError(event.error.message || 'Erreur de carte');
          } else {
            setError('');
          }
        });
      }
    }
    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, [cardElement, paymentMethod]);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteDetails();
    }
  }, [quoteId]);

  // Create Payment Intent when quote is loaded
  useEffect(() => {
    if (quote && !clientSecret) {
      createPaymentIntent();
    }
  }, [quote]);

  const fetchQuoteDetails = async () => {
    if (!quoteId) {
      setError('ID de devis manquant');
      setLoading(false);
      return;
    }
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_request_id,
          mover_id,
          client_display_price,
          status
        `)
        .eq('id', quoteId)
        .maybeSingle();

      if (quoteError) throw quoteError;

      if (!quoteData) {
        setError('Devis introuvable');
        setLoading(false);
        return;
      }

      const { data: requestData, error: requestError } = await supabase
        .from('quote_requests')
        .select(`
          id,
          from_city,
          to_city,
          moving_date,
          from_address,
          to_address,
          status
        `)
        .eq('id', quoteData.quote_request_id)
        .maybeSingle();

      if (requestError) throw requestError;

      if (quoteData.status === 'expired') {
        setError('Ce devis a expiré car la demande a été modifiée.');
        setLoading(false);
        return;
      }

      if (quoteData.status === 'rejected') {
        setError('Ce devis a été rejeté.');
        setLoading(false);
        return;
      }

      if (quoteData.status === 'accepted') {
        navigate(`/client/payment-success?quoteId=${quoteId}`, { replace: true });
        return;
      }

      if (quoteData.status !== 'pending') {
        setError('Ce devis ne peut pas être accepté.');
        setLoading(false);
        return;
      }

      setQuote({
        id: quoteData.id,
        quote_request_id: quoteData.quote_request_id,
        mover_id: quoteData.mover_id,
        client_display_price: quoteData.client_display_price,
        quote_requests: requestData
      });
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    if (!quote) return;

    try {
      const breakdown = calculatePriceBreakdown(quote.client_display_price);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: breakdown.depositAmount,
            quoteId: quote.id,
            description: `Acompte déménagement ${quote.quote_requests.from_city} → ${quote.quote_requests.to_city}`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      console.log('✅ PaymentIntent créé:', data.paymentIntentId);
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Erreur lors de la préparation du paiement');
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (!stripe || !cardElement || !clientSecret || !quote || !user) {
        throw new Error('Le paiement n\'est pas prêt. Veuillez patienter.');
      }

      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user.email,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Erreur lors du paiement');
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error(`Le paiement n'a pas abouti. Statut: ${paymentIntent?.status}`);
      }

      console.log('✅ Paiement Stripe confirmé:', paymentIntent.id);

      // Payment succeeded - now record it in the database
      const breakdown = calculatePriceBreakdown(quote.client_display_price);
      const moverPrice = Math.round(quote.client_display_price / 1.3);

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          quote_request_id: quote.quote_request_id,
          quote_id: quote.id,
          client_id: user.id,
          mover_id: quote.mover_id,
          mover_price: moverPrice,
          total_amount: breakdown.totalAmount,
          amount_paid: breakdown.depositAmount,
          platform_fee: breakdown.platformFee,
          mover_deposit: breakdown.moverDeposit,
          escrow_amount: breakdown.escrowAmount,
          remaining_amount: breakdown.remainingAmount,
          payment_status: 'completed',
          stripe_payment_id: paymentIntent.id,
          stripe_verified: true,
          stripe_verified_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      // The trigger will update quote and quote_request status automatically
      // But let's also update them explicitly to be safe
      await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quote.id);

      await supabase
        .from('quote_requests')
        .update({
          status: 'accepted',
          accepted_quote_id: quote.id,
          payment_status: 'deposit_paid'
        })
        .eq('id', quote.quote_request_id);

      // Reject other quotes
      await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('quote_request_id', quote.quote_request_id)
        .neq('id', quote.id);

      // Navigate to success page
      setTimeout(() => {
        navigate('/client/payment-success');
      }, 1000);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Erreur lors du paiement');
      setProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    setError('');
    setProcessing(true);

    try {
      if (!quote || !user) {
        throw new Error('Données manquantes');
      }

      const breakdown = calculatePriceBreakdown(quote.client_display_price);
      const moverPrice = Math.round(quote.client_display_price / 1.3);

      // For bank transfer, create a pending payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          quote_request_id: quote.quote_request_id,
          quote_id: quote.id,
          client_id: user.id,
          mover_id: quote.mover_id,
          mover_price: moverPrice,
          total_amount: breakdown.totalAmount,
          amount_paid: breakdown.depositAmount,
          platform_fee: breakdown.platformFee,
          mover_deposit: breakdown.moverDeposit,
          escrow_amount: breakdown.escrowAmount,
          remaining_amount: breakdown.remainingAmount,
          payment_status: 'pending', // Pending until transfer is verified
          stripe_payment_id: `transfer_${quote.id}`,
          paid_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      // Update quote status to show transfer pending
      await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quote.id);

      await supabase
        .from('quote_requests')
        .update({
          status: 'accepted',
          accepted_quote_id: quote.id,
          // Don't update payment_status yet - wait for admin verification
        })
        .eq('id', quote.quote_request_id);

      navigate('/client/payment-success?method=transfer');
    } catch (err: any) {
      console.error('Bank transfer error:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erreur</h2>
          <p className="text-slate-600 mb-6">{error || 'Devis introuvable'}</p>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const breakdown = calculatePriceBreakdown(quote.client_display_price);

  return (
    <ClientLayout title="Paiement de l'acompte">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Paiement de l'acompte</h1>
            <p className="text-slate-600 mt-2">
              {quote.quote_requests.from_city} → {quote.quote_requests.to_city}
            </p>
          </div>

          {/* Price breakdown */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Récapitulatif</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Prix total TTC</span>
                <span className="font-semibold">{breakdown.totalAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Acompte à payer maintenant (30%)</span>
                <span className="font-bold text-lg">{breakdown.depositAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span className="flex items-center gap-1">
                  <Banknote className="w-3 h-3" />
                  Solde à régler au déménageur
                </span>
                <span>{breakdown.remainingAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Payment method selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Mode de paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`font-medium ${paymentMethod === 'card' ? 'text-blue-900' : 'text-slate-700'}`}>
                  Carte bancaire
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <Building2 className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'transfer' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`font-medium ${paymentMethod === 'transfer' ? 'text-blue-900' : 'text-slate-700'}`}>
                  Virement bancaire
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {paymentMethod === 'card' ? (
            <form onSubmit={handleCardPayment} className="space-y-6">
              {/* Stripe Card Element */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Informations de carte
                </label>
                <div 
                  id="card-element" 
                  className="w-full px-4 py-4 border border-slate-300 rounded-lg bg-white"
                />
                {!cardReady && (
                  <p className="text-sm text-slate-500 mt-2">Chargement du formulaire de paiement...</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Paiement sécurisé par Stripe</span>
              </div>

              <button
                type="submit"
                disabled={processing || !cardReady || !clientSecret}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Payer {breakdown.depositAmount.toFixed(2)} €
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Informations bancaires
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-600 text-xs mb-1">Bénéficiaire</p>
                    <p className="font-mono font-semibold">TrouveTonDemenageur SAS</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-600 text-xs mb-1">IBAN</p>
                    <p className="font-mono font-semibold">FR76 1234 5678 9012 3456 7890 123</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-600 text-xs mb-1">BIC</p>
                    <p className="font-mono font-semibold">BNPAFRPPXXX</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-600 text-xs mb-1">Montant</p>
                    <p className="font-bold text-2xl text-blue-600">{breakdown.depositAmount.toFixed(2)} €</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-600 text-xs mb-1">Référence (obligatoire)</p>
                    <p className="font-mono font-semibold">DEVIS-{quoteId?.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Important :</strong> Votre réservation sera confirmée sous 24-48h après réception du virement.
                  </p>
                </div>
              </div>

              <button
                onClick={handleBankTransfer}
                disabled={processing}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                {processing ? 'Traitement...' : 'J\'ai effectué le virement'}
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-slate-500 mt-6">
          <p>Paiement sécurisé • Vos données sont protégées</p>
        </div>
      </div>
    </ClientLayout>
  );
}
