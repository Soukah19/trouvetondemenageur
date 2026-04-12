import { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MoverLayout } from '../components/MoverLayout';

interface Moving {
  id: string;
  quote_request_id: string;
  from_address: string;
  from_city: string;
  to_address: string;
  to_city: string;
  moving_date: string;
  status: string;
  client_name: string;
  client_phone: string;
  started_at: string | null;
  completed_at: string | null;
}

export default function MoverMovingsList({ onSelectMoving  }: any) {
  const { user } = useAuth();
  const [movings, setMovings] = useState<Moving[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'in_progress' | 'upcoming' | 'completed'>('in_progress');

  useEffect(() => {
    fetchMovings();
  }, [user, filter]);

  const fetchMovings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: moverData } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!moverData) {
        setLoading(false);
        return;
      }

      const { data: quotesData } = await supabase
        .from('quotes')
        .select('quote_request_id')
        .eq('mover_id', moverData.id)
        .eq('status', 'accepted');

      if (!quotesData || quotesData.length === 0) {
        setMovings([]);
        setLoading(false);
        return;
      }

      const quoteRequestIds = quotesData.map(q => q.quote_request_id);

      const { data: quoteRequestsData } = await supabase
        .from('quote_requests_with_privacy')
        .select(`
          id,
          from_address,
          from_city,
          to_address,
          to_city,
          moving_date,
          client_name,
          client_phone,
          is_data_masked
        `)
        .in('id', quoteRequestIds)
        .eq('status', 'accepted')
        .order('moving_date', { ascending: true });

      if (!quoteRequestsData) {
        setMovings([]);
        setLoading(false);
        return;
      }

      const quoteRequestIdsForStatus = quoteRequestsData.map(qr => qr.id);

      const { data: statusData } = await supabase
        .from('moving_status')
        .select('*')
        .in('quote_request_id', quoteRequestIdsForStatus);

      const movingsWithStatus = quoteRequestsData.map(qr => {
        const status = statusData?.find(s => s.quote_request_id === qr.id);

        return {
          id: qr.id,
          quote_request_id: qr.id,
          from_address: qr.from_address,
          from_city: qr.from_city,
          to_address: qr.to_address,
          to_city: qr.to_city,
          moving_date: qr.moving_date,
          status: status?.status || 'confirmed',
          client_name: qr.client_name,
          client_phone: qr.client_phone,
          started_at: status?.started_at || null,
          completed_at: status?.completed_at || null,
        };
      });

      const filtered = movingsWithStatus.filter(m => {
        if (filter === 'in_progress') {
          return m.status !== 'completed' && m.status !== 'confirmed';
        } else if (filter === 'upcoming') {
          return m.status === 'confirmed';
        } else {
          return m.status === 'completed';
        }
      });

      setMovings(filtered);
    } catch (error) {
      console.error('Error fetching movings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmé', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'before_photos_uploaded':
        return { label: 'Photos avant', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle };
      case 'in_transit':
        return { label: 'En transit', color: 'bg-yellow-100 text-yellow-800', icon: Truck };
      case 'loading_photos_uploaded':
        return { label: 'Chargement OK', color: 'bg-purple-100 text-purple-800', icon: CheckCircle };
      case 'arrived':
        return { label: 'Arrivé', color: 'bg-green-100 text-green-800', icon: MapPin };
      case 'unloading_photos_uploaded':
        return { label: 'Déchargement OK', color: 'bg-teal-100 text-teal-800', icon: CheckCircle };
      case 'completed':
        return { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: CheckCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  if (loading) {
    return (
      <MoverLayout activeSection="tracking" title="Mes déménagements">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout activeSection="tracking" title="Mes déménagements">

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mes déménagements</h1>
          <p className="text-sm text-gray-600">Suivi en temps réel</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('in_progress')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Terminés
            </button>
          </div>
        </div>

        {movings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun déménagement</h3>
            <p className="text-gray-600">
              {filter === 'in_progress' && 'Vous n\'avez aucun déménagement en cours actuellement.'}
              {filter === 'upcoming' && 'Vous n\'avez aucun déménagement à venir.'}
              {filter === 'completed' && 'Vous n\'avez aucun déménagement terminé.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {movings.map((moving) => {
              const statusInfo = getStatusInfo(moving.status);
              const StatusIcon = statusInfo.icon;

              return (
                <button
                  key={moving.id}
                  onClick={() => onSelectMoving(moving.quote_request_id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{moving.client_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{moving.client_phone}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Départ</p>
                        <p className="text-sm text-gray-600">{moving.from_address}, {moving.from_city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Arrivée</p>
                        <p className="text-sm text-gray-600">{moving.to_address}, {moving.to_city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(moving.moving_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    {moving.started_at && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <p className="text-sm text-gray-600">
                          Démarré le {new Date(moving.started_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MoverLayout>
  );
}
