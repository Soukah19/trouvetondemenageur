import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, HelpCircle, CheckCircle } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  options?: string[];
};

type KnowledgeItem = {
  keywords: string[];
  response: string;
  category: string;
};

const knowledgeBase: KnowledgeItem[] = [
  {
    keywords: ['prix', 'coût', 'tarif', 'combien', 'payer', 'facture'],
    response: "Nos tarifs dépendent de plusieurs facteurs: distance, volume, étage, services additionnels. En moyenne, comptez entre 400€ et 1500€ pour un déménagement standard. Demandez un devis gratuit pour obtenir un prix précis adapté à votre situation!",
    category: 'prix'
  },
  {
    keywords: ['devis', 'estimation', 'gratuit', 'quote'],
    response: "Pour obtenir un devis gratuit, cliquez sur 'Demander un devis' sur notre page d'accueil. Vous recevrez jusqu'à 3 propositions de déménageurs vérifiés sous 24h. C'est 100% gratuit et sans engagement!",
    category: 'devis'
  },
  {
    keywords: ['assurance', 'garantie', 'dommage', 'casse', 'protection'],
    response: "Tous nos déménageurs partenaires sont assurés. Votre déménagement est couvert contre les dommages. En cas de problème, vous pouvez déclarer un sinistre directement via notre plateforme dans les 48h suivant le déménagement.",
    category: 'assurance'
  },
  {
    keywords: ['délai', 'temps', 'rapidement', 'quand', 'durée'],
    response: "Un déménagement local prend généralement 4-8 heures. Pour un longue distance, comptez 1-2 jours. Après votre demande de devis, vous recevez les propositions sous 24h. Il est recommandé de réserver 2-3 semaines à l'avance.",
    category: 'delai'
  },
  {
    keywords: ['carton', 'emballage', 'fourniture', 'matériel'],
    response: "Nos déménageurs proposent des services d'emballage complet. Vous pouvez aussi louer ou acheter des cartons et fournitures. Cochez simplement 'Fourniture de cartons' dans votre demande de devis!",
    category: 'materiel'
  },
  {
    keywords: ['annuler', 'annulation', 'modifier', 'changer', 'reporter'],
    response: "Vous pouvez modifier ou annuler votre réservation jusqu'à 48h avant la date prévue sans frais. Au-delà, des frais d'annulation peuvent s'appliquer selon les conditions du déménageur. Contactez directement votre déménageur via notre messagerie.",
    category: 'annulation'
  },
  {
    keywords: ['paiement', 'carte', 'virement', 'espèce', 'cb'],
    response: "Le paiement se fait de manière sécurisée sur notre plateforme. Nous acceptons: carte bancaire, virement. Un acompte de 30% est demandé à la réservation, le solde est versé après le déménagement. Les déménageurs reçoivent 70% du montant, nous prélevons 30% de commission.",
    category: 'paiement'
  },
  {
    keywords: ['devenir', 'déménageur', 'inscription', 'partenaire', 'professionnel', 'rejoindre'],
    response: "Pour devenir déménageur partenaire, cliquez sur 'Espace Déménageur' puis 'Créer un compte professionnel'. Vous devrez fournir: SIRET, attestation d'assurance, RCS. Une vérification est effectuée sous 48-72h. Vous recevrez ensuite des demandes de devis!",
    category: 'devenir'
  },
  {
    keywords: ['avis', 'note', 'évaluation', 'commentaire', 'fiable'],
    response: "Tous les avis sur notre plateforme sont vérifiés. Seuls les clients ayant réellement effectué un déménagement peuvent laisser un avis. Vous pouvez consulter les notes, photos et commentaires détaillés de chaque déménageur avant de choisir.",
    category: 'avis'
  },
  {
    keywords: ['distance', 'km', 'loin', 'région', 'département'],
    response: "Nos déménageurs couvrent toute la France. Pour les déménagements longue distance (plus de 200km), des frais de trajet aller-retour peuvent s'appliquer. Les déménageurs peuvent optimiser avec des 'trajets de retour' pour réduire les coûts.",
    category: 'distance'
  },
  {
    keywords: ['monte', 'meuble', 'demonte', 'assemblage'],
    response: "Nos déménageurs proposent le démontage et remontage de meubles. Cochez 'Démontage/Remontage meubles' dans votre demande de devis. Cela inclut: lits, armoires, tables, etc. Les meubles sur-mesure complexes peuvent nécessiter un supplément.",
    category: 'montage'
  },
  {
    keywords: ['piano', 'fragile', 'œuvre', 'art', 'objet précieux'],
    response: "Pour les objets fragiles ou de valeur (piano, œuvres d'art, antiquités), indiquez-le dans 'Informations complémentaires' de votre devis. Nos déménageurs spécialisés ont l'équipement et l'expérience pour transporter ces objets en toute sécurité.",
    category: 'fragile'
  },
  {
    keywords: ['garde', 'stockage', 'entreposage', 'box', 'stocker'],
    response: "Certains déménageurs proposent des services de garde-meubles. Vous pouvez stocker vos affaires temporairement si votre nouveau logement n'est pas prêt. Cochez 'Garde-meubles' dans votre demande et précisez la durée souhaitée.",
    category: 'stockage'
  },
  {
    keywords: ['étudiant', 'réduction', 'promo', 'moins cher', 'économie'],
    response: "Pour économiser: déménagez en semaine (moins cher que le weekend), emballez vous-même, comparez les 3 devis reçus. Les trajets de retour peuvent offrir jusqu'à 30% de réduction! Surveillez aussi nos promotions saisonnières.",
    category: 'economie'
  },
  {
    keywords: ['contact', 'joindre', 'appeler', 'téléphone', 'email'],
    response: "Vous pouvez nous joindre par:\n📞 Téléphone: 01 234 567 89 (Lun-Ven 9h-19h, Sam 9h-17h)\n📧 Email: contact@trouveton.fr (Réponse sous 24h)\n💬 Chat: Directement ici!",
    category: 'contact'
  }
];

type SupportChatProps = {
  isOpen?: boolean;
  onClose?: () => void;
  hideButton?: boolean;
};

export function SupportChat({ isOpen: controlledIsOpen, onClose, hideButton = false }: SupportChatProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onClose ? () => onClose() : setInternalIsOpen;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          "Bonjour! 👋 Je suis votre assistant virtuel TrouveTonDemenageur. Comment puis-je vous aider aujourd'hui?",
          [
            "Comment obtenir un devis?",
            "Quels sont vos tarifs?",
            "Comment ça marche?",
            "Devenir déménageur partenaire"
          ]
        );
      }, 500);
    }
  }, [isOpen]);

  const addMessage = (text: string, sender: 'bot' | 'user', options?: string[]) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, message]);
  };

  const addBotMessage = (text: string, options?: string[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(text, 'bot', options);
    }, 800);
  };

  const findBestResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    const scores = knowledgeBase.map(item => {
      const matchCount = item.keywords.filter(keyword =>
        lowerInput.includes(keyword)
      ).length;
      return { item, score: matchCount };
    });

    const bestMatch = scores.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    if (bestMatch.score > 0) {
      return bestMatch.item.response;
    }

    if (lowerInput.includes('bonjour') || lowerInput.includes('salut') || lowerInput.includes('hello')) {
      return "Bonjour! Ravi de vous aider. Que souhaitez-vous savoir sur nos services de déménagement?";
    }

    if (lowerInput.includes('merci')) {
      return "De rien! Je suis là pour vous aider. N'hésitez pas si vous avez d'autres questions!";
    }

    if (lowerInput.includes('aide') || lowerInput.includes('besoin')) {
      return "Je suis là pour répondre à toutes vos questions sur le déménagement! Vous pouvez me poser des questions sur: les prix, les devis, les assurances, les délais, ou comment devenir partenaire.";
    }

    return "Je ne suis pas sûr de comprendre votre question. Pourriez-vous reformuler? Vous pouvez me demander des informations sur:\n• Les tarifs et devis\n• Les assurances et garanties\n• Les délais et réservations\n• Comment devenir déménageur\n• Les services proposés\n\nOu contactez directement notre équipe au 01 234 567 89.";
  };

  const handleUserMessage = (text: string) => {
    addMessage(text, 'user');
    setInputValue('');

    const response = findBestResponse(text);
    addBotMessage(response);
  };

  const handleOptionClick = (option: string) => {
    handleUserMessage(option);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      handleUserMessage(inputValue);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(true);
    }
  };

  return (
    <>
      {!isOpen && !hideButton && (
        <button
          onClick={handleOpen}
          className="group relative"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Chat en direct</h3>
          <p className="text-gray-700 font-semibold mb-2">Support instantané</p>
          <p className="text-sm text-gray-600">Réponse immédiate</p>
          <p className="text-sm text-gray-600">7j/7 - 24h/24</p>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[700px] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Assistant Support</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-blue-100 text-sm">En ligne - Réponse instantanée</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {message.sender === 'bot' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Support</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                      <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {message.options && message.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-2">
                      {message.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleOptionClick(option)}
                          className="bg-white hover:bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-full border border-blue-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t-2 border-gray-100">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Posez votre question..."
                  disabled={isTyping}
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Appuyez sur Entrée pour envoyer
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
