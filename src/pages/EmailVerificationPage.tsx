import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Vérification de votre email en cours...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Votre email a été vérifié avec succès !');
          showToast('Email vérifié avec succès !', 'success');

          setTimeout(() => {
            onVerified();
          }, 2000);
        } else {
          throw new Error('Lien de vérification invalide');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Une erreur est survenue lors de la vérification');
        showToast('Erreur lors de la vérification', 'error');
      }
    };

    verifyEmail();
  }, [onVerified]);

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
      
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>
<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vérification en cours
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email vérifié !
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Redirection vers votre espace client...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Erreur de vérification
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={onError}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
