import { useState } from 'react';
import { Star, Calendar, Users, Award, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { ReviewsList } from './ReviewsList';

interface MoverProfileStatsProps {
  moverId: string;
  averageRating: number;
  totalReviews: number;
  yearsExperience: number;
  teamSize: number;
  completedMoves: number;
  onProfileUpdate?: () => void;
}

export function MoverProfileStats({
  moverId,
  averageRating,
  totalReviews,
  yearsExperience,
  teamSize,
  completedMoves,
  onProfileUpdate,
}: MoverProfileStatsProps) {
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMovesModal, setShowMovesModal] = useState(false);

  const [newYearsExperience, setNewYearsExperience] = useState(yearsExperience);
  const [newTeamSize, setNewTeamSize] = useState(teamSize);
  const [saving, setSaving] = useState(false);

  const handleUpdateExperience = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({ years_experience: newYearsExperience })
        .eq('id', moverId);

      if (error) throw error;

      showToast('Expérience mise à jour', 'success');
      setShowExperienceModal(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error('Error updating experience:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTeamSize = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({ team_size: newTeamSize })
        .eq('id', moverId);

      if (error) throw error;

      showToast('Nombre d\'employés mis à jour', 'success');
      setShowTeamModal(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error('Error updating team size:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Profil détaillé</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowReviewsModal(true)}
            className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg hover:shadow-md transition-all border border-yellow-200 hover:border-yellow-300"
          >
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="text-xs text-gray-600 mt-1">{totalReviews} avis</div>
          </button>

          <button
            onClick={() => {
              setNewYearsExperience(yearsExperience);
              setShowExperienceModal(true);
            }}
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg hover:shadow-md transition-all border border-blue-200 hover:border-blue-300"
          >
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{yearsExperience}</div>
            <div className="text-xs text-gray-600 mt-1">ans d'expérience</div>
          </button>

          <button
            onClick={() => {
              setNewTeamSize(teamSize);
              setShowTeamModal(true);
            }}
            className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-all border border-green-200 hover:border-green-300"
          >
            <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{teamSize}</div>
            <div className="text-xs text-gray-600 mt-1">employés</div>
          </button>

          <button
            onClick={() => setShowMovesModal(true)}
            className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all border border-purple-200 hover:border-purple-300"
          >
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{completedMoves}</div>
            <div className="text-xs text-gray-600 mt-1">déménagements</div>
          </button>
        </div>
      </div>

      {showReviewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mes avis clients</h3>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <ReviewsList moverId={moverId} />
          </div>
        </div>
      )}

      {showExperienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'expérience</h3>
              <button
                onClick={() => setShowExperienceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Années d'expérience
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={newYearsExperience}
                  onChange={(e) => setNewYearsExperience(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExperienceModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateExperience}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'équipe</h3>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'employés
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={newTeamSize}
                  onChange={(e) => setNewTeamSize(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateTeamSize}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMovesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Déménagements réalisés</h3>
              <button
                onClick={() => setShowMovesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center py-12">
              <Award className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <p className="text-2xl font-bold text-gray-900 mb-2">{completedMoves} déménagements terminés</p>
              <p className="text-gray-600">Historique de vos missions complétées avec succès</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
