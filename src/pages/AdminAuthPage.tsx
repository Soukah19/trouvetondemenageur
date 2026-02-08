import { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';

export function AdminAuthPage() {
  const navigate = useNavigate();
  const { handleAdminLogin } = useNavigationHelpers();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authentification avec Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (authError) throw new Error('Nom d\'utilisateur ou mot de passe incorrect');

      if (!authData.user) {
        throw new Error('Connexion échouée');
      }

      // Vérifier que l'utilisateur est bien un admin
      const { data: verifyAdmin, error: verifyError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (verifyError || !verifyAdmin) {
        await supabase.auth.signOut();
        throw new Error('Accès admin non autorisé');
      }

      await handleAdminLogin(username, password);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Erreur de connexion');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/4246266/pexels-photo-4246266.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-slate-900/85 pointer-events-none"></div>
      <div className="relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIuNSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-red-500/20 rounded-full">
                <Shield className="w-12 h-12 text-red-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Administration
            </h1>
            <p className="text-slate-300 text-center mb-8">
              Accès réservé aux administrateurs
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
                    placeholder="admin@trouveton.fr"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a
                  href="/forgot-password"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full py-2 text-slate-300 hover:text-white transition-colors text-sm"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
