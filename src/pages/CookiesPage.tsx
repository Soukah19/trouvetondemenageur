import { ArrowLeft, ChevronDown, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CookiesPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      title: 'Article 1 : Qu\'est-ce qu\'un cookie ?',
      content: (
        <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette ou smartphone) lors de la visite de notre plateforme trouvetondemenageur.fr. Il permet de mémoriser vos préférences et d&apos;assurer le bon fonctionnement des outils de mise en relation.</p>
      ),
    },
    {
      title: 'Article 2 : Types de cookies utilisés',
      content: (
        <>
          <p className="mb-3">Nous utilisons trois catégories de cookies pour garantir la fiabilité de nos services :</p>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="font-semibold text-blue-900 mb-1">Cookies Techniques et Essentiels</p>
              <p className="text-sm mb-1"><strong>Finalité :</strong> Permettent la navigation, la connexion à votre espace client et la sécurisation du site.</p>
              <p className="text-sm mb-1"><strong>Exemple :</strong> Cookies de session gérés par Vercel pour la performance technique.</p>
              <p className="text-sm"><strong>Durée :</strong> Session uniquement.</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="font-semibold text-green-900 mb-1">Cookies de Paiement et Sécurité (Stripe)</p>
              <p className="text-sm mb-1"><strong>Finalité :</strong> Indispensables pour traiter les paiements de réservation effectués sur la plateforme et prévenir la fraude.</p>
              <p className="text-sm"><strong>Note :</strong> Sans ces cookies, aucune transaction sécurisée ne peut être effectuée sur la plateforme.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="font-semibold text-purple-900 mb-1">Cookies de Mesure d&apos;Audience</p>
              <p className="text-sm"><strong>Finalité :</strong> Analyser le parcours utilisateur pour améliorer l&apos;ergonomie du site (pages les plus vues, temps de réponse).</p>
            </div>
          </div>
        </>
      ),
    },
    {
      title: 'Article 3 : Durée de conservation',
      content: (
        <p>Les cookies ont une durée de vie limitée. Vos choix (consentement ou refus) sont conservés pendant une durée de <strong>6 mois</strong>. À l&apos;issue de cette période, le bandeau de consentement réapparaîtra sur votre écran.</p>
      ),
    },
    {
      title: 'Article 4 : Gestion du consentement',
      content: (
        <>
          <p className="mb-3">Lors de votre première visite sur trouvetondemenageur.fr, un bandeau vous permet :</p>
          <ul className="space-y-1 ml-4 mb-3 list-none">
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>D&apos;accepter tous les cookies.</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>De refuser les cookies non essentiels (statistiques).</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>De paramétrer vos choix par catégorie.</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>Attention :</strong> Le refus des cookies techniques ou des cookies de paiement Stripe peut rendre l&apos;utilisation de la plateforme impossible ou empêcher la validation de votre réservation de déménagement.
          </div>
          <p className="mt-3 text-sm text-gray-600">Les cookies de mesure d&apos;audience et autres cookies non essentiels ne sont déposés qu&apos;après obtention du consentement explicite de l&apos;utilisateur.</p>
        </>
      ),
    },
    {
      title: 'Article 5 : Comment désactiver les cookies manuellement ?',
      content: (
        <>
          <p className="mb-3">Vous pouvez également configurer votre navigateur pour bloquer les cookies :</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p><strong>Chrome :</strong> Paramètres &gt; Confidentialité et sécurité &gt; Cookies.</p>
            <p><strong>Safari :</strong> Réglages &gt; Safari &gt; Bloquer tous les cookies.</p>
            <p><strong>Firefox :</strong> Options &gt; Vie privée et sécurité.</p>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /><span className="font-medium">Retour</span>
        </button>
        <main>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Politique Relative aux Cookies</h1>
            <p className="text-lg text-gray-500">www.trouvetondemenageur.fr</p>
          </div>
          <div className="space-y-3">
            {sections.map((section, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button onClick={() => setOpenIndex(isOpen ? null : index)} className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-semibold text-gray-900 pr-4">{section.title}</span>
                    <ChevronDown className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="px-8 pb-6 text-gray-700 leading-relaxed">{section.content}</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Une question sur les cookies ?</h2>
            <p className="text-xl text-blue-100 mb-8">Notre équipe support est là pour vous aider</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="mailto:support@trouvetondemenageur.fr" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">support@trouvetondemenageur.fr</a>
              <a href="tel:0189707881" className="flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-blue-500"><Phone className="w-5 h-5" />01 89 70 78 81</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
