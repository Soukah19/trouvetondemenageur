import { useState, useEffect } from 'react';
import { Heart, Star, MapPin, Award, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

interface Mover {
  id: string;
  company_name: string;
  description: string | null;
  average_rating: number;
  total_reviews: number;
  completed_moves: number;
  service_areas: string[];
  specialties: string[];
}

interface Favorite {
  id: string;
  mover_id: string;
  created_at: string;
  mover: Mover;
}

export function FavoritesList() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  async function loadFavorites() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          mover_id,
          created_at,
          movers:mover_id (
            id,
            company_name,
            description,
            average_rating,
            total_reviews,
            completed_moves,
            service_areas,
            specialties
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(fav => ({
        ...fav,
        mover: Array.isArray(fav.movers) ? fav.movers[0] : fav.movers,
      }));

      setFavorites(formattedData);
    } catch (error) {
      console.error('Error loading favorites:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(favoriteId: string, moverName: string) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      showToast(`${moverName} retiré des favoris`, 'success');
    } catch (error) {
      console.error('Error removing favorite:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
        <h3 className="text-xl font-bold text-gray-900">Mes déménageurs favoris</h3>
        <span className="text-sm text-gray-500">({favorites.length})</span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucun favori pour le moment</p>
          <p className="text-sm text-gray-500">
            Ajoutez des déménageurs à vos favoris pour les retrouver facilement
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map(favorite => (
            <div
              key={favorite.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {favorite.mover.company_name}
                    </h4>
                    {favorite.mover.average_rating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                        <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                        <span className="text-sm font-medium text-gray-900">
                          {favorite.mover.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({favorite.mover.total_reviews})
                        </span>
                      </div>
                    )}
                  </div>

                  {favorite.mover.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {favorite.mover.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{favorite.mover.completed_moves} déménagements</span>
                    </div>
                    {favorite.mover.service_areas && favorite.mover.service_areas.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{favorite.mover.service_areas.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {favorite.mover.specialties && favorite.mover.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {favorite.mover.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFavorite(favorite.id, favorite.mover.company_name)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Retirer des favoris"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}