import { ArrowLeft, ExternalLink, Shield, Globe } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const partners = [
  {
    name: 'Stripe',
    category: 'Paiements sécurisés',
    description: 'Leader mondial du paiement en ligne. Vos transactions sont protégées par la norme PCI-DSS la plus stricte. Stripe traite des milliards de dollars de transactions chaque année pour des entreprises de toutes tailles.',
    color: 'from-indigo-500 to-purple-600',
    initial: 'S',
    website: 'https://stripe.com',
  },
  {
    name: 'Dropbox Sign',
    category: 'Signature électronique',
    description: 'Solution de signature électronique conforme eIDAS. Vos contrats signés en toute sécurité et conformité juridique. Dropbox Sign garantit la valeur légale de chaque document signé sur notre plateforme.',
    color: 'from-blue-500 to-indigo-600',
    initial: 'D',
    website: 'https://sign.dropbox.com',
  },
  {
    name: 'Vercel',
    category: 'Hébergement sécurisé',
    description: 'Infrastructure cloud de pointe garantissant performance, disponibilité et sécurité maximale de vos données. Vercel assure un temps de chargement ultra-rapide et une disponibilité de 99.99%.',
    color: 'from-gray-800 to-gray-900',
    initial: '▲',
    website: 'https://vercel.com',
  },
  {
    name: 'Supabase',
    category: 'Base de données',
    description: 'Plateforme open-source de gestion de bases de données avec authentification intégrée, stockage sécurisé et API temps réel. Vos données sont protégées avec un chiffrement de niveau entreprise.',
    color: 'from-emerald-500 to-teal-600',
    initial: 'SB',
    website: 'https://supabase.com',
  },
  {
    name: 'Google Maps',
    category: 'Géolocalisation',
    description: 'Service de cartographie et de géolocalisation de Google. Permet le calcul précis des distances et des itinéraires pour estimer au mieux le coût de votre déménagement.',
    color: 'from-blue-500 to-sky-600',
    initial: 'G',
    website: 'https://maps.google.com',
  },
  {
    name: 'OpenAI',
    category: 'Intelligence Artificielle',
    description: 'Technologie d\'IA avancée alimentant notre système de détection de dommages. Nos algorithmes comparent les photos avant/après avec une précision millimétrique pour protéger clients et déménageurs.',
    color: 'from-gray-700 to-gray-800',
    initial: 'AI',
    website: 'https://openai.com',
  },
  {
    name: 'Sendinblue (Brevo)',
    category: 'Communication',
    description: 'Solution d\'emailing et de notifications transactionnelles. Assure la livraison fiable de toutes vos notifications, confirmations de réservation et alertes en temps réel.',
    color: 'from-blue-600 to-indigo-700',
    initial: 'B',
    website: 'https://www.brevo.com',
  },
  {
    name: 'AXA Assurances',
    category: 'Assurance partenaire',
    description: 'Partenaire assuranciel de référence pour la couverture des déménagements professionnels. AXA accompagne nos prestataires avec des solutions d\'assurance RC Pro et Marchandises Transportées adaptées.',
    color: 'from-blue-700 to-blue-900',
    initial: 'AXA',
    website: 'https://www.axa.fr',
  },
  {
    name: 'La Poste',
    category: 'Services postaux',
    description: 'Partenaire logistique national pour le suivi de courrier et le transfert d\'adresse. Simplifiez vos démarches administratives lors de votre changement d\'adresse.',
    color: 'from-yellow-500 to-yellow-600',
    initial: 'LP',
    website: 'https://www.laposte.fr',
  },
];

export function PartnersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/planification-demenagement-a-dom-tom.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-slate-50/88 to-blue-50/90"></div>
      <div className="relative">

        {/* ── HEADER ── */}
        <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <img src="/logo.png" alt="TrouveTonDemenageur logo" className="h-10 w-auto object-contain" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  TrouveTonDemenageur
                </h1>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Retour</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main className="pt-32 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Hero */}
            <div className="text-center mb-16">
              <img src="/ttd-logo.png" alt="TrouveTonDemenageur" className="h-40 w-auto mx-auto mb-6 sm:h-42" />
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-6 shadow-xl">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                Nos Partenaires
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Des entreprises de confiance qui partagent notre vision de l'excellence et de la sécurité
              </p>
            </div>

            {/* Trust banner */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 text-white mb-16 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-blue-300" />
              <h2 className="text-2xl font-bold mb-3">
                Un écosystème technologique de confiance
              </h2>
              <p className="text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Chaque partenaire a été sélectionné pour son expertise, sa fiabilité et sa conformité aux plus hauts standards de sécurité. Ensemble, nous construisons la plateforme de déménagement la plus sûre de France.
              </p>
            </div>

            {/* Partners grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map((partner, index) => (
                <div
                  key={partner.name}
                  className="group bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${partner.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-lg font-black">{partner.initial}</span>
                  </div>
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full mb-3">
                    {partner.category}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{partner.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">
                    {partner.description}
                  </p>
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visiter le site
                  </a>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Vous souhaitez devenir partenaire ?
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Rejoignez notre écosystème et participez à la révolution du déménagement sécurisé.
                </p>
                <a
                  href="mailto:partenariats@trouvetondemenageur.fr"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Contactez-nous
                </a>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
