import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail, getEmailValidationMessage } from '../utils/validation';
import { showToast } from '../utils/toast';

interface ForgotPasswordPageProps {
  onBack?: () => void;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError(getEmailValidationMessage());
      showToast(getEmailValidationMessage(), 'error');
      return;
    }

    setLoading(true);

    try {
      // Envoyer un code OTP par email au lieu d'un lien de réinitialisation
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        // Pas de redirectTo - Supabase enverra un code à 6 chiffres
      });

      if (resetError) throw resetError;

      setSent(true);
      showToast('Code de réinitialisation envoyé avec succès', 'success');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('Erreur lors de l\'envoi du code. Veuillez réessayer.');
      showToast('Erreur lors de l\'envoi du code', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/7464119/pexels-photo-7464119.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>
        <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
        <div className="relative w-full flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Code envoyé !
            </h2>

            <p className="text-gray-600 mb-4">
              Un code de réinitialisation à 6 chiffres a été envoyé à <strong>{email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Instructions
                </p>
              </div>
              <p className="text-sm text-blue-700">
                Vérifiez votre boîte de réception (et les spams) pour trouver le code à 6 chiffres.
                Ce code est valable pendant 1 heure.
              </p>
            </div>

            <button
              onClick={() => navigate('/reset-password-code', { state: { email } })}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold mb-4"
            >
              Entrer le code de réinitialisation
            </button>

            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              Utiliser une autre adresse email
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464119/pexels-photo-7464119.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
      <div className="relative">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Mot de passe oublié
            </h2>
          </div>

          <p className="text-gray-600 mb-8">
            Entrez votre adresse email et nous vous enverrons un code à 6 chiffres pour réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le code de réinitialisation'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Vous avez déjà reçu un code ?{' '}
              <button
                onClick={() => navigate('/reset-password-code')}
                className="text-blue-600 hover:underline font-medium"
              >
                Entrer le code
              </button>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
