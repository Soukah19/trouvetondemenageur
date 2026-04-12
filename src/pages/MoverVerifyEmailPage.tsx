import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';

export default function MoverVerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(90);
  
  const email = location.state?.email || '';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        setIsVerified(true);
        showToast('✅ Email vérifié avec succès !', 'success');
        
        // Wait 2 seconds then redirect to profile completion
        setTimeout(() => {
          navigate('/mover/profile-completion');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Veuillez entrer le code à 6 chiffres', 'error');
      return;
    }

    const passwordFromState = (location.state as any)?.password;
    if (!passwordFromState) {
      showToast('Session expirée. Veuillez vous réinscrire.', 'error');
      navigate('/mover/signup');
      return;
    }

    setVerifying(true);

    try {
      // Call verify-signup-otp — creates real auth user + mover welcome email
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
            code: verificationCode.trim(),
            password: passwordFromState,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur lors de la vérification');
      }

      // Sign in the user
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: passwordFromState,
      });

      setIsVerified(true);
      showToast('✅ Email vérifié avec succès ! Compte créé.', 'success');
      
      setTimeout(() => {
        navigate('/mover/profile-completion');
      }, 1500);
    } catch (error: any) {
      console.error('Verification error:', error);
      showToast(error.message || 'Code invalide ou expiré', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email || countdown > 0) {
      if (!email) showToast('Email non trouvé', 'error');
      return;
    }

    const passwordFromState = (location.state as any)?.password;

    setResending(true);
    
    try {
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
            userType: 'mover',
            profileData: {},
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur');
      }

      showToast('✉️ Code de vérification renvoyé !', 'success');
      setVerificationCode('');
      setCountdown(90);
    } catch (error: any) {
      console.error('Error resending email:', error);
      showToast('Erreur lors de l\'envoi du code', 'error');
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email Vérifié ! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Redirection vers la complétion de votre profil...
          </p>
          <div className="animate-pulse">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <Mail className="w-20 h-20 text-orange-600 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vérifiez votre email
          </h1>
          
          <p className="text-gray-600 mb-6">
            Nous avons envoyé un code de vérification à :
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-orange-900 font-semibold">
              {email || 'Votre adresse email'}
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              📋 Instructions :
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Ouvrez votre boîte de réception</li>
              <li>Cherchez l'email de TrouveTonDemenageur</li>
              <li>Copiez le code à 6 chiffres</li>
              <li>Entrez-le ci-dessous</li>
            </ol>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Code de vérification
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-wider focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                Entrez le code à 6 chiffres reçu par email
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying || verificationCode.length !== 6}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Vérification...
                </span>
              ) : (
                '✓ Vérifier le code'
              )}
            </button>
          </form>

          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={resending || countdown > 0}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {countdown > 0
                ? `Renvoyer le code dans ${countdown}s`
                : resending
                ? 'Envoi en cours...'
                : '📧 Renvoyer le code'}
            </button>

            <button
              onClick={() => navigate('/mover/login')}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors"
            >
              Retour à la connexion
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Vous ne recevez pas l'email ?</strong>
              <br />
              Vérifiez vos spams ou cliquez sur "Renvoyer le code"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}