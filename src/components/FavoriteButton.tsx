import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

interface FavoriteButtonProps {
  moverId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ moverId, size = 'md' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, moverId]);

  async function checkFavoriteStatus() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('client_id', user.id)
        .eq('mover_id', moverId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }

  async function toggleFavorite() {
    if (!user) {
      showToast('Vous devez être connecté', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('client_id', user.id)
          .eq('mover_id', moverId);

        if (error) throw error;
        setIsFavorite(false);
        showToast('Retiré des favoris', 'success');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            client_id: user.id,
            mover_id: moverId,
          });

        if (error) throw error;
        setIsFavorite(true);
        showToast('Ajouté aux favoris', 'success');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  if (!user) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={loading}
      className={`${buttonSizeClasses[size]} rounded-full hover:bg-gray-100 transition-all disabled:opacity-50 ${
        isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      }`}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-transform hover:scale-110`}
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  );
}