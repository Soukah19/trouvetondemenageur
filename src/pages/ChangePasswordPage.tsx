import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
    notSameAsOld: newPassword.length > 0 && newPassword !== oldPassword,
  };

  const isFormValid =
    oldPassword.length > 0 &&
    passwordChecks.minLength &&
    passwordChecks.matches &&
    passwordChecks.notSameAsOld;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user?.email) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Verify old password by attempting a sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        setError('Le mot de passe actuel est incorrect.');
        setLoading(false);
        return;
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message?.includes('same_password')) {
          setError('Le nouveau mot de passe doit être différent de l\'ancien.');
        } else {
          setError(updateError.message || 'Erreur lors de la mise à jour du mot de passe.');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      showToast('Mot de passe mis à jour avec succès !', 'success');
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe modifié</h2>
          <p className="text-gray-600 mb-6">
            Votre mot de passe a été mis à jour avec succès. Vous pouvez continuer à utiliser votre compte normalement.
          </p>
          <button
            onClick={handleGoBack}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Modifier le mot de passe</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Security icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => { setOldPassword(e.target.value); setError(''); }}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Entrez votre mot de passe actuel"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password strength indicators */}
            {newPassword.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <PasswordCheck passed={passwordChecks.minLength} label="Au moins 8 caractères" />
                <PasswordCheck passed={passwordChecks.hasUpper} label="Une lettre majuscule" />
                <PasswordCheck passed={passwordChecks.hasLower} label="Une lettre minuscule" />
                <PasswordCheck passed={passwordChecks.hasNumber} label="Un chiffre" />
                <PasswordCheck passed={passwordChecks.notSameAsOld} label="Différent du mot de passe actuel" />
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Retapez le nouveau mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordChecks.matches && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Les mots de passe ne correspondent pas
              </p>
            )}
            {confirmPassword.length > 0 && passwordChecks.matches && (
              <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Les mots de passe correspondent
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              isFormValid && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Modifier le mot de passe
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600' : 'text-gray-400'}`}>
      {passed ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
      {label}
    </div>
  );
}
