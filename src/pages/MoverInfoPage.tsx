import { useEffect } from 'react';
import { ArrowLeft, Phone, Shield, Banknote, Settings, Zap, FileSignature, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoverInfoPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

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

        <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="TrouveTonDemenageur" className="h-10 w-auto object-contain" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">TrouveTonDemenageur</h1>
              </div>
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-white/50">
                <ArrowLeft className="w-4 h-4" /><span className="font-medium">Retour</span>
              </button>
            </div>
          </div>
        </header>

        <main className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Hero */}
            <div className="text-center mb-16">
              <img src="/ttd-logo.png" alt="TrouveTonDemenageur" className="h-40 w-auto mx-auto mb-6 sm:h-42" />
              <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Votre Accélérateur de Croissance Digital</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Optimisez votre activité avec l&apos;infrastructure technologique TTD</p>
            </div>

            {/* Intro */}
            <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                Pour un professionnel du transport et du déménagement, la rentabilité dépend d&apos;une équation complexe : remplir son planning tout en minimisant les risques d&apos;impayés et de litiges abusifs.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                <strong>Trouve ton déménageur (TTD)</strong> n&apos;intervient pas dans votre organisation opérationnelle, mais vous fournit une boîte à outils numériques de nouvelle génération pour sécuriser votre entreprise et valoriser votre expertise.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-8 mb-12">

              {/* Protection Réclamations */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Une Protection contre les Réclamations Infondées</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Le plus grand risque pour votre sinistralité est le litige portant sur des dommages préexistants. TTD met à votre disposition sa technologie propriétaire de <strong>vérification par Intelligence Artificielle</strong>. En utilisant notre protocole de photos horodatées avant le chargement, vous constituez un historique d&apos;état numérique à force probante. Cette &quot;mémoire digitale&quot; est votre meilleure alliée : elle permet de neutraliser objectivement les réclamations de mauvaise foi. Vous exercez votre métier en toute sérénité, protégé par des données techniques précises en cas de contestation sur l&apos;état des biens livrés.
                </p>
              </div>

              {/* Sécurisation Trésorerie */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-green-200 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Sécurisation des Flux de Trésorerie</h2>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Nous savons que la gestion du cash-flow est cruciale. TTD sécurise la part financière de vos missions dès la réservation. Grâce à notre intégration avec la solution Stripe, la commission client est encaissée de manière sécurisée, et le client vous paie directement le jour J.
                </p>
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div><strong>Zéro Impayé :</strong> Fini les incertitudes liées aux chèques sans provision.</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div><strong>Garantie d&apos;Immobilisation :</strong> En cas d&apos;annulation tardive du client, vous bénéficiez des indemnités contractuelles prévues.</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div><strong>Paiement direct et transparent :</strong> Le client vous paie directement le montant de votre devis le jour du déménagement . Pas d&apos;intermédiaire sur votre rémunération, pas de délai d&apos;attente.</div>
                  </div>
                </div>
              </div>

              {/* Simplification Administrative */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Simplification et Performance Administrative</h2>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  En rejoignant l&apos;écosystème TTD, vous accédez à une interface de gestion &quot;tout-en-un&quot; qui allège votre gestion documentaire. Vous bénéficiez de services numériques intégrés.
                </p>
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
                    <FileSignature className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div><strong>Signature électronique :</strong> Formalisez vos échanges via Dropbox Sign en quelques clics.</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div><strong>Apport d&apos;affaires qualifié :</strong> Recevez des demandes de missions dont les informations (volumes, accès) ont été pré-remplies par les utilisateurs.</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div><strong>Visibilité Premium :</strong> TTD vous connecte à une clientèle exigeante qui valorise la transparence et la sécurité.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
              <p className="text-gray-700 leading-relaxed text-lg">
                TTD agit comme votre partenaire technologique : nous gérons l&apos;infrastructure digitale pour vous permettre de vous concentrer exclusivement sur votre cœur de métier : <strong>l&apos;excellence logistique</strong>. Engagez votre entreprise dans un partenariat où la technologie est au service de votre rentabilité et de votre protection juridique.
              </p>
            </div>

            {/* Contact CTA */}
            <div className="mt-8 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Rejoignez l&apos;écosystème TTD</h2>
              <p className="text-xl text-blue-100 mb-8">Boostez votre activité dès maintenant</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="mailto:support@trouvetondemenageur.fr" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">support@trouvetondemenageur.fr</a>
                <a href="tel:0189707881" className="flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-blue-500">
                  <Phone className="w-5 h-5" />01 89 70 78 81
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
