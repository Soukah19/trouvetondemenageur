import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export function EmailVerificationCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const profileDataFromState = location.state?.profileData as { firstName: string; lastName: string; phone: string } | undefined;
  
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(90);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Fonction pour créer le client après vérification
  const createClientRecord = async (userId: string, userEmail: string) => {
    try {
      // Vérifier si le client existe déjà
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingClient) {
        console.log('Client already exists');
        return true;
      }

      // Vérifier si c'est un déménageur
      const { data: existingMover } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingMover) {
        console.log('User is a mover, not creating client record');
        return true;
      }

      // Créer le client
      const { error: insertError } = await supabase
        .from('clients')
        .insert([{
          user_id: userId,
          email: userEmail
        }]);

      if (insertError) {
        console.error('Error creating client:', insertError);
        return false;
      }

      console.log('Client created successfully');
      return true;
    } catch (err) {
      console.error('Error in createClientRecord:', err);
      return false;
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Le code de vérification doit contenir 6 chiffres');
      return;
    }

    const passwordFromState = (location.state as any)?.password;
    if (!passwordFromState) {
      setError('Session expirée. Veuillez vous réinscrire.');
      return;
    }

    setLoading(true);

    try {
      // Call verify-signup-otp Edge Function — this creates the real auth user
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-signup-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            code: code.trim(),
            password: passwordFromState,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur lors de la vérification');
      }

      // Account created! Now sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: passwordFromState,
      });

      if (signInError) {
        throw signInError;
      }

      setSuccess(true);
      showToast('Email vérifié avec succès ! Compte créé.', 'success');

      const profileInfo = profileDataFromState;

      setTimeout(() => {
        navigate(profileInfo ? '/client/quote' : '/client/profile-completion');
      }, 2000);
    } catch (err: any) {
      console.error('Code verification error:', err);
      if (err.message?.includes('expiré') || err.message?.includes('expired')) {
        setError('Le code a expiré. Veuillez demander un nouveau code.');
      } else if (err.message?.includes('invalide') || err.message?.includes('Invalid') || err.message?.includes('invalid')) {
        setError('Code invalide. Veuillez vérifier et réessayer.');
      } else {
        setError(err.message || 'Erreur lors de la vérification du code');
      }
      showToast('Erreur lors de la vérification du code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || !email) return;

    setResending(true);
    setError('');

    try {
      const passwordFromState = (location.state as any)?.password;
      const userTypeFromState = (location.state as any)?.userType || 'client';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-signup-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password: passwordFromState || '',
            userType: userTypeFromState,
            profileData: profileDataFromState || {},
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur');
      }

      showToast('Nouveau code envoyé !', 'success');
      setCountdown(90);
    } catch (err: any) {
      console.error('Resend code error:', err);
      setError('Erreur lors de l\'envoi du nouveau code');
      showToast('Erreur lors de l\'envoi du nouveau code', 'error');
    } finally {
      setResending(false);
    }
  };

  if (success) {
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-900/55 to-cyan-900/60"></div>
        <div className="relative w-full flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Email vérifié !
              </h2>

              <p className="text-gray-600 mb-6">
                Votre adresse email a été vérifiée avec succès.
                Vous allez être redirigé pour compléter votre profil.
              </p>

              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-900/55 to-cyan-900/60"></div>
      <div className="relative w-full flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Vérifiez votre email
              </h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Code envoyé !
                </p>
              </div>
              <p className="text-sm text-blue-700">
                Un code à 8 chiffres a été envoyé à{' '}
                <strong>{email || 'votre adresse email'}</strong>.
                Vérifiez votre boîte de réception.
              </p>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <p className="text-xs text-amber-800 font-medium">
                  ⚠️ Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>. L'email provient de noreply@trouvetondemenageur.fr.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              {!emailFromState && (
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
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de vérification
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCode(value);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                  placeholder="00000000"
                  maxLength={8}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le code est valable pendant 1 heure
                </p>
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
                {loading ? 'Vérification...' : 'Vérifier mon email'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || countdown > 0}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                  {countdown > 0
                    ? `Renvoyer le code dans ${countdown}s`
                    : resending
                    ? 'Envoi en cours...'
                    : 'Renvoyer le code'}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Vous n'avez pas reçu le code ?{' '}
                <button
                  onClick={() => navigate('/resend-verification')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Demander un nouvel envoi
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}