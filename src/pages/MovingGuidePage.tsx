import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, CheckCircle, Calendar, Package, Home, Shield, AlertCircle, ClipboardList, Users, Wrench, FileText } from 'lucide-react';

const guideSteps = [
  {
    icon: Calendar,
    title: '8 semaines avant',
    color: 'blue',
    tips: [
      'Faites le tri dans vos affaires et désencombrez',
      'Commencez à récupérer des cartons et du matériel d\'emballage',
      'Établissez un budget détaillé pour votre déménagement',
      'Demandez plusieurs devis via TrouveTonDemenageur',
      'Réservez votre déménageur dès que possible'
    ]
  },
  {
    icon: FileText,
    title: '6 semaines avant',
    color: 'green',
    tips: [
      'Prévenez votre propriétaire actuel (préavis de 3 mois si location)',
      'Signez le bail de votre nouveau logement',
      'Changez votre adresse auprès des administrations',
      'Prévenez votre employeur, banque, assurance',
      'Inscrivez vos enfants dans leur nouvelle école'
    ]
  },
  {
    icon: Package,
    title: '4 semaines avant',
    color: 'orange',
    tips: [
      'Commencez à emballer les objets que vous utilisez rarement',
      'Étiquetez chaque carton avec son contenu et la pièce de destination',
      'Faites une liste détaillée de vos biens précieux',
      'Prenez des photos de vos meubles et objets de valeur',
      'Organisez un vide-grenier ou donnez ce dont vous ne voulez plus'
    ]
  },
  {
    icon: Wrench,
    title: '2 semaines avant',
    color: 'purple',
    tips: [
      'Confirmez les détails avec votre déménageur',
      'Résiliez vos abonnements (internet, électricité, gaz)',
      'Faites suivre votre courrier à La Poste',
      'Videz et dégivrez votre réfrigérateur-congélateur',
      'Préparez un kit de survie pour le jour J'
    ]
  },
  {
    icon: ClipboardList,
    title: '1 semaine avant',
    color: 'red',
    tips: [
      'Terminez tous vos cartons sauf celui du quotidien',
      'Démontez les meubles qui doivent l\'être',
      'Faites un dernier tri et jetez ce qui ne sert plus',
      'Préparez les clés à remettre au propriétaire',
      'Nettoyez votre ancien logement progressivement'
    ]
  },
  {
    icon: Truck,
    title: 'Le jour J',
    color: 'blue',
    tips: [
      'Utilisez l\'app TrouveTonDemenageur pour photographier tous vos biens',
      'Soyez présent du début à la fin du déménagement',
      'Vérifiez que rien n\'est oublié dans l\'ancien logement',
      'Photographiez l\'état des biens au chargement et déchargement',
      'Faites un état des lieux de sortie avec le propriétaire'
    ]
  },
  {
    icon: Home,
    title: 'Après le déménagement',
    color: 'green',
    tips: [
      'Installez d\'abord les meubles essentiels (lit, cuisine)',
      'Déballez pièce par pièce en commençant par les priorités',
      'Vérifiez l\'état de tous vos biens avec les photos de référence',
      'Signalez immédiatement tout dommage via l\'application',
      'Recyclez les cartons et matériaux d\'emballage'
    ]
  }
];

const packingTips = [
  {
    title: 'Objets fragiles',
    icon: Shield,
    tips: [
      'Utilisez du papier bulle et du papier journal',
      'Remplissez les espaces vides dans les cartons',
      'Marquez clairement "FRAGILE" sur les cartons',
      'Transportez les objets de grande valeur vous-même',
      'Assurez-vous que rien ne bouge dans les cartons'
    ]
  },
  {
    title: 'Vêtements',
    icon: Package,
    tips: [
      'Laissez les vêtements sur cintres dans des housses',
      'Utilisez des valises pour les vêtements lourds',
      'Mettez les chaussures dans des sacs',
      'Profitez-en pour faire le tri et donner',
      'Emballez les vêtements hors saison en dernier'
    ]
  },
  {
    title: 'Électronique',
    icon: AlertCircle,
    tips: [
      'Prenez des photos des branchements avant de débrancher',
      'Utilisez les emballages d\'origine si possible',
      'Protégez bien les écrans avec du papier bulle',
      'Transportez les ordinateurs et disques durs vous-même',
      'Sauvegardez toutes vos données importantes'
    ]
  },
  {
    title: 'Livres et documents',
    icon: FileText,
    tips: [
      'Utilisez des petits cartons (les livres sont lourds)',
      'Ne remplissez pas trop les cartons',
      'Gardez les documents importants avec vous',
      'Protégez les livres précieux individuellement',
      'Empilez les livres à plat, pas debout'
    ]
  }
];

const essentialKit = [
  'Chargeurs de téléphone et ordinateur',
  'Médicaments et trousse de premiers secours',
  'Documents importants (papiers d\'identité, contrats)',
  'Vêtements de rechange pour 2-3 jours',
  'Articles de toilette essentiels',
  'Snacks et bouteilles d\'eau',
  'Outils de base (tournevis, cutter, scotch)',
  'Produits de nettoyage de base',
  'Draps et serviettes pour la première nuit',
  'Nourriture pour animaux si vous en avez'
];

export function MovingGuidePage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl">
              <ClipboardList className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Guide Complet du Déménagement
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tous les conseils pour un déménagement réussi et sans stress
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white mb-16 text-center">
            <Users className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Un déménagement bien préparé, c'est un déménagement réussi
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Suivez notre guide étape par étape pour organiser votre déménagement sereinement.
              De la planification à l'installation, nous vous accompagnons à chaque étape.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Planning du Déménagement
            </h2>
            <div className="space-y-6">
              {guideSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 bg-${step.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <ul className="space-y-3">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Conseils d'Emballage
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {packingTips.map((category, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {category.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-3xl p-12 text-white mb-16">
            <div className="flex items-start gap-6">
              <AlertCircle className="w-12 h-12 flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold mb-6">Kit de Survie du Jour J</h2>
                <p className="text-xl text-orange-100 mb-6">
                  Préparez un sac avec tout ce dont vous aurez besoin le jour du déménagement et les premiers jours dans votre nouveau logement :
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {essentialKit.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Protection IA</h3>
              <p className="text-gray-700">
                Photographiez tous vos biens via notre app pour une protection maximale
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Déménageurs Certifiés</h3>
              <p className="text-gray-700">
                Choisissez parmi des professionnels vérifiés et assurés
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Devis Gratuits</h3>
              <p className="text-gray-700">
                Comparez jusqu'à 3 devis gratuitement en 24h
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Prêt à déménager ?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Demandez vos devis gratuits maintenant et bénéficiez de notre protection IA
            </p>
            <button
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105"
            >
              Obtenir mes devis gratuits
            </button>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
