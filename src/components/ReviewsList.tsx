import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Review = {
  id: string;
  rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  care_rating: number;
  value_rating: number;
  comment: string | null;
  would_recommend: boolean;
  mover_response: string | null;
  mover_response_date: string | null;
  created_at: string;
  client_id: string;
};

type ReviewsListProps = {
  moverId: string;
  showAll?: boolean;
};

export function ReviewsList({ moverId, showAll = false }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    punctuality: 0,
    professionalism: 0,
    care: 0,
    value: 0,
    recommendationRate: 0
  });

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [moverId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('mover_id', moverId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(showAll ? 100 : 5);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('average_rating, total_reviews, punctuality_avg, professionalism_avg, care_avg, value_avg, recommendation_rate')
        .eq('id', moverId)
        .single();

      if (error) throw error;
      if (data) {
        setStats({
          average: data.average_rating || 0,
          total: data.total_reviews || 0,
          punctuality: data.punctuality_avg || 0,
          professionalism: data.professionalism_avg || 0,
          care: data.care_avg || 0,
          value: data.value_avg || 0,
          recommendationRate: data.recommendation_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.average.toFixed(1)} / 5.0
            </h3>
            {renderStars(Math.round(stats.average), 'md')}
            <p className="text-sm text-gray-600 mt-2">
              Basé sur {stats.total} avis vérifiés
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <p className="text-2xl font-bold text-green-600">
                {stats.recommendationRate.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Recommandent</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Ponctualité</p>
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.punctuality), 'sm')}
              <span className="text-sm font-semibold">{stats.punctuality.toFixed(1)}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Professionnalisme</p>
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.professionalism), 'sm')}
              <span className="text-sm font-semibold">{stats.professionalism.toFixed(1)}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Soin des biens</p>
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.care), 'sm')}
              <span className="text-sm font-semibold">{stats.care.toFixed(1)}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Rapport qualité/prix</p>
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.value), 'sm')}
              <span className="text-sm font-semibold">{stats.value.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Avis des clients</h3>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun avis pour le moment</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {renderStars(review.rating, 'md')}
                  <span className="text-sm text-gray-600">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                {review.would_recommend ? (
                  <div className="flex items-center space-x-1 text-green-600 text-sm">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-medium">Recommande ce déménageur</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="font-medium">Ne recommande pas</span>
                  </div>
                )}
              </div>

              {review.comment && (
                <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
              )}

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 mb-1">Ponctualité</p>
                  <p className="font-semibold text-sm">{review.punctuality_rating}/5</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 mb-1">Pro.</p>
                  <p className="font-semibold text-sm">{review.professionalism_rating}/5</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 mb-1">Soin</p>
                  <p className="font-semibold text-sm">{review.care_rating}/5</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 mb-1">Valeur</p>
                  <p className="font-semibold text-sm">{review.value_rating}/5</p>
                </div>
              </div>

              {review.mover_response && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-xs font-semibold text-blue-900 mb-2">
                    Réponse du déménageur
                    {review.mover_response_date && (
                      <span className="font-normal text-blue-600 ml-2">
                        • {new Date(review.mover_response_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-blue-900">{review.mover_response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
