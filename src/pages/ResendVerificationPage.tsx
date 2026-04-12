import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail } from '../utils/validation';
import { showToast } from '../utils/toast';

export function ResendVerificationPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (countdown > 0) return;

    if (!validateEmail(email)) {
      showToast('Veuillez entrer un email valide', 'error');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setSent(true);
      setCountdown(90);
      showToast('Email de vérification envoyé !', 'success');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      showToast(error.message || 'Erreur lors de l\'envoi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center p-4"
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
        <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
        <div className="relative w-full flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Email envoyé !
          </h2>
          <p className="text-gray-600 mb-8">
            Un nouvel email de vérification a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte de réception et cliquez sur le lien pour activer votre compte.
          </p>
          {countdown > 0 ? (
            <p className="text-sm text-gray-500 mb-4">
              Vous pourrez renvoyer l'email dans <strong>{countdown}s</strong>
            </p>
          ) : (
            <button
              onClick={() => setSent(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg transition font-semibold mb-4 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Renvoyer l'email
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Retour
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464060/pexels-photo-7464060.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
      <div className="relative">
      <div className="max-w-md mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Renvoyer l'email de vérification
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Entrez votre adresse email pour recevoir un nouveau lien de vérification
          </p>

          <form onSubmit={handleResend} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || countdown > 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0
                ? `Renvoyer dans ${countdown}s`
                : loading
                ? 'Envoi en cours...'
                : 'Renvoyer l\'email'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
