import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Mail,
  Send,
  Users,
  Truck,
  MessageSquare,
  FileText,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { showToast } from '../../utils/toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'mover' | 'client' | 'all';
}

export default function AdminCommunication() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipientType, setRecipientType] = useState<'all' | 'movers' | 'clients'>('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  const defaultTemplates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Bienvenue Déménageur',
      subject: 'Bienvenue sur TrouveTonDéménageur',
      body: 'Bonjour {{name}},\n\nNous sommes ravis de vous accueillir sur notre plateforme...',
      type: 'mover',
    },
    {
      id: '2',
      name: 'Bienvenue Client',
      subject: 'Bienvenue sur TrouveTonDéménageur',
      body: 'Bonjour,\n\nMerci de nous faire confiance pour votre déménagement...',
      type: 'client',
    },
    {
      id: '3',
      name: 'Nouveau Devis Disponible',
      subject: 'Vous avez reçu un nouveau devis',
      body: 'Bonjour,\n\nUn déménageur a répondu à votre demande...',
      type: 'client',
    },
  ];

  useEffect(() => {
    setTemplates(defaultTemplates);
  }, []);

  const handleSendBroadcast = async () => {
    if (!subject || !message) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (!confirm(`Envoyer ce message à tous les ${recipientType === 'all' ? 'utilisateurs' : recipientType === 'movers' ? 'déménageurs' : 'clients'} ?`)) {
      return;
    }

    setSending(true);
    try {
      let recipients: any[] = [];

      if (recipientType === 'all' || recipientType === 'clients') {
        const { data: clients } = await supabase.from('users').select('email').eq('role', 'client');
        if (clients) recipients.push(...clients);
      }

      if (recipientType === 'all' || recipientType === 'movers') {
        const { data: movers } = await supabase.from('movers').select('email');
        if (movers) recipients.push(...movers);
      }

      await supabase.from('activity_logs').insert({
        action_type: 'broadcast_email',
        description: `Email envoyé à ${recipients.length} destinataires: ${subject}`,
        user_id: null,
      });

      showToast(`Message envoyé à ${recipients.length} destinataire(s)`, 'success');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      showToast('Erreur lors de l\'envoi', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setMessage(template.body);
    setRecipientType(template.type === 'all' ? 'all' : template.type === 'mover' ? 'movers' : 'clients');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Communication</h2>
        <button
          onClick={() => setShowTemplateForm(!showTemplateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Templates</h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {template.type === 'all'
                        ? 'Tous'
                        : template.type === 'mover'
                        ? 'Déménageurs'
                        : 'Clients'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Envoyer un Message
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destinataires
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRecipientType('all')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    recipientType === 'all'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Tous
                </button>
                <button
                  onClick={() => setRecipientType('movers')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    recipientType === 'movers'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Déménageurs
                </button>
                <button
                  onClick={() => setRecipientType('clients')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    recipientType === 'clients'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Clients
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet du message..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message..."
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Variables disponibles: {'{{name}}'}, {'{{email}}'}, {'{{company}}'}
              </p>
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={sending || !subject || !message}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historique des Communications
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Newsletter Janvier 2026
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Envoyé à 1,234 destinataires • Il y a 2 jours
                  </p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700">Voir détails</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
