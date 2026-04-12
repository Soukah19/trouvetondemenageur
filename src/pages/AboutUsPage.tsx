import { useEffect } from 'react';
import { ArrowLeft, Phone, Shield, Brain, Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AboutUsPage() {
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
              <h1 className="text-5xl font-extrabold text-gray-900 mb-4">L&apos;Excellence Opérationnelle Sécurisée par l&apos;IA</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Le Standard de Confiance pour votre Mobilité</p>
            </div>

            {/* Intro */}
            <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                Déménager est souvent cité comme l&apos;une des expériences les plus éprouvantes de la vie adulte, mêlant logistique complexe et charge émotionnelle.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                Chez <strong>trouve ton demenageur (TTD)</strong>, nous avons transformé cette épreuve en un processus digital fluide, protégé par une infrastructure technologique de pointe. Notre mission dépasse la simple mise en relation : nous devenons le garant de votre patrimoine mobilier et le gardien de votre tranquillité d&apos;esprit.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-8 mb-12">

              {/* Sélection Rigoureuse */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Une Sélection Rigoureuse au Service de la Qualité</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  L&apos;aventure TTD commence par un filtrage drastique. Contrairement aux annuaires généralistes, nous imposons un audit juridique et administratif strict à chaque prestataire souhaitant intégrer notre réseau. Nous vérifions en temps réel la validité des licences de transport, les extraits Kbis et surtout les attestations d&apos;assurances Responsabilité Civile Professionnelle et Marchandises Transportées. En choisissant TTD, vous accédez à l&apos;élite des professionnels du secteur, éliminant d&apos;emblée les risques liés au travail dissimulé ou au manque d&apos;expertise.
                </p>
              </div>

              {/* Bouclier Visuel IA */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">L&apos;Innovation Majeure : Votre Bouclier Visuel par IA</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  La véritable rupture technologique réside dans notre protocole de preuve numérique par Intelligence Artificielle. Dès la réservation, notre plateforme vous invite à documenter l&apos;état de vos biens via un outil de capture photo sécurisé. Ces images constituent un état des lieux numérique horodaté. En cas de litige à la livraison, notre IA compare les scans &quot;Avant/Après&quot; avec une précision millimétrique, identifiant instantanément la moindre rayure ou impact. Ce rapport de constatation technique automatisé devient une preuve à force probante renforcée pour actionner l&apos;indemnisation auprès de l&apos;assureur du déménageur, simplifiant drastiquement les procédures d&apos;expertise classiques.
                </p>
              </div>

              {/* Sécurité Financière */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-green-200 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Sécurité Financière et Transparence</h2>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Pour verrouiller votre sérénité, nous avons instauré un modèle financier simple et transparent. Lors de la validation, vous payez uniquement la commission plateforme via Stripe, leader mondial de la sécurité bancaire. Le jour du déménagement, vous réglez le prix du déménageur directement à celui-ci.
                </p>
                <p className="text-gray-700 leading-relaxed font-medium">
                  Ce modèle vous permet de ne payer en ligne que le strict nécessaire pour confirmer votre réservation. Le reste est entre vous et votre déménageur, en toute transparence.
                </p>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Prêt à déménager en toute sérénité ?</h2>
              <p className="text-xl text-blue-100 mb-8">Contactez-nous dès maintenant</p>
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
