import { ArrowLeft, ChevronDown, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LegalMentionsPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    { title: '1. Éditeur du site', content: (<><p className="mb-3">Le site internet www.trouvetondemenageur.fr est édité par la société TROUVE TON DÉMÉNAGEUR, Société par Actions Simplifiée à Associé Unique (SASU) au capital de 1 000,00 euros, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 101 378 248.</p><div className="bg-gray-50 rounded-xl p-4 space-y-2"><p><strong>Siège social :</strong> 60 rue François 1er, 75008 Paris</p><p><strong>Directeur de la publication :</strong> M. Heikel NACHI</p><p><strong>Numéro de TVA Intracommunautaire :</strong> FR 83 101378248</p><p><strong>Contact :</strong> support@trouvetondemenageur.fr</p></div></>) },
    { title: '2. Hébergement', content: (<p>Le site est hébergé par la société Vercel Inc., dont le siège social est situé au 340 S Lemon Ave #4133 Walnut, CA 91789, USA. Les données sont stockées sur des serveurs sécurisés garantissant la confidentialité des échanges.</p>) },
    { title: '3. Médiation de la consommation', content: (<><p className="mb-3">Conformément aux articles L.612-1 et suivants du Code de la consommation, le Client peut saisir gratuitement le médiateur :</p><div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="font-semibold text-blue-900">SAS Médiation Solution Consommation</p><p className="text-blue-700">222 chemin de la Bergerie – 01800 Saint Jean de Niost</p><a href="https://sasmediationsolution-conso.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://sasmediationsolution-conso.fr</a></div></>) },
    { title: '4. Protection des données personnelles (RGPD)', content: (<><p className="mb-3"><strong>Base légale :</strong> Le traitement des données (nom, adresse, inventaire, photos) est fondé sur l&apos;exécution du contrat d&apos;intermédiation et le respect des obligations légales de vigilance (KYB).</p><p className="mb-3"><strong>Finalité :</strong> Les données sont collectées pour la mise en relation, la sécurisation des paiements via Stripe et la constitution du protocole de preuve par IA.</p><p className="mb-3"><strong>Droits :</strong> Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement, d&apos;opposition et de portabilité de vos données.</p><p>Vous pouvez exercer ces droits en écrivant à : <a href="mailto:support@trouvetondemenageur.fr" className="text-blue-600 hover:underline">support@trouvetondemenageur.fr</a></p></>) },
    { title: '5. Propriété intellectuelle', content: (<p>La structure générale du site, les textes, les chartes graphiques, les logos et les algorithmes propriétaires d&apos;analyse d&apos;images (IA) sont la propriété exclusive de la société TROUVE TON DÉMÉNAGEUR. Toute reproduction, représentation ou diffusion, en tout ou partie, du contenu de ce site sur quelque support ou par quelque procédé que ce soit est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.</p>) },
    { title: '6. Limitation de responsabilité de l\'éditeur', content: (<><p className="mb-3">TTD s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées. Toutefois, en sa qualité d&apos;intermédiaire, TTD ne saurait être tenue responsable :</p><ul className="space-y-1 ml-4 list-none"><li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>Des interruptions de service liées à la maintenance technique.</li><li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>De l&apos;exactitude des informations saisies par les utilisateurs (volumes, accès).</li><li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span>Des dommages directs ou indirects résultant de la prestation de transport exécutée par le Déménageur indépendant.</li></ul></>) },
    { title: '7. Droit applicable', content: (<p>Le présent site est soumis au droit français. Tout litige relatif à son utilisation relève de la compétence des juridictions françaises.</p>) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /><span className="font-medium">Retour</span></button>
        <main>
          <div className="text-center mb-12"><h1 className="text-4xl font-extrabold text-gray-900 mb-3">Mentions Légales</h1><p className="text-lg text-gray-500">www.trouvetondemenageur.fr</p></div>
          <div className="space-y-3">
            {sections.map((section, index) => {
              const isOpen = openIndex === index;
              return (<div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><button onClick={() => setOpenIndex(isOpen ? null : index)} className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"><span className="text-lg font-semibold text-gray-900 pr-4">{section.title}</span><ChevronDown className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && <div className="px-8 pb-6 text-gray-700 leading-relaxed">{section.content}</div>}</div>);
            })}
          </div>
          <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center"><h2 className="text-3xl font-bold mb-4">Une question ?</h2><p className="text-xl text-blue-100 mb-8">Notre équipe support est là pour vous aider</p><div className="flex flex-col sm:flex-row gap-4 justify-center items-center"><a href="mailto:support@trouvetondemenageur.fr" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">support@trouvetondemenageur.fr</a><a href="tel:0189707881" className="flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-blue-500"><Phone className="w-5 h-5" />01 89 70 78 81</a></div></div>
        </main>
      </div>
    </div>
  );
}
