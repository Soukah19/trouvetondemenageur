import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Check, Sparkles } from 'lucide-react';

export function PricingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/prix_demenagement_897x505.jpg)',
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
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-slate-50/85 to-blue-50/88"></div>
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
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Tarifs Transparents
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Pas de frais cachés, pas de mauvaises surprises
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white mb-12 text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full mb-6">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span className="font-bold">GRATUIT POUR LES CLIENTS</span>
            </div>
            <h2 className="text-4xl font-extrabold mb-4">
              L'utilisation de notre plateforme est 100% gratuite
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Vous ne payez que le prix du déménagement convenu avec le professionnel que vous choisissez
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Studio / F1</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">450€</span>
                <span className="text-gray-600 ml-2">- 900€</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Moins de 30m²</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">2 déménageurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Camion 12m³</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Protection IA incluse</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/client/auth-choice')}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Obtenir un devis
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 shadow-xl relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-full font-bold text-sm">
                PLUS POPULAIRE
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">F2 / F3</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-white">900€</span>
                <span className="text-blue-200 ml-2">- 1500€</span>
              </div>
              <ul className="space-y-4 mb-8 text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>30m² à 70m²</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>3 déménageurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Camion 20m³</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Protection IA incluse</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Emballage offert</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/client/auth-choice')}
                className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Obtenir un devis
              </button>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">F4+</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">1500€</span>
                <span className="text-gray-600 ml-2">+</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Plus de 70m²</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">4+ déménageurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Camion 30m³+</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Protection IA incluse</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Emballage + démontage</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/client/auth-choice')}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Obtenir un devis
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Ce qui est TOUJOURS inclus
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Protection IA</h3>
                  <p className="text-gray-600 text-sm">Analyse photo automatique à chaque étape</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Assurance RC Pro</h3>
                  <p className="text-gray-600 text-sm">Tous nos déménageurs sont assurés</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Support 7j/7</h3>
                  <p className="text-gray-600 text-sm">Équipe disponible avant, pendant et après</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Rapport dommages</h3>
                  <p className="text-gray-600 text-sm">Génération automatique si nécessaire</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Facteurs de prix</h3>
            <p className="text-gray-700 mb-4">Le prix final de votre déménagement dépend de plusieurs facteurs :</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Distance entre l'ancien et le nouveau logement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Volume total de biens à déménager</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Étage et présence d'ascenseur</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Services additionnels (démontage, emballage, stockage)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Date et période (weekend, vacances, fin de mois)</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
