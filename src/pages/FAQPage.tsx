import { Truck, ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type FAQItem = {
  question: string;
  answer: string;
  category: 'clients' | 'movers' | 'tech';
};

export function FAQPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs: FAQItem[] = [
    {
      category: 'clients',
      question: 'Comment fonctionne la protection par IA ?',
      answer: 'Notre système d\'IA analyse les photos prises à trois moments clés : avant le départ (demande de devis), au chargement et au déchargement. En comparant ces images, l\'IA peut déterminer avec précision quand et comment un dommage s\'est produit, protégeant ainsi équitablement clients et déménageurs.'
    },
    {
      category: 'clients',
      question: 'Combien coûte le service ?',
      answer: 'L\'utilisation de notre plateforme est gratuite pour les clients. Vous payez le prix du déménagement convenu avec le professionnel que vous choisissez.'
    },
    {
      category: 'clients',
      question: 'Combien de devis vais-je recevoir ?',
      answer: 'Vous recevrez jusqu\'à 3 devis de déménageurs professionnels certifiés dans les 24 heures suivant votre demande. Vous êtes libre de choisir celui qui correspond le mieux à vos besoins et votre budget.'
    },
    {
      category: 'clients',
      question: 'Les déménageurs sont-ils assurés ?',
      answer: 'Oui, absolument. Tous les déménageurs sur notre plateforme sont vérifiés et doivent présenter une assurance professionnelle valide. Nous vérifions régulièrement leurs certifications.'
    },
    {
      category: 'clients',
      question: 'Que se passe-t-il si mes biens sont endommagés ?',
      answer: 'En cas de dommage, vous pouvez immédiatement créer un rapport via l\'application. Notre IA analysera les photos pour déterminer l\'origine du dommage. Un rapport détaillé sera généré automatiquement pour faciliter les démarches avec l\'assurance.'
    },
    {
      category: 'movers',
      question: 'Comment devenir déménageur partenaire ?',
      answer: 'Il suffit de vous inscrire via notre formulaire déménageur. Nous vérifierons vos certifications professionnelles, votre assurance et votre expérience. Une fois validé, vous pourrez commencer à recevoir des demandes de devis.'
    },
    {
      category: 'movers',
      question: 'Comment l\'IA me protège-t-elle des fausses accusations ?',
      answer: 'En photographiant systématiquement les biens au moment du chargement, vous créez une preuve irréfutable de leur état à ce moment précis. Si un client prétend qu\'un dommage s\'est produit pendant le transport alors qu\'il existait déjà, l\'IA le détectera automatiquement.'
    },
    {
      category: 'movers',
      question: 'Puis-je refuser une demande de devis ?',
      answer: 'Oui, vous êtes totalement libre de choisir les demandes auxquelles vous souhaitez répondre. Il n\'y a aucune obligation d\'accepter toutes les demandes. Nous recommandons toutefois de maintenir un bon taux de réponse pour améliorer votre visibilité.'
    },
    {
      category: 'tech',
      question: 'Mes photos sont-elles sécurisées ?',
      answer: 'Absolument. Toutes les photos sont chiffrées et stockées sur des serveurs sécurisés. Elles ne sont accessibles que par vous et les parties autorisées (déménageur assigné). Nous respectons strictement le RGPD et ne partageons jamais vos données avec des tiers.'
    },
    {
      category: 'tech',
      question: 'L\'IA peut-elle se tromper ?',
      answer: 'Notre IA a un taux de précision de 94% dans l\'identification des dommages. En cas de doute, le système le signale clairement et recommande une expertise humaine. De plus, tous les rapports peuvent être contestés et réexaminés.'
    },
    {
      category: 'tech',
      question: 'Que fait l\'IA exactement ?',
      answer: 'L\'IA compare les photos prises à différentes étapes pour identifier les changements d\'état des objets. Elle utilise la reconnaissance d\'image, la détection d\'anomalies et l\'analyse comparative pour générer des rapports objectifs sur l\'état des biens.'
    }
  ];

  const categories = [
    { id: 'clients', label: 'Questions Clients', color: 'blue' },
    { id: 'movers', label: 'Questions Déménageurs', color: 'green' },
    { id: 'tech', label: 'Technologie', color: 'orange' }
  ];

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
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-slate-50/88 to-blue-50/90"></div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Questions Fréquentes
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Trouvez rapidement les réponses à toutes vos questions
            </p>
          </div>

          {categories.map((category) => (
            <div key={category.id} className="mb-12">
              <h2 className={`text-2xl font-bold text-${category.color}-600 mb-6 flex items-center gap-3`}>
                <span className={`w-2 h-8 bg-${category.color}-600 rounded-full`}></span>
                {category.label}
              </h2>
              <div className="space-y-4">
                {faqs
                  .filter((faq) => faq.category === category.id)
                  .map((faq) => {
                    const globalIndex = faqs.indexOf(faq);
                    const isOpen = openIndex === globalIndex;
                    return (
                      <div
                        key={globalIndex}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:border-blue-200 transition-all"
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-lg font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform ${
                              isOpen ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-8 pb-6 text-gray-700 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Vous ne trouvez pas votre réponse ?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Notre équipe support est là pour vous aider
            </p>
            <button
              onClick={() => navigate(-1)}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
            >
              Contactez-nous
            </button>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
