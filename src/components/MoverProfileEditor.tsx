import { useState, useEffect } from 'react';
import { Save, Plus, X, Star, Award, MapPin, Users, Calendar, Bell, TruckIcon, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

interface MoverProfile {
  id: string;
  company_name: string;
  description: string | null;
  years_experience: number;
  team_size: number;
  insurance_number: string | null;
  certifications: string[];
  service_areas: string[];
  specialties: string[];
  average_rating: number;
  total_reviews: number;
  completed_moves: number;
  activity_departments: string[];
  coverage_type: 'departments' | 'all_france' | 'custom';
  preferred_zones: string[];
  max_distance_km: number | null;
  email_notifications_enabled: boolean;
  return_trip_alerts_enabled: boolean;
  has_furniture_lift: boolean;
}

interface MoverProfileEditorProps {
  moverId: string;
}

export function MoverProfileEditor({ moverId }: MoverProfileEditorProps) {
  const [profile, setProfile] = useState<MoverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [newServiceArea, setNewServiceArea] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPreferredZone, setNewPreferredZone] = useState('');

  useEffect(() => {
    loadProfile();
  }, [moverId]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .eq('id', moverId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // Map signup fields to profile fields:
        // - Signup saves 'coverage_area' (array) and 'services' (array)
        // - Profile uses 'service_areas' and 'specialties'
        // If service_areas/specialties are empty but coverage_area/services have data, use those
        const serviceAreas = (data.service_areas && data.service_areas.length > 0)
          ? data.service_areas
          : (data.coverage_area && Array.isArray(data.coverage_area) && data.coverage_area.length > 0)
            ? data.coverage_area
            : [];
        
        const specialties = (data.specialties && data.specialties.length > 0)
          ? data.specialties
          : (data.services && Array.isArray(data.services) && data.services.length > 0)
            ? data.services
            : [];

        setProfile({
          ...data,
          certifications: data.certifications || [],
          service_areas: serviceAreas,
          specialties: specialties,
          activity_departments: data.activity_departments || [],
          coverage_type: data.coverage_type || 'departments',
          preferred_zones: data.preferred_zones || [],
          max_distance_km: data.max_distance_km,
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          return_trip_alerts_enabled: data.return_trip_alerts_enabled ?? true,
          has_furniture_lift: data.has_furniture_lift ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Erreur lors du chargement du profil', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({
          description: profile.description,
          years_experience: profile.years_experience,
          team_size: profile.team_size,
          insurance_number: profile.insurance_number,
          certifications: profile.certifications,
          service_areas: profile.service_areas,
          specialties: profile.specialties,
          // Also sync back to the fields used during signup
          coverage_area: profile.service_areas,
          services: profile.specialties,
          activity_departments: profile.activity_departments,
          coverage_type: profile.coverage_type,
          preferred_zones: profile.preferred_zones,
          max_distance_km: profile.max_distance_km,
          email_notifications_enabled: profile.email_notifications_enabled,
          return_trip_alerts_enabled: profile.return_trip_alerts_enabled,
          has_furniture_lift: profile.has_furniture_lift,
        })
        .eq('id', moverId);

      if (error) throw error;

      showToast('Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  }

  function addCertification() {
    if (!profile || !newCertification.trim()) return;
    setProfile({
      ...profile,
      certifications: [...profile.certifications, newCertification.trim()],
    });
    setNewCertification('');
  }

  function removeCertification(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      certifications: profile.certifications.filter((_, i) => i !== index),
    });
  }

  function addServiceArea() {
    if (!profile || !newServiceArea.trim()) return;
    setProfile({
      ...profile,
      service_areas: [...profile.service_areas, newServiceArea.trim()],
    });
    setNewServiceArea('');
  }

  function removeServiceArea(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      service_areas: profile.service_areas.filter((_, i) => i !== index),
    });
  }

  function addSpecialty() {
    if (!profile || !newSpecialty.trim()) return;
    setProfile({
      ...profile,
      specialties: [...profile.specialties, newSpecialty.trim()],
    });
    setNewSpecialty('');
  }

  function removeSpecialty(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      specialties: profile.specialties.filter((_, i) => i !== index),
    });
  }

  function addDepartment() {
    if (!profile || !newDepartment.trim()) return;
    const deptNum = newDepartment.trim();
    if (!profile.activity_departments.includes(deptNum)) {
      setProfile({
        ...profile,
        activity_departments: [...profile.activity_departments, deptNum],
      });
    }
    setNewDepartment('');
  }

  function removeDepartment(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      activity_departments: profile.activity_departments.filter((_, i) => i !== index),
    });
  }

  function addPreferredZone() {
    if (!profile || !newPreferredZone.trim()) return;
    setProfile({
      ...profile,
      preferred_zones: [...profile.preferred_zones, newPreferredZone.trim()],
    });
    setNewPreferredZone('');
  }

  function removePreferredZone(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      preferred_zones: profile.preferred_zones.filter((_, i) => i !== index),
    });
  }

  if (loading || !profile) {
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Informations de l'entreprise</h3>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description de l'entreprise
          </label>
          <textarea
            value={profile.description || ''}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Décrivez votre entreprise, vos services et ce qui vous distingue..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Années d'expérience
          </label>
          <input
            type="number"
            min="0"
            value={profile.years_experience}
            onChange={(e) =>
              setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taille de l'équipe
          </label>
          <input
            type="number"
            min="1"
            value={profile.team_size}
            onChange={(e) =>
              setProfile({ ...profile, team_size: parseInt(e.target.value) || 1 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro d'assurance
          </label>
          <input
            type="text"
            value={profile.insurance_number || ''}
            onChange={(e) => setProfile({ ...profile, insurance_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: ASS-123456"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certifications et qualifications
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCertification()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Certification ISO 9001"
            />
            <button
              onClick={addCertification}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {cert}
                <button
                  onClick={() => removeCertification(index)}
                  className="hover:text-blue-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zones de service
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newServiceArea}
              onChange={(e) => setNewServiceArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Paris, Lyon..."
            />
            <button
              onClick={addServiceArea}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.service_areas.map((area, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
              >
                <MapPin className="h-3 w-3" />
                {area}
                <button
                  onClick={() => removeServiceArea(index)}
                  className="hover:text-green-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spécialités
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Déménagement de piano, Œuvres d'art..."
            />
            <button
              onClick={addSpecialty}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.specialties.map((specialty, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
              >
                {specialty}
                <button
                  onClick={() => removeSpecialty(index)}
                  className="hover:text-purple-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.has_furniture_lift}
              onChange={(e) => setProfile({ ...profile, has_furniture_lift: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Monte-meuble disponible</span>
              <p className="text-xs text-gray-600 mt-1">
                Cochez cette case si vous disposez d'un monte-meuble pour faciliter les déménagements
              </p>
            </div>
          </label>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TruckIcon className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Zone d'activité</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de couverture
              </label>
              <select
                value={profile.coverage_type}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    coverage_type: e.target.value as 'departments' | 'all_france' | 'custom',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="departments">Départements spécifiques</option>
                <option value="all_france">Toute la France</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {profile.coverage_type === 'departments' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Départements d'activité
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 75, 92, 93..."
                  />
                  <button
                    onClick={addDepartment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.activity_departments.map((dept, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {dept}
                      <button
                        onClick={() => removeDepartment(index)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Ajoutez les numéros des départements où vous opérez (ex: 75 pour Paris, 13 pour Marseille)
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zones préférées (optionnel)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPreferredZone}
                  onChange={(e) => setNewPreferredZone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPreferredZone()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Paris, Lyon, Marseille..."
                />
                <button
                  onClick={addPreferredZone}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.preferred_zones.map((zone, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {zone}
                    <button
                      onClick={() => removePreferredZone(index)}
                      className="hover:text-green-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Les demandes de ces zones seront mises en avant dans vos notifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance maximale (optionnel)
              </label>
              <input
                type="number"
                min="0"
                value={profile.max_distance_km || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    max_distance_km: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Distance maximale en km"
              />
              <p className="mt-2 text-xs text-gray-500">
                Laissez vide pour accepter toutes les distances
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Préférences de notifications</h4>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.email_notifications_enabled}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    email_notifications_enabled: e.target.checked,
                  })
                }
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Notifications email pour nouvelles demandes
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Recevez un email pour chaque nouvelle demande correspondant à votre zone d'activité
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.return_trip_alerts_enabled}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    return_trip_alerts_enabled: e.target.checked,
                  })
                }
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">
                    Alertes opportunités de retour
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Recevez une alerte quand un nouveau déménagement part de votre destination d'arrivée (évitez les retours à vide!)
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}