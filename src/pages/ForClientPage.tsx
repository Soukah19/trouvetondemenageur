import { ArrowLeft, Phone, Shield, Brain, CheckCircle, DollarSign } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ForClientPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /><span className="font-medium">Retour</span></button>
        <main>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">L&apos;Excellence Opérationnelle Sécurisée par l&apos;IA</h1>
            <p className="text-xl text-gray-500">Le Standard de Confiance pour votre Mobilité</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <p className="text-gray-700 leading-relaxed text-lg">Déménager est souvent cité comme l&apos;une des expériences les plus éprouvantes de la vie adulte, mêlant logistique complexe et charge émotionnelle. Chez <strong>TROUVE TON DÉMÉNAGEUR (TTD)</strong>, nous avons transformé cette épreuve en un processus digital fluide, protégé par une infrastructure technologique de pointe. Notre mission dépasse la simple mise en relation : nous devenons le garant de votre patrimoine mobilier et le gardien de votre tranquillité d&apos;esprit.</p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4"><Shield className="w-8 h-8 text-blue-600" /><h2 className="text-2xl font-bold text-gray-900">Une Sélection Rigoureuse au Service de la Qualité</h2></div>
              <p className="text-gray-700 leading-relaxed">L&apos;aventure TTD commence par un filtrage drastique. Contrairement aux annuaires généralistes, nous imposons un audit juridique et administratif strict à chaque prestataire souhaitant intégrer notre réseau. Nous vérifions en temps réel la validité des licences de transport, les extraits Kbis et surtout les attestations d&apos;assurances Responsabilité Civile Professionnelle et Marchandises Transportées. En choisissant TTD, vous accédez à l&apos;élite des professionnels du secteur, éliminant d&apos;emblée les risques liés au travail dissimulé ou au manque d&apos;expertise.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4"><Brain className="w-8 h-8 text-purple-600" /><h2 className="text-2xl font-bold text-gray-900">L&apos;Innovation Majeure : Votre Bouclier Visuel par IA</h2></div>
              <p className="text-gray-700 leading-relaxed mb-3">La véritable rupture technologique réside dans notre protocole de preuve numérique par Intelligence Artificielle. Dès la réservation, notre plateforme vous invite à documenter l&apos;état de vos biens via un outil de capture photo sécurisé.</p>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-purple-900">Ces images constituent un état des lieux numérique horodaté. En cas de litige à la livraison, notre IA compare les scans « Avant/Après » avec une précision millimétrique, identifiant instantanément la moindre rayure ou impact. Ce rapport de constatation technique automatisé peut constituer un élément technique facilitant la constitution d&apos;un dossier de déclaration auprès de l&apos;assureur du déménageur.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4"><DollarSign className="w-8 h-8 text-green-600" /><h2 className="text-2xl font-bold text-gray-900">Modèle Financier Transparent</h2></div>
              <p className="text-gray-700 leading-relaxed mb-3">Lors de la réservation sur la plateforme TROUVE TON DÉMÉNAGEUR, le Client règle des frais de réservation correspondant à <strong>30 %</strong> du montant du devis affiché.</p>
              <p className="text-gray-700 leading-relaxed mb-3">Ces frais rémunèrent le service de mise en relation, la réservation du créneau et l&apos;utilisation des outils numériques de la plateforme.</p>
              <p className="text-gray-700 leading-relaxed mb-3">Le solde de la prestation est réglé directement entre le Client et le Déménageur lors de l&apos;exécution du déménagement.</p>
              <p className="text-sm text-gray-600">TROUVE TON DÉMÉNAGEUR n&apos;intervient pas dans ce paiement et n&apos;encaisse aucun montant au titre de la prestation de transport.</p>
            </div>
          </div>

          <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center"><h2 className="text-3xl font-bold mb-4">Une question ?</h2><p className="text-xl text-blue-100 mb-8">Notre équipe support est là pour vous aider</p><div className="flex flex-col sm:flex-row gap-4 justify-center items-center"><a href="mailto:support@trouvetondemenageur.fr" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">support@trouvetondemenageur.fr</a><a href="tel:0189707881" className="flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-blue-500"><Phone className="w-5 h-5" />01 89 70 78 81</a></div></div>
        </main>
      </div>
    </div>
  );
}
