import { useState, useEffect } from 'react';
import { Clock, Eye, RefreshCw, CheckCircle, XCircle, Building, Mail, Phone, Search, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import { PendingMoverDetailModal } from './PendingMoverDetailModal';

interface PendingMover {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  city: string;
  manager_firstname: string;
  manager_lastname: string;
  verification_status: string;
  invitation_source: string | null;
  vehicle_ownership: string | null;
  created_at: string;
}

export default function AdminPendingMovers() {
  const [movers, setMovers] = useState<PendingMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMoverId, setSelectedMoverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadMovers(); }, []);

  const loadMovers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('movers')
      .select('id, company_name, email, phone, city, manager_firstname, manager_lastname, verification_status, invitation_source, vehicle_ownership, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) { showToast('Erreur chargement', 'error'); }
    setMovers((data || []).filter(m => !m.email?.endsWith('@trouveton.fr')));
    setLoading(false);
  };

  const filtered = movers.filter(m => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return m.company_name.toLowerCase().includes(lower) || m.email.toLowerCase().includes(lower) || (m.city || '').toLowerCase().includes(lower);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="w-6 h-6 text-amber-600" /> Déménageurs en Attente</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{movers.length} déménageur(s) en attente de validation</p>
        </div>
        <button onClick={loadMovers} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom, email, ville..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{movers.length === 0 ? 'Aucun déménageur en attente' : 'Aucun résultat'}</h3>
          <p className="text-sm text-gray-500 mt-1">{movers.length === 0 ? 'Tous les déménageurs ont été traités ! 🎉' : 'Modifiez votre recherche'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(mover => (
            <div key={mover.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{mover.company_name}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700">
                      <Clock className="w-3 h-3" /> En attente
                    </span>
                    {mover.invitation_source === 'import' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        Via invitation
                      </span>
                    )}
                    {mover.vehicle_ownership === 'rents' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                        <Truck className="w-3 h-3" /> Loue véhicule
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{mover.email}</span>
                    {mover.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{mover.phone}</span>}
                    {mover.city && <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{mover.city}</span>}
                    <span className="text-gray-400 text-xs">Inscrit le {new Date(mover.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedMoverId(mover.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex-shrink-0">
                  <Eye className="w-4 h-4" /> Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMoverId && (
        <PendingMoverDetailModal
          moverId={selectedMoverId}
          onClose={() => setSelectedMoverId(null)}
          onStatusUpdate={loadMovers}
        />
      )}
    </div>
  );
}
