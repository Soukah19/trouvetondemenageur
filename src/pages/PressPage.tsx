import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Newspaper, ExternalLink, Radio, Tv, Globe } from 'lucide-react';

const mediaPresence = [
  {
    name: 'Le Figaro',
    logo: '📰',
    type: 'Presse écrite',
    description: 'TrouveTonDemenageur révolutionne le secteur du déménagement avec son IA',
    date: 'Décembre 2025',
    url: '#'
  },
  {
    name: 'Les Échos',
    logo: '📊',
    type: 'Presse économique',
    description: 'La startup française qui digitalise le déménagement',
    date: 'Novembre 2025',
    url: '#'
  },
  {
    name: 'BFM Business',
    logo: '📺',
    type: 'Télévision',
    description: 'Interview du fondateur sur l\'innovation dans la logistique',
    date: 'Octobre 2025',
    url: '#'
  },
  {
    name: 'France Inter',
    logo: '🎙️',
    type: 'Radio',
    description: 'Émission "La Nouvelle Eco" - Le digital au service du déménagement',
    date: 'Septembre 2025',
    url: '#'
  },
  {
    name: '01net',
    logo: '💻',
    type: 'Média tech',
    description: 'Comment l\'IA transforme l\'industrie du déménagement',
    date: 'Août 2025',
    url: '#'
  },
  {
    name: 'TechCrunch',
    logo: '🚀',
    type: 'Média international',
    description: 'French startup brings AI to moving industry',
    date: 'Juillet 2025',
    url: '#'
  }
];

const partnerships = [
  {
    name: 'Leboncoin',
    logo: '🏠',
    description: 'Partenaire officiel pour faciliter les déménagements des utilisateurs',
    category: 'Plateforme de petites annonces'
  },
  {
    name: 'SeLoger',
    logo: '🔑',
    description: 'Solution de déménagement recommandée pour les nouveaux locataires',
    category: 'Immobilier'
  },
  {
    name: 'PAP',
    logo: '🏘️',
    description: 'Service de déménagement intégré pour les particuliers',
    category: 'Immobilier'
  },
  {
    name: 'Allianz',
    logo: '🛡️',
    description: 'Partenaire assurance pour la protection des biens',
    category: 'Assurance'
  },
  {
    name: 'Maif',
    logo: '🤝',
    description: 'Solution recommandée pour les sociétaires',
    category: 'Assurance'
  },
  {
    name: 'La Poste',
    logo: '📦',
    description: 'Partenariat pour la logistique et l\'acheminement',
    category: 'Logistique'
  }
];

const awards = [
  {
    title: 'Prix Innovation InsurTech 2025',
    organization: 'Association Française de l\'Assurance',
    year: '2025'
  },
  {
    title: 'Startup de l\'année - Catégorie Logistique',
    organization: 'FrenchTech',
    year: '2025'
  },
  {
    title: 'Prix de la Transformation Digitale',
    organization: 'Fédération Nationale des Déménageurs',
    year: '2025'
  }
];

const mediaContact = {
  name: 'Service Communication',
  email: 'presse@trouveton.fr',
  phone: '+33 1 23 45 67 89'
};

export function PressPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464207/pexels-photo-7464207.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
              <Newspaper className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Presse & Partenaires
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Notre présence dans les médias et nos partenariats avec les grandes plateformes
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Ils parlent de nous</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mediaPresence.map((media, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{media.logo}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{media.name}</h3>
                      <p className="text-sm text-blue-600 font-semibold mb-2">{media.type}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium mb-3">{media.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{media.date}</span>
                    <a
                      href={media.url}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Voir l'article
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Nos Partenaires</h2>
            <p className="text-gray-600 mb-8 text-lg">
              TrouveTonDemenageur est présent sur les plus grandes plateformes françaises
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {partnerships.map((partner, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="text-5xl mb-4 text-center">{partner.logo}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{partner.name}</h3>
                  <p className="text-sm text-blue-600 font-semibold mb-3 text-center">{partner.category}</p>
                  <p className="text-gray-600 text-sm text-center">{partner.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Prix & Distinctions</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {awards.map((award, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold mb-3">{award.title}</h3>
                  <p className="text-blue-100 mb-2">{award.organization}</p>
                  <p className="text-blue-200 text-sm font-semibold">{award.year}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Contact Presse</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Pour toute demande d'information, interview ou partenariat média
            </p>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Service</p>
                  <p className="text-xl font-bold mb-2">{mediaContact.name}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Contact</p>
                  <p className="font-semibold mb-1">{mediaContact.email}</p>
                  <p className="font-semibold">{mediaContact.phone}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/contact')}
                className="w-full mt-6 bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300"
              >
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
