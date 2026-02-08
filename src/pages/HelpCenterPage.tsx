import { Truck, ArrowLeft, Send, Bot, User, Phone, Mail, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

const aiResponses: { [key: string]: string } = {
  'bonjour': 'Bonjour ! Je suis l\'assistant virtuel de TrouveTonDemenageur. Comment puis-je vous aider aujourd\'hui ?',
  'hello': 'Bonjour ! Je suis l\'assistant virtuel de TrouveTonDemenageur. Comment puis-je vous aider aujourd\'hui ?',
  'prix': 'Le prix d\'un déménagement dépend de plusieurs facteurs : volume, distance, étage, et services additionnels. Pour un studio, comptez entre 450€ et 900€. Pour obtenir un devis personnalisé gratuit, vous pouvez faire une demande sur notre plateforme.',
  'devis': 'Vous pouvez obtenir jusqu\'à 3 devis gratuits de déménageurs professionnels certifiés en moins de 24h. Il suffit de remplir notre formulaire en ligne avec les détails de votre déménagement.',
  'ia': 'Notre IA analyse les photos de vos biens prises à trois moments clés : demande de devis, chargement et déchargement. Elle compare ces images pour détecter automatiquement tout dommage et déterminer quand il s\'est produit.',
  'protection': 'Notre système d\'IA offre une protection complète avec un taux de précision de 94%. En cas de dommage, un rapport détaillé est généré automatiquement pour faciliter les démarches avec l\'assurance.',
  'assurance': 'Tous les déménageurs sur notre plateforme sont vérifiés et possèdent une assurance professionnelle valide (RC Pro). De plus, notre IA protège équitablement clients et déménageurs contre les fausses réclamations.',
  'dommage': 'En cas de dommage, vous devez immédiatement créer un rapport via l\'application. Notre IA analysera les photos pour déterminer l\'origine du dommage. Un rapport sera généré automatiquement pour l\'assurance.',
  'paiement': 'Le paiement s\'effectue de manière sécurisée via notre plateforme. Des frais de service sont inclus dans le prix affiché. Vous pouvez payer par carte bancaire.',
  'annulation': 'Vous pouvez annuler gratuitement jusqu\'à 48h avant la date prévue du déménagement. En cas d\'annulation tardive, des frais peuvent s\'appliquer selon les conditions du déménageur.',
  'déménageur': 'Pour devenir déménageur partenaire, inscrivez-vous via notre formulaire. Nous vérifierons vos certifications professionnelles, votre assurance et votre expérience. Une fois validé, vous recevrez des demandes de devis.'
};

export function HelpCenterPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Bonjour ! Je suis votre assistant virtuel. Posez-moi vos questions sur notre service de déménagement.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [showHumanSupport, setShowHumanSupport] = useState(false);

  const findBestMatch = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const [keyword, response] of Object.entries(aiResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return 'Je ne suis pas sûr de bien comprendre votre question. Pourriez-vous la reformuler ou choisir parmi ces sujets : prix, devis, protection IA, assurance, dommages, paiement ?';
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || showHumanSupport) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    if (newQuestionCount >= 5) {
      setTimeout(() => {
        const supportMessage: Message = {
          id: messages.length + 2,
          text: 'Je vois que vous avez beaucoup de questions. Pour un accompagnement personnalisé, je vous propose de vous mettre en contact avec notre équipe support humain.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, supportMessage]);
        setShowHumanSupport(true);
      }, 500);
    } else {
      setTimeout(() => {
        const botResponse = findBestMatch(inputValue);
        const botMessage: Message = {
          id: messages.length + 2,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 800);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464022/pexels-photo-7464022.jpeg?auto=compress&cs=tinysrgb&w=1920)',
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Centre d'Aide
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Assistance instantanée par IA ou support humain
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Assistant IA</h2>
                  <p className="text-blue-100 text-sm">
                    {showHumanSupport ? 'Redirection vers support humain' : `Question ${questionCount}/5`}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto p-8 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className={`max-w-[70%] rounded-2xl px-6 py-4 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!showHumanSupport ? (
              <div className="border-t border-gray-200 p-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Posez votre question..."
                    className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 p-8 bg-blue-50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  Contactez notre support humain
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Téléphone</h4>
                    <p className="text-gray-700 font-semibold mb-1">01 234 567 89</p>
                    <p className="text-sm text-gray-600">Lun-Ven : 9h-19h</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Email</h4>
                    <p className="text-gray-700 font-semibold mb-1">support@trouveton.fr</p>
                    <p className="text-sm text-gray-600">Réponse sous 24h</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/contact')}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                >
                  Envoyer un message détaillé
                </button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Urgence</h3>
              <p className="text-gray-600 text-sm mb-3">Pour les situations urgentes</p>
              <p className="text-blue-600 font-bold">01 234 567 89</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 text-sm mb-3">Réponse sous 24h</p>
              <p className="text-green-600 font-bold text-sm">support@trouveton.fr</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 text-sm mb-3">Disponible 24/7</p>
              <button className="text-orange-600 font-bold text-sm">Démarrer</button>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
