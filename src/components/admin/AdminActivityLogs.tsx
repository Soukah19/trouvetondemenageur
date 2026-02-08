import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, RefreshCw, Filter, Calendar, User, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id?: string;
  action_type: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export default function AdminActivityLogs() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');

  useEffect(() => {
    loadActivities();
  }, [dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [activities, filterType]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(dateFilter);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', dateThreshold.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      setActivities(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterType === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(a => a.action_type.includes(filterType)));
    }
  };

  const getSeverityIcon = (actionType: string) => {
    if (actionType.includes('fraud') || actionType.includes('suspend') || actionType.includes('ban')) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    if (actionType.includes('approve') || actionType.includes('complete') || actionType.includes('verified')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  const getSeverityBg = (actionType: string) => {
    if (actionType.includes('fraud') || actionType.includes('suspend') || actionType.includes('ban')) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
    if (actionType.includes('approve') || actionType.includes('complete') || actionType.includes('verified')) {
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const actionTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'user', label: 'Utilisateurs' },
    { value: 'payment', label: 'Paiements' },
    { value: 'quote', label: 'Devis' },
    { value: 'verify', label: 'Vérifications' },
    { value: 'fraud', label: 'Fraude' },
    { value: 'system', label: 'Système' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logs d'Activité</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historique des actions sur la plateforme
          </p>
        </div>
        <button
          onClick={loadActivities}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Type d'action
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="1">Dernières 24h</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Activités Récentes
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredActivities.length} résultat(s)
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 border-l-4 ${getSeverityBg(activity.action_type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action_type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(activity.created_at).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                    {activity.user_id && (
                      <div className="flex items-center gap-2 mt-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {activity.user_id}
                        </span>
                      </div>
                    )}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                          Voir les détails
                        </summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Aucune activité trouvée pour les filtres sélectionnés
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
