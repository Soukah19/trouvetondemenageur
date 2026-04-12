import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Lock, Save, ArrowLeft, CheckCircle, AlertCircle, Settings, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { ClientLayout } from '../components/ClientLayout';

export default function ClientSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [originalData, setOriginalData] = useState({ firstName: '', lastName: '', phone: '' });
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name, last_name, phone')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
        setOriginalData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      showToast('Erreur lors du chargement du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    firstName !== originalData.firstName ||
    lastName !== originalData.lastName ||
    phone !== originalData.phone;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (phone && !/^(\+33|0)[1-9](\d{2}){4}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide (ex: 06 12 34 56 78)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !hasChanges) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setOriginalData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });

      showToast('Profil mis à jour avec succès !', 'success');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };

  if (loading) {
    return (
      <ClientLayout title="Paramètres">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Paramètres du compte">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Informations personnelles</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: undefined })); }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                      errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Votre prénom"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: undefined })); }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                      errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Votre nom"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value));
                    setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="06 12 34 56 78"
                  maxLength={14}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sécurité</h2>
                <p className="text-sm text-gray-500">Gérez votre mot de passe</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <button
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Modifier le mot de passe</p>
                  <p className="text-sm text-gray-500">Changez votre mot de passe de connexion</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
