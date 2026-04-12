import { useState, useEffect } from 'react';
import { Check, AlertCircle, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import BadgeDisplay from './BadgeDisplay';

interface Quote {
  id: string;
  mover_id: string;
  price: number;
  client_display_price: number;
  message: string;
  validity_date: string;
  created_at: string;
  status: string;
  mover: {
    id: string;
    company_name: string;
    description: string;
    city: string;
  };
  mover_badges?: any[];
  avg_rating?: number;
  total_reviews?: number;
  response_time_hours?: number;
}

interface QuoteComparisonProps {
  quoteRequestId: string;
  onAcceptQuote: (quoteId: string) => void;
}

export default function QuoteComparison({ quoteRequestId, onAcceptQuote }: QuoteComparisonProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestValue, setBestValue] = useState<string | null>(null);

  useEffect(() => {
    loadQuotes();
  }, [quoteRequestId]);

  async function loadQuotes() {
    try {
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          mover:movers!quotes_mover_id_fkey (
            id,
            company_name,
            description,
            city
          )
        `)
        .eq('quote_request_id', quoteRequestId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      const enrichedQuotes = await Promise.all(
        (quotesData || []).map(async (quote) => {
          const { data: badges } = await supabase
            .from('mover_badges')
            .select('*')
            .eq('mover_id', quote.mover.id)
            .or('expires_at.is.null,expires_at.gt.now()');

          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('mover_id', quote.mover.id);

          const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0;

          return {
            ...quote,
            mover_badges: badges || [],
            avg_rating: avgRating,
            total_reviews: reviews?.length || 0
          };
        })
      );

      setQuotes(enrichedQuotes);

      if (enrichedQuotes.length > 0) {
        const sortedByValue = [...enrichedQuotes].sort((a, b) => {
          const scoreA = calculateValueScore(a);
          const scoreB = calculateValueScore(b);
          return scoreB - scoreA;
        });
        setBestValue(sortedByValue[0].id);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateValueScore(quote: Quote): number {
    const priceScore = quotes.length > 0
      ? (Math.max(...quotes.map(q => q.client_display_price)) - quote.client_display_price) / Math.max(...quotes.map(q => q.client_display_price)) * 40
      : 0;
    const ratingScore = (quote.avg_rating || 0) * 8;
    const badgeScore = (quote.mover_badges?.length || 0) * 10;
    const reviewScore = Math.min((quote.total_reviews || 0) / 10, 2) * 10;

    return priceScore + ratingScore + badgeScore + reviewScore;
  }

  if (loading) return <LoadingSpinner />;

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Aucun devis à comparer pour le moment</p>
      </div>
    );
  }

  if (quotes.length === 1) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{quotes[0].mover.company_name}</h3>
            <p className="text-sm text-gray-600">{quotes[0].mover.city}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{quotes[0].client_display_price.toLocaleString('fr-FR')} €</p>
          </div>
        </div>
        <BadgeDisplay badges={quotes[0].mover_badges || []} />
        {quotes[0].message && (
          <p className="mt-4 text-gray-700">{quotes[0].message}</p>
        )}
        <button
          onClick={() => onAcceptQuote(quotes[0].id)}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Accepter ce devis
        </button>
      </div>
    );
  }

  const lowestPrice = Math.min(...quotes.map(q => q.client_display_price));
  const highestRating = Math.max(...quotes.map(q => q.avg_rating || 0));

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={20} />
          Comparaison des devis
        </h3>
        <p className="text-sm text-gray-600">
          {quotes.length} devis reçus • Meilleur prix: {lowestPrice.toLocaleString('fr-FR')} €
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Déménageur</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Prix</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Note</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Badges</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                className={`hover:bg-gray-50 transition ${
                  bestValue === quote.id ? 'bg-green-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {quote.mover.company_name}
                      {bestValue === quote.id && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          Meilleur rapport qualité/prix
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{quote.mover.city}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-gray-900 text-lg">
                    {quote.client_display_price.toLocaleString('fr-FR')} €
                  </div>
                  {quote.client_display_price === lowestPrice && (
                    <span className="text-xs text-green-600 font-medium">Prix le plus bas</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {(quote.total_reviews || 0) > 0 ? (
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <span className="font-medium text-gray-900">
                          {quote.avg_rating?.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{quote.total_reviews} avis</div>
                      {quote.avg_rating === highestRating && quote.avg_rating > 0 && (
                        <span className="text-xs text-yellow-600 font-medium">Meilleure note</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Aucun avis</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <BadgeDisplay badges={quote.mover_badges || []} size="sm" />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onAcceptQuote(quote.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Accepter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Conseils pour choisir</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
            <span>Le prix le plus bas n'est pas toujours le meilleur choix</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
            <span>Privilégiez les déménageurs avec badges "Vérifié" et bonnes notes</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
            <span>Lisez attentivement les messages et conditions de chaque devis</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
