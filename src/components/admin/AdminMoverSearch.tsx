import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Truck, Phone, Mail, FileText, MapPin, CheckCircle, Clock, XCircle, Eye, X, Loader2, AlertCircle, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MoverDetailModal from './MoverDetailModal';

interface MoverResult {
  id: string;
  user_id: string;
  company_name: string;
  siret: string;
  email: string;
  phone: string;
  manager_firstname: string;
  manager_lastname: string;
  manager_phone: string;
  city: string;
  postal_code: string;
  verification_status: string;
  is_active: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  created_at: string;
}

export default function AdminMoverSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'email' | 'phone' | 'siret'>('all');
  const [allMovers, setAllMovers] = useState<MoverResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMover, setViewingMover] = useState<string | null>(null);

  // Load all movers once (same pattern as AdminUserManagement)
  const loadMovers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('id, user_id, company_name, siret, email, phone, manager_firstname, manager_lastname, manager_phone, city, postal_code, verification_status, is_active, is_suspended, is_banned, created_at')
        .order('company_name', { ascending: true });

      if (error) {
        console.error('Error loading movers:', error);
        setAllMovers([]);
      } else {
        setAllMovers(data || []);
      }
    } catch (err) {
      console.error('Error loading movers:', err);
      setAllMovers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovers();
  }, [loadMovers]);

  // Client-side filtering — fast and reliable
  const filteredResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) return [];

    const termClean = term.replace(/\s/g, '');

    return allMovers.filter((mover) => {
      const companyName = (mover.company_name || '').toLowerCase();
      const firstName = (mover.manager_firstname || '').toLowerCase();
      const lastName = (mover.manager_lastname || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const email = (mover.email || '').toLowerCase();
      const phone = (mover.phone || '').toLowerCase();
      const phoneClean = phone.replace(/\s/g, '');
      const managerPhone = (mover.manager_phone || '').toLowerCase();
      const managerPhoneClean = managerPhone.replace(/\s/g, '');
      const siret = (mover.siret || '').toLowerCase().replace(/\s/g, '');

      switch (searchField) {
        case 'name':
          return companyName.includes(term) || firstName.includes(term) || lastName.includes(term) || fullName.includes(term);
        case 'email':
          return email.includes(term);
        case 'phone':
          return phone.includes(term) || phoneClean.includes(termClean) || managerPhone.includes(term) || managerPhoneClean.includes(termClean);
        case 'siret':
          return siret.includes(termClean);
        default: // 'all'
          return (
            companyName.includes(term) ||
            firstName.includes(term) ||
            lastName.includes(term) ||
            fullName.includes(term) ||
            email.includes(term) ||
            phone.includes(term) ||
            phoneClean.includes(termClean) ||
            managerPhone.includes(term) ||
            managerPhoneClean.includes(termClean) ||
            siret.includes(termClean)
          );
      }
    });
  }, [searchTerm, searchField, allMovers]);

  const hasSearched = searchTerm.trim().length >= 2;

  const getStatusBadge = (mover: MoverResult) => {
    if (mover.is_banned) return { label: 'Banni', color: 'bg-red-100 text-red-700', icon: XCircle };
    if (mover.is_suspended) return { label: 'Suspendu', color: 'bg-orange-100 text-orange-700', icon: AlertCircle };
    if (mover.verification_status === 'verified') return { label: 'Vérifié', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    if (mover.verification_status === 'rejected') return { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle };
    return { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
  };

  const searchFields = [
    { value: 'all', label: 'Tous les champs' },
    { value: 'name', label: 'Nom / Société' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'siret', label: 'SIRET / KBIS' },
  ];

  const highlightMatch = (text: string) => {
    if (!searchTerm.trim() || !text) return text;
    try {
      const regex = new RegExp(`(${searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark> : part
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Rechercher un déménageur</h2>
              <p className="text-sm text-gray-500">
                {loading ? 'Chargement...' : `${allMovers.length} déménageur${allMovers.length > 1 ? 's' : ''} enregistré${allMovers.length > 1 ? 's' : ''}`}
                {' — '}Recherchez par nom, email, téléphone ou SIRET
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {searchFields.map((field) => (
              <button
                key={field.value}
                onClick={() => setSearchField(field.value as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  searchField === field.value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {field.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition"
              placeholder={
                searchField === 'name' ? 'Nom de l\'entreprise ou du responsable...'
                : searchField === 'email' ? 'Adresse email...'
                : searchField === 'phone' ? 'Numéro de téléphone...'
                : searchField === 'siret' ? 'Numéro SIRET...'
                : 'Nom, email, téléphone ou SIRET...'
              }
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <p className="text-sm text-gray-400 text-center">Tapez au moins 2 caractères pour rechercher</p>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-500">Chargement des déménageurs...</span>
        </div>
      )}

      {/* No results */}
      {!loading && hasSearched && filteredResults.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun déménageur trouvé</h3>
          <p className="text-gray-500">Aucun résultat pour « {searchTerm} ». Essayez avec d'autres mots-clés ou changez le filtre.</p>
        </div>
      )}

      {/* Results */}
      {!loading && filteredResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium px-1">
            {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''} trouvé{filteredResults.length > 1 ? 's' : ''}
          </p>

          <div className="grid gap-3">
            {filteredResults.map((mover) => {
              const status = getStatusBadge(mover);
              const StatusIcon = status.icon;
              return (
                <div
                  key={mover.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <h3 className="font-bold text-gray-900 text-lg truncate">
                          {highlightMatch(mover.company_name)}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        {(mover.manager_firstname || mover.manager_lastname) && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {highlightMatch(`${mover.manager_firstname || ''} ${mover.manager_lastname || ''}`.trim())}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{highlightMatch(mover.email)}</span>
                        </div>
                        {mover.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{highlightMatch(mover.phone)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>SIRET: {highlightMatch(mover.siret)}</span>
                        </div>
                        {mover.city && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{mover.postal_code} {mover.city}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setViewingMover(mover.user_id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-medium text-sm transition"
                      >
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Initial state — no search yet */}
      {!loading && !hasSearched && allMovers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">Commencez à taper pour rechercher</h3>
          <p className="text-gray-400 text-sm mt-1">Recherchez parmi {allMovers.length} déménageurs enregistrés</p>
        </div>
      )}

      {/* Mover Detail Modal */}
      {viewingMover && (
        <MoverDetailModal
          moverId={viewingMover}
          onClose={() => setViewingMover(null)}
          onUpdate={() => loadMovers()}
        />
      )}
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
