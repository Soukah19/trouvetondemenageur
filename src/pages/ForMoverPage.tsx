import { ArrowLeft, Phone, Shield, TrendingUp, Zap, FileSignature } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ForMoverPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /><span className="font-medium">Retour</span></button>
        <main>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Votre Accélérateur de Croissance Digital</h1>
            <p className="text-xl text-gray-500">Optimisez votre activité avec l&apos;infrastructure technologique TTD</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <p className="text-gray-700 leading-relaxed text-lg">Pour un professionnel du transport et du déménagement, la rentabilité dépend d&apos;une équation complexe : remplir son planning tout en minimisant les risques d&apos;impayés et de litiges abusifs. <strong>Trouve Ton Déménageur (TTD)</strong> n&apos;intervient pas dans votre organisation opérationnelle, mais vous fournit une boîte à outils numériques de nouvelle génération pour sécuriser votre entreprise et valoriser votre expertise.</p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4"><Shield className="w-8 h-8 text-blue-600" /><h2 className="text-2xl font-bold text-gray-900">Une Protection contre les Réclamations Infondées</h2></div>
              <p className="text-gray-700 leading-relaxed mb-3">Le plus grand risque pour votre sinistralité est le litige portant sur des dommages préexistants. TTD met à votre disposition sa technologie propriétaire de vérification par Intelligence Artificielle.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-900">En utilisant notre protocole de photos horodatées avant le chargement, vous constituez un historique d&apos;état numérique pouvant servir d&apos;élément technique en cas de contestation. Cette « mémoire digitale » est votre meilleure alliée : elle permet de neutraliser objectivement les réclamations de mauvaise foi. Vous exercez votre métier en toute sérénité, protégé par des données techniques précises en cas de contestation sur l&apos;état des biens livrés.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4"><TrendingUp className="w-8 h-8 text-green-600" /><h2 className="text-2xl font-bold text-gray-900">Sécurisation des Missions</h2></div>
              <p className="text-gray-700 leading-relaxed mb-3">Lorsqu&apos;un Client réserve une prestation via la plateforme TROUVE TON DÉMÉNAGEUR, il règle des frais de réservation correspondant à la commission de mise en relation de la plateforme.</p>
              <p className="text-gray-700 leading-relaxed mb-3">Le solde de la prestation de déménagement est réglé directement au Déménageur lors de l&apos;exécution de la mission.</p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-900">Ce modèle garantit au professionnel la confirmation de la réservation tout en conservant la maîtrise directe de la facturation et du paiement du solde de la prestation.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4"><Zap className="w-8 h-8 text-purple-600" /><h2 className="text-2xl font-bold text-gray-900">Simplification et Performance Administrative</h2></div>
              <p className="text-gray-700 leading-relaxed mb-4">En rejoignant l&apos;écosystème TTD, vous accédez à une interface de gestion « tout-en-un » qui allège votre gestion documentaire. Vous bénéficiez de services numériques intégrés :</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"><FileSignature className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" /><div><strong>Signature électronique :</strong> Formalisez vos échanges via Yousign en quelques clics.</div></div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"><TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" /><div><strong>Apport d&apos;affaires qualifié :</strong> Recevez des demandes de missions dont les informations (volumes, accès) ont été pré-remplies par les utilisateurs.</div></div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"><Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" /><div><strong>Visibilité Premium :</strong> TTD vous connecte à une clientèle exigeante qui valorise la transparence et la sécurité.</div></div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <p className="text-lg leading-relaxed">TTD agit comme votre partenaire technologique : nous gérons l&apos;infrastructure digitale pour vous permettre de vous concentrer exclusivement sur votre cœur de métier : <strong>l&apos;excellence logistique</strong>. Engagez votre entreprise dans un partenariat où la technologie est au service de votre rentabilité et de votre protection juridique.</p>
            </div>
          </div>

          <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center"><h2 className="text-3xl font-bold mb-4">Rejoignez le réseau TTD</h2><p className="text-xl text-blue-100 mb-8">Notre équipe est là pour vous accompagner</p><div className="flex flex-col sm:flex-row gap-4 justify-center items-center"><a href="mailto:support@trouvetondemenageur.fr" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">support@trouvetondemenageur.fr</a><a href="tel:0189707881" className="flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-blue-500"><Phone className="w-5 h-5" />01 89 70 78 81</a></div></div>
        </main>
      </div>
    </div>
  );
}
