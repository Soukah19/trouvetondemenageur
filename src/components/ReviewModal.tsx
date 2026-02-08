import { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ReviewModalProps = {
  quoteId: string;
  quoteRequestId: string;
  moverId: string;
  moverName: string;
  onClose: () => void;
  onSubmitted: () => void;
};

type RatingCategory = {
  label: string;
  key: 'punctuality_rating' | 'professionalism_rating' | 'care_rating' | 'value_rating';
  description: string;
};

const categories: RatingCategory[] = [
  { label: 'Ponctualité', key: 'punctuality_rating', description: 'Arrivé à l\'heure, respecté les délais' },
  { label: 'Professionnalisme', key: 'professionalism_rating', description: 'Attitude, communication, respect' },
  { label: 'Soin des biens', key: 'care_rating', description: 'Protection et manipulation des objets' },
  { label: 'Rapport qualité/prix', key: 'value_rating', description: 'Prestation correspondant au prix payé' }
];

export function ReviewModal({
  quoteId,
  quoteRequestId,
  moverId,
  moverName,
  onClose,
  onSubmitted
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [ratings, setRatings] = useState({
    punctuality_rating: 0,
    professionalism_rating: 0,
    care_rating: 0,
    value_rating: 0
  });
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Veuillez donner une note globale');
      return;
    }

    if (Object.values(ratings).some(r => r === 0)) {
      setError('Veuillez noter tous les critères');
      return;
    }

    if (wouldRecommend === null) {
      setError('Veuillez indiquer si vous recommanderiez ce déménageur');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error: reviewError } = await supabase.from('reviews').insert({
        quote_id: quoteId,
        quote_request_id: quoteRequestId,
        client_id: userData.user.id,
        mover_id: moverId,
        rating,
        punctuality_rating: ratings.punctuality_rating,
        professionalism_rating: ratings.professionalism_rating,
        care_rating: ratings.care_rating,
        value_rating: ratings.value_rating,
        comment: comment.trim() || null,
        would_recommend: wouldRecommend,
        is_public: true
      });

      if (reviewError) throw reviewError;

      onSubmitted();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value: number, onChange: (value: number) => void, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 my-4 relative" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Noter votre déménagement
            </h2>
            <p className="text-sm text-gray-500">Déménageur: {moverName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          <p className="text-gray-600 text-sm mt-4 mb-4">
            Votre avis aide les autres utilisateurs à choisir le bon déménageur
          </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Note globale
            </label>
            {renderStars(rating, setRating, 'lg')}
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 5 && '⭐ Excellent!'}
                {rating === 4 && '👍 Très bien'}
                {rating === 3 && '👌 Bien'}
                {rating === 2 && '😐 Moyen'}
                {rating === 1 && '👎 Décevant'}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Évaluations détaillées</h3>
            {categories.map((category) => (
              <div key={category.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </div>
                  {renderStars(
                    ratings[category.key],
                    (value) => setRatings({ ...ratings, [category.key]: value })
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommanderiez-vous ce déménageur?
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg border-2 transition ${
                  wouldRecommend === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-green-300'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-medium">Oui</span>
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg border-2 transition ${
                  wouldRecommend === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600 hover:border-red-300'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="font-medium">Non</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Partagez votre expérience en détail..."
            />
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
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Publier l'avis</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
