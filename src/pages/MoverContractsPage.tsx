import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Calendar, MapPin, Euro, User, ArrowLeft, Search, Filter, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { generateContractPDF, buildContractPDFData } from '../utils/generateContractPDF';
import { generateInvoicePDF, buildInvoiceData } from '../utils/generateInvoicePDF';
import { MoverLayout } from '../components/MoverLayout';

interface Contract {
  id: string;
  contract_number: string;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  pdf_url: string | null;
  quote_id?: string;
  mover_id?: string;
  contract_data: {
    moving_date: string;
    client: {
      name: string;
      email: string;
      phone: string;
    };
    mover: {
      company_name: string;
      siret: string;
      manager_name: string;
      email: string;
      phone: string;
      address: string;
    };
    departure: {
      address: string;
      city: string;
      postal_code: string;
      floor: number;
      elevator: boolean;
    };
    arrival: {
      address: string;
      city: string;
      postal_code: string;
      floor: number;
      elevator: boolean;
    };
    home_size: string;
    volume_m3: number;
    services: string[];
    financial: {
      total_amount: number;
      deposit_amount: number;
      platform_fee: number;
      mover_deposit: number;
      escrow_amount: number;
      remaining_amount: number;
    };
  };
}

export default function MoverContractsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moverId, setMoverId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMoverId();
    }
  }, [user]);

  useEffect(() => {
    if (moverId) {
      fetchContracts();
    }
  }, [moverId]);

  const fetchMoverId = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setMoverId(data?.id || null);
    } catch (error) {
      console.error('Error fetching mover ID:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('mover_id', moverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showToast('Erreur lors du chargement des contrats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
      disputed: { label: 'Litige', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleDownloadPDF = async (contract: Contract) => {
    showToast('Génération du PDF en cours...', 'info');
    try {
      let quoteRequest = null;
      let moverData = null;
      let payment = null;
      let quote = null;

      if (contract.quote_id) {
        const { data: q } = await supabase
          .from('quotes')
          .select('*, quote_request:quote_requests(*)')
          .eq('id', contract.quote_id)
          .maybeSingle();
        if (q) {
          quote = q;
          quoteRequest = q.quote_request;
        }

        const { data: m } = await supabase
          .from('movers')
          .select('*')
          .eq('id', contract.mover_id || moverId)
          .maybeSingle();
        moverData = m;

        const { data: p } = await supabase
          .from('payments')
          .select('*')
          .eq('quote_id', contract.quote_id)
          .maybeSingle();
        payment = p;
      }

      // contractType 'mover' = shows mover's proposed price only
      const pdfData = buildContractPDFData(contract as any, quoteRequest, quote, moverData, payment, 'mover');
      generateContractPDF(pdfData);
      showToast('PDF téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_data.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_data.departure.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_data.arrival.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalRevenue = contracts
    .filter(c => c.status === 'active' || c.status === 'completed')
    .reduce((sum, c) => sum + (c.contract_data.financial.remaining_amount || 0), 0);

  const totalContracts = contracts.length;

  if (loading) {
    return (
      <MoverLayout activeSection="contracts" title="Mes Contrats">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout activeSection="contracts" title="Mes Contrats">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Contrats</div>
            <div className="text-2xl font-bold text-gray-900">{contracts.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Contrats Actifs</div>
            <div className="text-2xl font-bold text-green-600">
              {contracts.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Revenus à Recevoir</div>
            <div className="text-2xl font-bold text-blue-600">{totalRevenue.toLocaleString('fr-FR')} €</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
                <option value="disputed">Litige</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun contrat</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun contrat ne correspond à vos critères de recherche.'
                : 'Vos contrats apparaîtront ici lorsqu\'un client acceptera votre devis.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.contract_number}
                        </h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(contract.contract_data.moving_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {contract.contract_data.client.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {(contract.contract_data.financial.mover_price || Math.round(contract.contract_data.financial.total_amount / 1.3) || 0).toLocaleString('fr-FR')} € HT
                      </div>
                      <div className="text-xs text-gray-500">Votre devis accepté (HT)</div>
                    </div>
                  </div>

                  {/* Client Contact Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 bg-blue-50 rounded-lg p-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-blue-600" />
                      {contract.contract_data.client.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-blue-600" />
                      {contract.contract_data.client.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{contract.contract_data.departure.city}</span>
                    <span>→</span>
                    <span>{contract.contract_data.arrival.city}</span>
                    {!!contract.contract_data.volume_m3 && (
                      <span className="ml-4 text-gray-400">| {contract.contract_data.volume_m3} m³</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Créé le {new Date(contract.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(contract)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contract Detail Modal */}
        {selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Contrat {selectedContract.contract_number}
                  </h2>
                  <p className="text-gray-600">Détails complets du contrat</p>
                </div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informations Client
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nom:</span>
                      <span className="ml-2 font-medium">{selectedContract.contract_data.client.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Téléphone:</span>
                      <span className="ml-2 font-medium">{selectedContract.contract_data.client.phone}</span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{selectedContract.contract_data.client.email}</span>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">📍 Départ</h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{selectedContract.contract_data.departure.address}</p>
                      <p>{selectedContract.contract_data.departure.postal_code} {selectedContract.contract_data.departure.city}</p>
                      <p className="text-gray-500">
                        Étage: {selectedContract.contract_data.departure.floor || 'RDC'} | 
                        Ascenseur: {selectedContract.contract_data.departure.elevator ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">📍 Arrivée</h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{selectedContract.contract_data.arrival.address}</p>
                      <p>{selectedContract.contract_data.arrival.postal_code} {selectedContract.contract_data.arrival.city}</p>
                      <p className="text-gray-500">
                        Étage: {selectedContract.contract_data.arrival.floor || 'RDC'} | 
                        Ascenseur: {selectedContract.contract_data.arrival.elevator ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial - Mover perspective */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Euro className="w-5 h-5 text-green-600" />
                    Informations Financières
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Votre devis accepté (HT)</span>
                      <span className="font-medium">{(selectedContract.contract_data.financial.mover_price || Math.round(selectedContract.contract_data.financial.total_amount / 1.3)).toLocaleString('fr-FR')} € HT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission payée par le client</span>
                      <span className="font-medium">{selectedContract.contract_data.financial.deposit_amount.toLocaleString('fr-FR')} €</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Solde à recevoir du client</span>
                      <span className="font-bold text-green-700 text-lg">
                        {selectedContract.contract_data.financial.remaining_amount.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Le client vous paiera ce montant directement le jour du déménagement (espèces ou virement)
                    </p>
                  </div>
                </div>

                {/* Services */}
                {selectedContract.contract_data.services && selectedContract.contract_data.services.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Services à fournir</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedContract.contract_data.services.map((service, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleDownloadPDF(selectedContract)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger le contrat PDF
                  </button>
                  <button
                    onClick={() => setSelectedContract(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MoverLayout>
  );
}
