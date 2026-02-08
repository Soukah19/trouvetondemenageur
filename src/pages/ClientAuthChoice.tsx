import { ArrowLeft, UserCheck, UserPlus, Shield, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ClientAuthChoice() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/demenagement-maison-111616.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/85 via-white/80 to-cyan-50/85"></div>
      <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-6 shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Bienvenue sur TrouveTonDemenageur
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pour obtenir votre devis gratuit et sécurisé, veuillez vous connecter ou créer un compte
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div
              className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-100 hover:border-blue-500 cursor-pointer transform hover:scale-105"
              onClick={() => navigate('/client/login')}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Déjà client</h2>
              <p className="text-gray-600 mb-6">
                Connectez-vous pour accéder à votre espace personnel et gérer vos demandes de devis
              </p>
              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                Se connecter
              </button>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Accès instantané à vos devis</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Historique complet</span>
                </div>
              </div>
            </div>

            <div
              className="group bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 cursor-pointer transform hover:scale-105"
              onClick={() => navigate('/client/signup')}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white">Nouveau client</h2>
              <p className="text-blue-50 mb-6">
                Créez votre compte en 30 secondes et obtenez votre premier devis gratuit protégé par IA
              </p>
              <button className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                Créer mon compte
              </button>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-blue-50">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Inscription gratuite en 30s</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-50">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Devis instantané</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-50">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Protection IA incluse</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Pourquoi créer un compte ?
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span><strong>Sécurité maximale</strong> : Vos données protégées et chiffrées</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span><strong>Protection IA</strong> : Analyse automatique de chaque devis pour détecter les fraudes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span><strong>Suivi en temps réel</strong> : Notifications instantanées de nouvelles propositions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span><strong>Historique complet</strong> : Accès à tous vos devis et conversations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span><strong>Paiement sécurisé</strong> : Validation IA de votre carte bancaire lors du paiement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              En créant un compte, vous acceptez nos{' '}
              <a href="#" className="text-blue-600 hover:underline">Conditions d'utilisation</a>
              {' '}et notre{' '}
              <a href="#" className="text-blue-600 hover:underline">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
