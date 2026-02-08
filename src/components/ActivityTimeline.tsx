import { useState, useEffect } from 'react';
import { Clock, Package, Euro, CheckCircle, MessageSquare, Star, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';

interface TimelineActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface ActivityTimelineProps {
  userId: string;
  quoteRequestId?: string;
}

const activityConfig = {
  quote_created: {
    icon: Package,
    color: 'text-blue-600 bg-blue-50',
    label: 'Demande de devis'
  },
  bid_received: {
    icon: Euro,
    color: 'text-green-600 bg-green-50',
    label: 'Devis reçu'
  },
  bid_accepted: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
    label: 'Devis accepté'
  },
  payment_made: {
    icon: Euro,
    color: 'text-purple-600 bg-purple-50',
    label: 'Paiement effectué'
  },
  message_sent: {
    icon: MessageSquare,
    color: 'text-blue-600 bg-blue-50',
    label: 'Message envoyé'
  },
  review_posted: {
    icon: Star,
    color: 'text-yellow-600 bg-yellow-50',
    label: 'Avis publié'
  },
  damage_reported: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50',
    label: 'Dommage signalé'
  },
  move_completed: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
    label: 'Déménagement terminé'
  }
};

export default function ActivityTimeline({ userId, quoteRequestId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [userId, quoteRequestId]);

  async function loadActivities() {
    try {
      let query = supabase
        .from('activity_timeline')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (quoteRequestId) {
        query = query.eq('quote_request_id', quoteRequestId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Aucune activité pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Historique d'activité</h3>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-6">
          {activities.map((activity) => {
            const config = activityConfig[activity.activity_type as keyof typeof activityConfig] || {
              icon: Clock,
              color: 'text-gray-600 bg-gray-50',
              label: 'Activité'
            };
            const Icon = config.icon;

            return (
              <div key={activity.id} className="relative flex gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.color} z-10`}
                >
                  <Icon size={20} />
                </div>

                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {config.label}
                    </span>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {activity.description}
                    </p>
                  )}

                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500 dark:text-gray-400">{key}:</span>{' '}
                            <span className="text-gray-900 dark:text-white font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
