import { useState, useEffect } from 'react';
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  User,
  Package,
  AlertCircle,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface Mission {
  id: string;
  client_name: string;
  client_email: string;
  from_city: string;
  from_postal_code: string;
  to_city: string;
  to_postal_code: string;
  moving_date: string;
  status: string;
  payment_status: string;
  volume_m3: number;
  accepted_quote_id: string;
  created_at: string;
  mover_company_name?: string;
  mover_email?: string;
  quote_price?: number;
  payment_id?: string;
  mission_completion_status?: string;
  mission_completion_date?: string;
}

type AdminMissionsProps = {
  adminRole: string;
};

export default function AdminMissions({ adminRole }: AdminMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);

      // Charger toutes les demandes acceptées ou terminées avec paiement
      const { data: quoteRequests, error: qrError } = await supabase
        .from('quote_requests')
        .select('*')
        .in('status', ['accepted', 'completed'])
        .order('created_at', { ascending: false });

      if (qrError) throw qrError;

      if (!quoteRequests || quoteRequests.length === 0) {
        setMissions([]);
        return;
      }

      // Enrichir avec les données du déménageur et du paiement
      const enrichedMissions = await Promise.all(
        quoteRequests.map(async (qr) => {
          // Récupérer le devis accepté
          const { data: quote } = await supabase
            .from('quotes')
            .select('id, price, mover_id')
            .eq('id', qr.accepted_quote_id)
            .maybeSingle();

          if (!quote) {
            return {
              ...qr,
              mover_company_name: 'N/A',
              mover_email: 'N/A',
              quote_price: 0
            };
          }

          // Récupérer les infos du déménageur
          const { data: mover } = await supabase
            .from('movers')
            .select('company_name, email')
            .eq('id', quote.mover_id)
            .maybeSingle();

          // Récupérer le paiement
          const { data: payment } = await supabase
            .from('payments')
            .select('id, mission_completion_status, mission_completion_date')
            .eq('quote_request_id', qr.id)
            .maybeSingle();

          return {
            ...qr,
            mover_company_name: mover?.company_name || 'N/A',
            mover_email: mover?.email || 'N/A',
            quote_price: quote.price,
            payment_id: payment?.id,
            mission_completion_status: payment?.mission_completion_status,
            mission_completion_date: payment?.mission_completion_date
          };
        })
      );

      setMissions(enrichedMissions);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      showToast('Erreur lors du chargement des missions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMissionStatus = (mission: Mission): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
    if (mission.status === 'cancelled') return 'cancelled';
    // Match the actual status values set by MissionCompletionButton
    if (mission.mission_completion_status === 'approved' || mission.mission_completion_status === 'completed') return 'completed';
    if (mission.mission_completion_status === 'completed_pending_review') return 'completed';
    if (mission.mission_completion_status === 'pending_validation' || mission.mission_completion_status === 'in_progress') return 'in_progress';
    // Also check quote_requests status
    if (mission.status === 'completed') return 'completed';
    if (mission.payment_status === 'fully_paid' || mission.payment_status === 'deposit_paid') {
      // Si la date est passée et pas encore marquée comme terminée
      const movingDate = new Date(mission.moving_date);
      const today = new Date();
      if (movingDate < today) {
        return 'in_progress';
      }
      return 'pending';
    }
    return 'pending';
  };

  const getFilteredMissions = () => {
    if (filter === 'all') return missions;
    return missions.filter(m => getMissionStatus(m) === filter);
  };

  const filteredMissions = getFilteredMissions();

  const stats = {
    total: missions.length,
    pending: missions.filter(m => getMissionStatus(m) === 'pending').length,
    in_progress: missions.filter(m => getMissionStatus(m) === 'in_progress').length,
    completed: missions.filter(m => getMissionStatus(m) === 'completed').length,
    cancelled: missions.filter(m => getMissionStatus(m) === 'cancelled').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            En attente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Activity className="w-4 h-4 mr-1" />
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Terminée
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Annulée
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Missions</h2>
        <p className="text-gray-600">Vue d'ensemble de toutes les missions de déménagement</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Truck className="w-8 h-8 text-blue-600" />
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Missions</p>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'pending'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          <p className="text-sm text-gray-600">En Attente</p>
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'in_progress'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.in_progress}</p>
          <p className="text-sm text-gray-600">En Cours</p>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'completed'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          <p className="text-sm text-gray-600">Terminées</p>
        </button>

        <button
          onClick={() => setFilter('cancelled')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'cancelled'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
          <p className="text-sm text-gray-600">Annulées</p>
        </button>
      </div>

      {/* Liste des missions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filter === 'all' ? 'Toutes les missions' :
             filter === 'pending' ? 'Missions en attente' :
             filter === 'in_progress' ? 'Missions en cours' :
             filter === 'completed' ? 'Missions terminées' :
             'Missions annulées'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredMissions.length})
            </span>
          </h3>
        </div>

        {filteredMissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune mission dans cette catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {mission.client_name}
                      </h4>
                      {getStatusBadge(getMissionStatus(mission))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          De: <strong>{mission.from_city} ({mission.from_postal_code})</strong>
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Vers: <strong>{mission.to_city} ({mission.to_postal_code})</strong>
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Date: <strong>{new Date(mission.moving_date).toLocaleDateString('fr-FR')}</strong>
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Volume: <strong>{mission.volume_m3}m³</strong>
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Truck className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Déménageur: <strong>{mission.mover_company_name}</strong>
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Prix: <strong>{mission.quote_price?.toFixed(2)} €</strong>
                        </span>
                      </div>
                    </div>

                    {mission.mission_completion_date && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complétée le {new Date(mission.mission_completion_date).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => {
                        // TODO: Ouvrir modal avec détails complets
                        showToast('Fonctionnalité en développement', 'info');
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition"
                      title="Voir les détails"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
