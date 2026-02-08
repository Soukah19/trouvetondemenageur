import { useEffect } from 'react';
import { Truck, ArrowLeft, Shield, Users, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AboutUsPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/demenagement-famille_0.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
      <div className="relative">
      
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>
<header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                TrouveTonDemenageur
              </h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Retour</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Qui sommes-nous ?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nous révolutionnons l'industrie du déménagement avec l'intelligence artificielle
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Histoire</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Fondée en 2024, TrouveTonDemenageur est une plateforme numérique de mise en relation entre particuliers
              et professionnels du déménagement. Notre solution technologique permet de faciliter les échanges
              et la mise en contact entre clients et déménageurs professionnels.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Notre équipe, composée d'experts en technologie et en développement web, a développé une infrastructure
              technique permettant la gestion de demandes de devis, le traitement sécurisé des paiements via des
              prestataires tiers, et la mise à disposition d'outils de communication.
            </p>
            <p className="text-gray-700 leading-relaxed">
              En tant qu'intermédiaire technique, nous mettons à disposition une plateforme permettant aux utilisateurs
              de se connecter. Les contrats de déménagement sont conclus directement entre clients et déménageurs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Infrastructure</h3>
              <p className="text-gray-600">
                Nous fournissons une infrastructure technique pour faciliter les échanges
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Technologie</h3>
              <p className="text-gray-600">
                Des outils numériques modernes pour faciliter les mises en relation
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">
                Technologie de pointe pour révolutionner le secteur
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white">
            <div className="flex items-center gap-4 mb-8">
              <Heart className="w-12 h-12 text-red-400" />
              <h2 className="text-3xl font-bold">Nos Valeurs</h2>
            </div>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Neutralité :</strong> Une plateforme technique au service de tous les utilisateurs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Conformité :</strong> Respect strict des réglementations en vigueur</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Innovation technique :</strong> Amélioration continue de nos outils numériques</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Clarté :</strong> Information transparente sur notre rôle d'intermédiaire</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
