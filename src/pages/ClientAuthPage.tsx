import { useState } from 'react';
import { ArrowLeft, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, getEmailValidationMessage } from '../utils/validation';
import { showToast } from '../utils/toast';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type ClientAuthPageProps = {
  initialMode?: 'login' | 'signup';
};

export function ClientAuthPage({ initialMode = 'login' }: ClientAuthPageProps) {
  const navigate = useNavigate();
  const { handleClientLogin, handleClientSignup, handleGoogleClientLogin } = useNavigationHelpers();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateEmail(email)) {
      setFieldErrors({ email: getEmailValidationMessage() });
      setError(getEmailValidationMessage());
      showToast(getEmailValidationMessage(), 'error');
      return;
    }

    if (!password || password.length < 6) {
      setFieldErrors({ password: 'Le mot de passe doit contenir au moins 6 caractères' });
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Les mots de passe ne correspondent pas' });
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await handleClientSignup(email, password);
      } else if (mode === 'login') {
        await handleClientLogin(email, password);
      }
    } catch (err: any) {
      let errorMessage = 'Erreur de connexion';

      if (err.message) {
        const msg = err.message.toLowerCase();

        if (msg.includes('user already registered') || msg.includes('already registered')) {
          errorMessage = 'Ce compte existe déjà. Veuillez vous connecter ou utiliser un autre email.';
          setFieldErrors({ email: errorMessage });
        } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          errorMessage = mode === 'login'
            ? 'Email ou mot de passe incorrect'
            : 'Erreur lors de la création du compte';
          setFieldErrors({ password: errorMessage });
        } else if (msg.includes('email') && msg.includes('invalid')) {
          errorMessage = 'Format d\'email invalide';
          setFieldErrors({ email: errorMessage });
        } else if (msg.includes('password')) {
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          setFieldErrors({ password: errorMessage });
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-900/55 to-cyan-900/60 pointer-events-none"></div>
      <div className="relative max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/client/auth-choice')}
          className="flex items-center space-x-2 text-white hover:text-cyan-300 transition mb-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {mode === 'login' ? (
                <LogIn className="w-6 h-6 text-blue-600" />
              ) : (
                <UserPlus className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Connexion Client' : 'Créer un compte'}
            </h2>
          </div>

          <p className="text-gray-600 mb-8">
            {mode === 'login'
              ? 'Connectez-vous pour suivre vos demandes de devis'
              : 'Créez un compte pour suivre vos demandes et recevoir des propositions'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                  fieldErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="votre@email.com"
                required
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors({ ...fieldErrors, password: '' });
                    }
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent ${
                    fieldErrors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                      }
                    }}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <a
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {/* <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                setLoading(true);
                await handleGoogleClientLogin();
              } catch (err: any) {
                setError(err.message || 'Erreur lors de la connexion avec Google');
                showToast(err.message || 'Erreur lors de la connexion avec Google', 'error');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Continuer avec Google</span>
          </button> */}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setFieldErrors({});
              }}
              className="text-blue-600 hover:underline text-sm"
            >
              {mode === 'login'
                ? 'Pas encore de compte ? Créer un compte'
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
