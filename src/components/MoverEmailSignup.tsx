import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { isEmailVerificationEnabled } from '../utils/emailVerification';

interface MoverEmailSignupProps {
  onSuccess?: () => void;
}

export default function MoverEmailSignup({ onSuccess }: MoverEmailSignupProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Read email verification setting from utility
  const emailVerificationEnabled = isEmailVerificationEnabled();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      showToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create auth user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/mover/profile-completion`,
          data: {
            user_type: 'mover'
          }
        }
      });

      if (signupError) {
        if (signupError.message.includes('already registered')) {
          setError('Ce compte existe déjà. Veuillez vous connecter.');
          showToast('Ce compte existe déjà. Veuillez vous connecter.', 'error');
        } else {
          throw signupError;
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      showToast('Compte créé avec succès !', 'success');

      // Step 2: Wait for session to be established
      let sessionEstablished = false;
      let retries = 0;
      
      while (!sessionEstablished && retries < 5) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          sessionEstablished = true;
        } else {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Step 3: Create signup progress record directly (without RPC)
      try {
        const { error: progressError } = await supabase
          .from('mover_signup_progress')
          .upsert({
            user_id: authData.user.id,
            email: formData.email,
            step: 'email_verified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (progressError) {
          console.log('Signup progress note:', progressError.message);
          // Non-blocking, continue anyway
        }
      } catch (progressErr) {
        console.log('Signup progress creation skipped');
      }

      // Check if email verification is enabled
      if (emailVerificationEnabled) {
        showToast(
          '✉️ Email de vérification envoyé ! Veuillez vérifier votre boîte de réception.',
          'success'
        );

        // Redirect to email verification page
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/mover/verify-email', { 
            state: { 
              email: formData.email,
              userId: authData.user.id 
            } 
          });
        }
      } else {
        // Email verification disabled - go directly to profile completion
        showToast(
          '✅ Compte créé ! Vous pouvez maintenant compléter votre profil.',
          'success'
        );

        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/mover/profile-completion', { 
            state: { 
              email: formData.email,
              userId: authData.user.id 
            } 
          });
        }
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
                Email professionnel
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
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

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
            <p className="text-xs text-gray-500 text-center">
              Après avoir créé votre compte, vous recevrez un email de vérification.
              Une fois votre email vérifié, vous pourrez compléter votre profil et uploader vos documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
