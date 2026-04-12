import { useState, useEffect } from 'react';
import { X, Euro, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase, QuoteRequest } from '../lib/supabase';
import { validatePrice } from '../utils/priceValidation';

type QuoteSubmissionModalProps = {
  request: QuoteRequest;
  moverId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function QuoteSubmissionModal({
  request,
  moverId,
  onClose,
  onSubmitted
}: QuoteSubmissionModalProps) {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceValidation, setPriceValidation] = useState<{
    isValid: boolean;
    message: string;
    range: { min: number; max: number; recommended: number };
  } | null>(null);

  useEffect(() => {
    if (price && parseFloat(price) > 0) {
      const validation = validatePrice(parseFloat(price), request);
      setPriceValidation(validation);
    } else {
      setPriceValidation(null);
    }
  }, [price, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const priceValue = parseFloat(price);

    if (!priceValue || priceValue <= 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    const validation = validatePrice(priceValue, request);

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);

    try {
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + validityDays);

      const { error: quoteError } = await supabase.from('quotes').insert({
        quote_request_id: request.id,
        mover_id: moverId,
        price: priceValue,
        message: message || null,
        validity_date: validityDate.toISOString().split('T')[0],
        status: 'pending'
      });

      if (quoteError) throw quoteError;

      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({ status: 'quoted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Send notification to the client
      try {
        const { data: moverData } = await supabase
          .from('movers')
          .select('company_name')
          .eq('id', moverId)
          .maybeSingle();

        const companyName = moverData?.company_name || 'Un déménageur';
        const clientPrice = Math.round(priceValue * 1.3);

        const { data: qr } = await supabase
          .from('quote_requests')
          .select('client_user_id')
          .eq('id', request.id)
          .maybeSingle();

        if (qr?.client_user_id) {
          await supabase.from('notifications').insert({
            user_id: qr.client_user_id,
            type: 'new_quote',
            title: 'Nouveau devis reçu !',
            message: `${companyName} vous a envoyé un devis de ${clientPrice.toLocaleString('fr-FR')} € pour votre déménagement ${request.from_city} → ${request.to_city}.`,
            related_id: request.id,
            read: false,
          });
        }

        // Send email notification to client
        const clientEmail = request.client_email;
        if (clientEmail) {
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                type: 'quote_received',
                recipientEmail: clientEmail,
                data: {
                  moverName: companyName,
                  price: clientPrice.toLocaleString('fr-FR'),
                  message: message || null,
                  fromCity: request.from_city,
                  toCity: request.to_city,
                  movingDate: new Date(request.moving_date).toLocaleDateString('fr-FR'),
                }
              })
            });
          } catch (emailErr) {
            console.error('Error sending email to client:', emailErr);
          }
        }
      } catch (notifErr) {
        console.error('Error sending notification to client:', notifErr);
      }

      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Soumettre un devis
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Détails de la demande</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(request.moving_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{request.home_size} - {request.home_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trajet:</span>
              <span className="font-medium">{request.from_city} → {request.to_city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Étages:</span>
              <span className="font-medium">
                Départ: {request.floor_from} {request.elevator_from ? '(Asc.)' : '(Sans asc.)'} |
                Arrivée: {request.floor_to} {request.elevator_to ? '(Asc.)' : '(Sans asc.)'}
              </span>
            </div>
            {request.services_needed.length > 0 && (
              <div>
                <span className="text-gray-600">Services:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.services_needed.map((service, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant du devis HT (€) *
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: 850"
                required
                min="0"
                step="10"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Montant hors taxes — le client verra le prix TTC (avec commission plateforme)</p>
            {priceValidation && (
              <div className={`mt-2 flex items-start space-x-2 text-sm ${
                priceValidation.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {priceValidation.isValid ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{priceValidation.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message pour le client
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Présentez votre offre et vos avantages..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validité du devis (jours)
            </label>
            <select
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={7}>7 jours</option>
              <option value={15}>15 jours</option>
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !priceValidation?.isValid}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi...' : 'Envoyer le devis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
