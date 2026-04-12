import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Target, Shield, Zap, Heart } from 'lucide-react';

export function MissionPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
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
              onClick={() => navigate(-1)}
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Notre Mission
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transformer le déménagement en une expérience sereine et sécurisée pour tous
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white mb-12">
            <h2 className="text-4xl font-bold mb-6">Notre Engagement</h2>
            <p className="text-xl leading-relaxed mb-6">
              Notre mission est simple mais ambitieuse : révolutionner l'industrie du déménagement en créant un écosystème où la confiance, la transparence et l'équité sont garanties par la technologie.
            </p>
            <p className="text-lg leading-relaxed text-blue-100">
              Nous croyons fermement que clients et déménageurs méritent une protection égale. C'est pourquoi nous avons développé une plateforme unique qui utilise l'intelligence artificielle pour documenter, analyser et protéger chaque étape du déménagement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pour les Clients</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Protection complète de vos biens grâce à l'IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Transparence totale sur les prix et services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Accès aux meilleurs professionnels certifiés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Résolution équitable des litiges</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pour les Déménageurs</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Protection contre les fausses réclamations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Accès à des clients qualifiés et sérieux</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Rapports automatiques pour les assurances</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Mise en valeur de votre professionnalisme</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="flex items-center gap-4 mb-8">
              <Zap className="w-12 h-12 text-yellow-500" />
              <h2 className="text-3xl font-bold text-gray-900">Nos Objectifs</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Court terme (2026)</h3>
                <p className="text-gray-700">
                  Devenir la plateforme de référence en France avec 10 000 déménagements protégés par IA et 500 professionnels certifiés.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Moyen terme (2027-2028)</h3>
                <p className="text-gray-700">
                  Expansion internationale dans les pays européens et intégration de nouvelles fonctionnalités d'IA pour prédire les risques de dommages.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Long terme (2029+)</h3>
                <p className="text-gray-700">
                  Établir le standard mondial de protection pour l'industrie du déménagement et étendre notre technologie à d'autres secteurs du transport.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
