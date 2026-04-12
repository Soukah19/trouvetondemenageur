import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { isEmailVerificationEnabled } from '../utils/emailVerification';
import { validatePassword, buildPasswordErrorMessage } from '../utils/validation';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

interface MoverEmailSignupProps {
  onSuccess?: () => void;
}

export default function MoverEmailSignup({ onSuccess }: MoverEmailSignupProps) {
  const navigate = useNavigate();
  const { handleGoogleMoverLogin } = useNavigationHelpers();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Read email verification setting from utility
  const emailVerificationEnabled = isEmailVerificationEnabled();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate strong password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      const msg = passwordValidation.errors.join('. ');
      setFieldErrors({ password: msg });
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Les mots de passe ne correspondent pas' });
      setError('Les mots de passe ne correspondent pas');
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Call send-signup-otp — does NOT create auth user, just stores pending + sends OTP
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-signup-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password: formData.password,
            userType: 'mover',
            profileData: {},
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Erreur lors de l\'inscription');
        showToast(result.error || 'Erreur lors de l\'inscription', 'error');
        if (result.error?.includes('client')) {
          setFieldErrors({ email: 'Email déjà utilisé par un client' });
        } else if (result.error?.includes('déménageur') || result.error?.includes('existe déjà')) {
          setFieldErrors({ email: 'Un compte existe déjà avec cet email' });
        }
        setLoading(false);
        return;
      }

      showToast('✉️ Code de vérification envoyé ! Vérifiez votre boîte de réception.', 'success');

      // Redirect to verification page
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/mover/verify-email', {
          state: {
            email: normalizedEmail,
            password: formData.password,
            userType: 'mover',
          },
        });
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      showToast(err.message || 'Une erreur est survenue lors de l\'inscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="max-w-md w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition mb-6 bg-gray-100 hover:bg-orange-50 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Devenir Déménageur Partenaire
            </h1>
            <p className="text-gray-600">
              Étape 1 : Créez votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email professionnel <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    formData.password && buildPasswordErrorMessage(formData.password) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password
                ? buildPasswordErrorMessage(formData.password) && (
                    <p className="text-red-500 text-xs mt-1">{buildPasswordErrorMessage(formData.password)}</p>
                  )
                : (
                    <p className="text-xs text-gray-500 mt-1">
                      Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                    </p>
                  )
              }
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  onBlur={() => {
                    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
                      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas' }));
                    }
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Google Auth Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Ou continuer avec</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={async () => {
              try {
                setGoogleLoading(true);
                setError('');
                await handleGoogleMoverLogin();
              } catch (err: any) {
                setError(err.message || 'Erreur lors de la connexion avec Google');
                showToast(err.message || 'Erreur lors de la connexion avec Google', 'error');
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition font-semibold disabled:opacity-50 shadow-sm"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Redirection...' : 'Continuer avec Google'}</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <button
                onClick={() => navigate('/mover/login')}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Se connecter
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">🎬 Découvrez TrouveTonDéménageur en vidéo</h3>
              <p className="text-sm text-gray-600">Comprenez comment la plateforme peut booster votre activité</p>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                src="https://www.youtube.com/embed/Gtgm4INvUO4"
                title="Présentation TrouveTonDéménageur pour les déménageurs"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Après avoir créé votre compte, vous recevrez un email de vérification.
              ⚠️ Pensez à vérifier votre dossier <strong>spam / courrier indésirable</strong> si vous ne le recevez pas.
              Une fois votre email vérifié, vous pourrez compléter votre profil et uploader vos documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}