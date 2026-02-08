import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Sparkles, Brain, Camera, Shield, Zap, CheckCircle } from 'lucide-react';

export function TechnologyPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464022/pexels-photo-7464022.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl animate-float">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Technologie IA
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              L'intelligence artificielle au service de votre sérénité
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Brain className="w-12 h-12 text-cyan-400" />
              <h2 className="text-4xl font-bold">Notre IA de Protection</h2>
            </div>
            <p className="text-xl leading-relaxed text-blue-100">
              Notre système d'intelligence artificielle propriétaire analyse en temps réel les photos de vos biens pour garantir une protection totale. Développée en partenariat avec des experts en computer vision et des professionnels du déménagement, notre technologie offre une précision de 94% dans la détection des dommages.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Capture</h3>
              <p className="text-gray-700 leading-relaxed">
                Photos haute résolution prises à trois moments clés : demande de devis, chargement et déchargement
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Analyse</h3>
              <p className="text-gray-700 leading-relaxed">
                Reconnaissance d'objets, détection d'anomalies et comparaison intelligente entre les images
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Protection</h3>
              <p className="text-gray-700 leading-relaxed">
                Rapports détaillés et horodatés acceptés par les assurances pour résolution équitable
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              Comment ça fonctionne ?
            </h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Photos avant départ</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Lors de votre demande de devis, vous photographiez vos biens. L'IA crée une empreinte numérique de chaque objet et documente son état initial : rayures existantes, bosses, usure normale, etc.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Photos au chargement</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Le déménageur photographie systématiquement chaque bien avant de le charger. L'IA compare avec les photos initiales pour confirmer que l'état est identique. Toute différence est immédiatement signalée.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Photos au déchargement</h3>
                  <p className="text-gray-700 leading-relaxed">
                    À l'arrivée, vous inspectez et photographiez vos biens. L'IA compare avec les photos du chargement. Si un dommage est détecté, elle détermine s'il s'est produit pendant le transport ou s'il existait déjà.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Rapport automatique</h3>
                  <p className="text-gray-700 leading-relaxed">
                    En cas de dommage, l'IA génère instantanément un rapport détaillé avec photos comparatives, analyse technique et recommandations. Ce document est accepté par toutes les assurances.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                Avantages Techniques
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Précision 94%</strong> - Taux de détection leader du marché</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Temps réel</strong> - Analyse instantanée des photos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Sécurisé</strong> - Chiffrement bout en bout RGPD</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Évolutif</strong> - Amélioration continue par machine learning</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Sécurité et Conformité
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>RGPD</strong> - 100% conforme réglementation européenne</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Hébergement EU</strong> - Serveurs en France</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Chiffrement</strong> - AES-256 pour toutes les données</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span className="text-gray-700"><strong>Audit</strong> - Certifications ISO 27001</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
