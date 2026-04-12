import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export function CheckEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!email || countdown > 0) {
      if (!email) showToast('Email introuvable', 'error');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      showToast('Code de vérification renvoyé avec succès', 'success');
      setCountdown(60);
    } catch (error: any) {
      console.error('Error resending verification:', error);
      showToast('Erreur lors de l\'envoi du code', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464207/pexels-photo-7464207.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
      <div className="relative">
      <div className="max-w-md mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/client/login')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vérifiez votre email
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Nous avons envoyé un code de vérification à 8 chiffres à :
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-blue-900">{email}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">
                Code à 8 chiffres
              </p>
            </div>
            <p className="text-sm text-green-700">
              Entrez le code reçu par email pour activer votre compte.
              Vérifiez également votre dossier spam.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/verify-email-code', { state: { email } })}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Entrer le code de vérification
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resending || countdown > 0}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending 
                ? 'Envoi en cours...' 
                : countdown > 0 
                ? `Renvoyer le code (${countdown}s)` 
                : 'Renvoyer le code'}
            </button>

            <button
              onClick={() => navigate('/client/login')}
              className="w-full bg-transparent text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            >
              Retour à la connexion
            </button>
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
            <p className="text-sm text-amber-800">
              <strong>Note :</strong> Le code de vérification expire après 1 heure.
              Si le code a expiré, vous pouvez demander un nouveau code.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}