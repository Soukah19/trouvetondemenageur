import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export function ResetPasswordWithCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'code' | 'password'>(emailFromState ? 'code' : 'code');

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    if (!code || code.length !== 8) {
      setError('Le code de vérification doit contenir 8 chiffres');
      return;
    }

    setLoading(true);

    try {
      // Vérifier le code OTP avec Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      });

      if (verifyError) {
        throw verifyError;
      }

      if (data.session) {
        setStep('password');
        showToast('Code vérifié avec succès', 'success');
      }
    } catch (err: any) {
      console.error('Code verification error:', err);
      if (err.message?.includes('Token has expired') || err.message?.includes('expired')) {
        setError('Le code a expiré. Veuillez demander un nouveau code.');
      } else if (err.message?.includes('Invalid') || err.message?.includes('invalid')) {
        setError('Code invalide. Veuillez vérifier et réessayer.');
      } else {
        setError('Erreur lors de la vérification du code');
      }
      showToast('Erreur lors de la vérification du code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      showToast('Mot de passe modifié avec succès', 'success');

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError('Erreur lors de la modification du mot de passe');
      showToast('Erreur lors de la modification du mot de passe', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/7464230/pexels-photo-7464230.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
                Mot de passe modifié !
              </h2>

              <p className="text-gray-600 mb-6">
                Votre mot de passe a été modifié avec succès.
                Vous allez être redirigé vers la page de connexion.
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
        backgroundImage: 'url(https://images.pexels.com/photos/7464230/pexels-photo-7464230.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
      <div className="relative w-full flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {step === 'code' ? (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Vérification du code
                  </h2>
                </div>

                <p className="text-gray-600 mb-8">
                  Entrez le code à 8 chiffres reçu par email pour réinitialiser votre mot de passe.
                </p>

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
                    {loading ? 'Vérification...' : 'Vérifier le code'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Renvoyer un nouveau code
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Nouveau mot de passe
                  </h2>
                </div>

                <p className="text-gray-600 mb-8">
                  Choisissez un nouveau mot de passe sécurisé pour votre compte.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 6 caractères
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
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
                    {loading ? 'Modification en cours...' : 'Modifier le mot de passe'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}