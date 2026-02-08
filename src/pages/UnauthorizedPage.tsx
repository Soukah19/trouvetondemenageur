import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

interface UnauthorizedPageProps {
  userType?: 'client' | 'mover' | 'admin' | 'unknown';
  attemptedRoute?: string;
}

export function UnauthorizedPage({ userType = 'unknown', attemptedRoute }: UnauthorizedPageProps) {
  const navigate = useNavigate();

  const getDashboardRoute = () => {
    switch (userType) {
      case 'client':
        return '/client/dashboard';
      case 'mover':
        return '/mover/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'client':
        return 'client';
      case 'mover':
        return 'déménageur';
      case 'admin':
        return 'administrateur';
      default:
        return 'utilisateur';
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464119/pexels-photo-7464119.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-slate-900/50 to-red-900/40"></div>
      
      <div className="relative w-full max-w-lg">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h1>

          <p className="text-gray-600 mb-6">
            Vous êtes connecté(e) en tant que <span className="font-semibold text-gray-900">{getUserTypeLabel()}</span> et n'avez pas accès à cette page.
          </p>

          {attemptedRoute && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                <span className="font-medium">Page demandée :</span> {attemptedRoute}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la page précédente
            </button>

            <button
              onClick={() => navigate(getDashboardRoute())}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Home className="w-5 h-5" />
              Retourner à mon tableau de bord
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
          </p>
        </div>
      </div>
    </div>
  );
}
