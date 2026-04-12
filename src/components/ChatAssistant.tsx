import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, MapPin, Loader2 } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
};

type AddressData = {
  from_address: string;
  from_city: string;
  from_postal_code: string;
  floor_from: number;
  elevator_from: boolean;
  elevator_capacity_from: string;
  to_address: string;
  to_city: string;
  to_postal_code: string;
  floor_to: number;
  elevator_to: boolean;
  elevator_capacity_to: string;
};

type ChatAssistantProps = {
  onComplete: (data: AddressData) => void;
  initialData?: Partial<AddressData>;
};

type ConversationStep =
  | 'welcome'
  | 'from_address'
  | 'from_floor'
  | 'from_elevator'
  | 'from_elevator_capacity'
  | 'to_address'
  | 'to_floor'
  | 'to_elevator'
  | 'to_elevator_capacity'
  | 'complete';

export function ChatAssistant({ onComplete, initialData }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>('welcome');
  const [collectedData, setCollectedData] = useState<Partial<AddressData>>(initialData || {});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage("Bonjour! Je suis votre assistant virtuel. Je vais vous aider à remplir les informations de votre déménagement de manière simple et rapide. Commençons!");
      setTimeout(() => {
        addBotMessage("D'où déménagez-vous? Veuillez indiquer votre adresse de départ complète (numéro, rue, ville, code postal).");
        setCurrentStep('from_address');
      }, 1000);
    }
  }, [isOpen]);

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(text, 'bot');
    }, 800);
  };

  const parseAddress = (input: string) => {
    const postalCodeMatch = input.match(/\b\d{5}\b/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';

    const parts = input.split(',').map(p => p.trim());
    let address = '';
    let city = '';

    if (parts.length >= 2) {
      address = parts.slice(0, -1).join(', ');
      city = parts[parts.length - 1].replace(/\d{5}/, '').trim();
    } else {
      const withoutPostal = input.replace(/\b\d{5}\b/, '').trim();
      const words = withoutPostal.split(' ');
      if (words.length > 2) {
        address = words.slice(0, -1).join(' ');
        city = words[words.length - 1];
      } else {
        address = withoutPostal;
      }
    }

    return { address, city, postalCode };
  };

  const handleUserMessage = (text: string) => {
    addMessage(text, 'user');
    setInputValue('');
    processUserInput(text);
  };

  const processUserInput = (input: string) => {
    const lowerInput = input.toLowerCase().trim();

    switch (currentStep) {
      case 'from_address': {
        const { address, city, postalCode } = parseAddress(input);

        if (!postalCode || postalCode.length !== 5) {
          addBotMessage("Je n'ai pas trouvé de code postal valide. Pouvez-vous me donner une adresse complète avec le code postal? Par exemple: '15 rue de la Paix, Paris, 75001'");
          return;
        }

        setCollectedData(prev => ({
          ...prev,
          from_address: address,
          from_city: city,
          from_postal_code: postalCode
        }));

        addBotMessage(`Parfait! Adresse de départ: ${address}, ${city} ${postalCode}`);
        setTimeout(() => {
          addBotMessage("À quel étage se trouve votre logement actuel? (Répondez 0 pour rez-de-chaussée)");
          setCurrentStep('from_floor');
        }, 1000);
        break;
      }

      case 'from_floor': {
        const floor = parseInt(input);
        if (isNaN(floor) || floor < 0) {
          addBotMessage("Veuillez entrer un numéro d'étage valide (0 pour rez-de-chaussée).");
          return;
        }

        setCollectedData(prev => ({ ...prev, floor_from: floor }));
        addBotMessage(`Étage ${floor} noté!`);

        if (floor > 0) {
          setTimeout(() => {
            addBotMessage("Y a-t-il un ascenseur disponible? (Répondez oui ou non)");
            setCurrentStep('from_elevator');
          }, 800);
        } else {
          setTimeout(() => {
            addBotMessage("Très bien! Maintenant, où déménagez-vous? Veuillez indiquer votre adresse d'arrivée complète.");
            setCurrentStep('to_address');
          }, 800);
        }
        break;
      }

      case 'from_elevator': {
        const hasElevator = lowerInput.includes('oui') || lowerInput.includes('yes');
        setCollectedData(prev => ({ ...prev, elevator_from: hasElevator }));

        if (hasElevator) {
          addBotMessage("Super! Quelle est la capacité de l'ascenseur? (2-3 pers / 3-4 pers / 4-5 pers / 6+ pers)");
          setCurrentStep('from_elevator_capacity');
        } else {
          addBotMessage("D'accord, pas d'ascenseur.");
          setTimeout(() => {
            addBotMessage("Très bien! Maintenant, où déménagez-vous? Veuillez indiquer votre adresse d'arrivée complète.");
            setCurrentStep('to_address');
          }, 800);
        }
        break;
      }

      case 'from_elevator_capacity': {
        let capacity = '';
        if (lowerInput.includes('2-3') || lowerInput.includes('2') || lowerInput.includes('petit')) {
          capacity = '2-3 pers';
        } else if (lowerInput.includes('3-4') || lowerInput.includes('3') || lowerInput.includes('moyen')) {
          capacity = '3-4 pers';
        } else if (lowerInput.includes('4-5') || lowerInput.includes('4')) {
          capacity = '4-5 pers';
        } else if (lowerInput.includes('6') || lowerInput.includes('grand')) {
          capacity = '6+ pers';
        } else {
          addBotMessage("Je n'ai pas compris. Veuillez choisir parmi: 2-3 pers, 3-4 pers, 4-5 pers, ou 6+ pers");
          return;
        }

        setCollectedData(prev => ({ ...prev, elevator_capacity_from: capacity }));
        addBotMessage(`Capacité notée: ${capacity}`);
        setTimeout(() => {
          addBotMessage("Très bien! Maintenant, où déménagez-vous? Veuillez indiquer votre adresse d'arrivée complète.");
          setCurrentStep('to_address');
        }, 800);
        break;
      }

      case 'to_address': {
        const { address, city, postalCode } = parseAddress(input);

        if (!postalCode || postalCode.length !== 5) {
          addBotMessage("Je n'ai pas trouvé de code postal valide. Pouvez-vous me donner une adresse complète avec le code postal?");
          return;
        }

        setCollectedData(prev => ({
          ...prev,
          to_address: address,
          to_city: city,
          to_postal_code: postalCode
        }));

        addBotMessage(`Parfait! Adresse d'arrivée: ${address}, ${city} ${postalCode}`);
        setTimeout(() => {
          addBotMessage("À quel étage se trouve votre nouveau logement? (0 pour rez-de-chaussée)");
          setCurrentStep('to_floor');
        }, 1000);
        break;
      }

      case 'to_floor': {
        const floor = parseInt(input);
        if (isNaN(floor) || floor < 0) {
          addBotMessage("Veuillez entrer un numéro d'étage valide (0 pour rez-de-chaussée).");
          return;
        }

        setCollectedData(prev => ({ ...prev, floor_to: floor }));
        addBotMessage(`Étage ${floor} noté!`);

        if (floor > 0) {
          setTimeout(() => {
            addBotMessage("Y a-t-il un ascenseur disponible à cette adresse? (Répondez oui ou non)");
            setCurrentStep('to_elevator');
          }, 800);
        } else {
          completeConversation({ ...collectedData, floor_to: floor } as AddressData);
        }
        break;
      }

      case 'to_elevator': {
        const hasElevator = lowerInput.includes('oui') || lowerInput.includes('yes');
        setCollectedData(prev => ({ ...prev, elevator_to: hasElevator }));

        if (hasElevator) {
          addBotMessage("Parfait! Quelle est la capacité de l'ascenseur? (2-3 pers / 3-4 pers / 4-5 pers / 6+ pers)");
          setCurrentStep('to_elevator_capacity');
        } else {
          addBotMessage("D'accord, pas d'ascenseur.");
          completeConversation({ ...collectedData, elevator_to: hasElevator } as AddressData);
        }
        break;
      }

      case 'to_elevator_capacity': {
        let capacity = '';
        if (lowerInput.includes('2-3') || lowerInput.includes('2') || lowerInput.includes('petit')) {
          capacity = '2-3 pers';
        } else if (lowerInput.includes('3-4') || lowerInput.includes('3') || lowerInput.includes('moyen')) {
          capacity = '3-4 pers';
        } else if (lowerInput.includes('4-5') || lowerInput.includes('4')) {
          capacity = '4-5 pers';
        } else if (lowerInput.includes('6') || lowerInput.includes('grand')) {
          capacity = '6+ pers';
        } else {
          addBotMessage("Je n'ai pas compris. Veuillez choisir parmi: 2-3 pers, 3-4 pers, 4-5 pers, ou 6+ pers");
          return;
        }

        setCollectedData(prev => ({ ...prev, elevator_capacity_to: capacity }));
        completeConversation({ ...collectedData, elevator_capacity_to: capacity } as AddressData);
        break;
      }
    }
  };

  const completeConversation = (data: AddressData) => {
    addBotMessage("Excellent! J'ai toutes les informations nécessaires. Les données ont été ajoutées à votre formulaire. Vous pouvez maintenant continuer à remplir les autres détails de votre déménagement.");
    setCurrentStep('complete');
    setTimeout(() => {
      onComplete(data);
      setIsOpen(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      handleUserMessage(inputValue);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-3 w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-lg">Assistant virtuel intelligent</div>
            <div className="text-blue-100 text-sm">Laissez-moi vous guider pour remplir les adresses</div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Assistant Déménagement</h3>
                  <p className="text-blue-100 text-sm">En ligne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                    }`}
                  >
                    {message.sender === 'bot' && (
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">Assistant</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tapez votre réponse..."
                  disabled={isTyping || currentStep === 'complete'}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping || currentStep === 'complete'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
