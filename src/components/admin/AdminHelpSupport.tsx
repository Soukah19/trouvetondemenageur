import { Mail, Phone, MessageCircle, Book, FileText, ExternalLink, HelpCircle, ChevronRight } from 'lucide-react';

interface AdminHelpSupportProps {
  onNavigateToUsers?: () => void;
  onNavigateToFinances?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToDisputes?: () => void;
  onNavigateToExports?: () => void;
  onNavigateToPendingApprovals?: () => void;
}

export default function AdminHelpSupport({
  onNavigateToUsers,
  onNavigateToFinances,
  onNavigateToAnalytics,
  onNavigateToDisputes,
  onNavigateToExports,
  onNavigateToPendingApprovals,
}: AdminHelpSupportProps) {
  const supportResources = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Guide complet d\'utilisation de la plateforme',
      action: 'Consulter',
      color: 'bg-blue-500',
    },
    {
      icon: FileText,
      title: 'FAQ Admin',
      description: 'Questions fréquentes sur l\'administration',
      action: 'Voir FAQ',
      color: 'bg-green-500',
    },
    {
      icon: MessageCircle,
      title: 'Chat Support',
      description: 'Discussion en direct avec l\'équipe technique',
      action: 'Démarrer chat',
      color: 'bg-purple-500',
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@trouveton.fr',
      description: 'Réponse sous 24h',
    },
    {
      icon: Phone,
      title: 'Téléphone',
      value: '+33 1 23 45 67 89',
      description: 'Lun-Ven 9h-18h',
    },
  ];

  const quickLinks = [
    {
      label: 'Gérer les utilisateurs',
      onClick: onNavigateToUsers,
    },
    {
      label: 'Approuver un déménageur',
      onClick: onNavigateToPendingApprovals,
    },
    {
      label: 'Débloquer un paiement',
      onClick: onNavigateToFinances,
    },
    {
      label: 'Voir les statistiques',
      onClick: onNavigateToAnalytics,
    },
    {
      label: 'Gérer les litiges',
      onClick: onNavigateToDisputes,
    },
    {
      label: 'Exporter des données',
      onClick: onNavigateToExports,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aide & Support</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ressources et assistance pour les administrateurs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <div
              key={resource.title}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`w-12 h-12 ${resource.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {resource.description}
              </p>
              <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                {resource.action}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Nous Contacter
          </h3>
          <div className="space-y-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.title}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{method.title}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{method.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Liens Rapides
          </h3>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.onClick}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Besoin d'aide immédiate ?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Notre équipe support est disponible pour vous aider à résoudre vos problèmes rapidement.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Contacter le Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
