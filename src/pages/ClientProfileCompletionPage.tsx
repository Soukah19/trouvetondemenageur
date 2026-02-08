import { useState, useEffect } from 'react';
import { User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { validatePhone, getPhoneValidationMessage } from '../utils/validation';

export function ClientProfileCompletionPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    checkExistingProfile();
  }, [user]);

  const handleBack = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/');
    }
  };

  const checkExistingProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name, last_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.first_name && data.last_name && data.phone) {
        navigate('/client/dashboard');
      } else if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!firstName.trim()) {
      setFieldErrors({ firstName: 'Le prénom est requis' });
      setError('Le prénom est requis');
      return;
    }

    if (!lastName.trim()) {
      setFieldErrors({ lastName: 'Le nom est requis' });
      setError('Le nom est requis');
      return;
    }

    if (!phone.trim()) {
      setFieldErrors({ phone: 'Le numéro de téléphone est requis' });
      setError('Le numéro de téléphone est requis');
      return;
    }

    if (!validatePhone(phone)) {
      setFieldErrors({ phone: getPhoneValidationMessage() });
      setError(getPhoneValidationMessage());
      return;
    }

    setLoading(true);

    try {
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingClient) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clients')
          .insert({
            user_id: user?.id,
            email: user?.email || '',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      showToast('Profil complété avec succès', 'success');
      navigate('/client/dashboard');
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setError(err.message || 'Erreur lors de la sauvegarde du profil');
      showToast('Erreur lors de la sauvegarde du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464060/pexels-photo-7464060.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88 pointer-events-none"></div>
      <div className="relative w-full">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour</span>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completez votre profil
            </h2>
            <p className="text-gray-600">
              Ces informations nous permettront de vous contacter et de personnaliser votre experience
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prenom *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) {
                    setFieldErrors({ ...fieldErrors, firstName: '' });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                  fieldErrors.firstName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Jean"
                required
              />
              {fieldErrors.firstName && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (fieldErrors.lastName) {
                    setFieldErrors({ ...fieldErrors, lastName: '' });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                  fieldErrors.lastName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Dupont"
                required
              />
              {fieldErrors.lastName && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero de telephone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: '' });
                    }
                  }}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    fieldErrors.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <span>Continuer</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Ces informations sont confidentielles et ne seront utilisees que pour faciliter vos demenagements
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
