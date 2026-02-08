import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Calendar, MapPin, Euro, Building2, User, Search, Filter, RefreshCw, Send, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface ContractView {
  id: string;
  contract_number: string;
  status: string;
  created_at: string;
  pdf_url: string | null;
  sent_to_client: boolean;
  sent_to_mover: boolean;
  moving_date: string;
  client_name: string;
  client_email: string;
  mover_company: string;
  mover_email: string;
  from_city: string;
  to_city: string;
  total_amount: number;
  quote_request_id: string;
  mover_id: string;
}

interface ContractDetail {
  id: string;
  contract_number: string;
  status: string;
  created_at: string;
  pdf_url: string | null;
  contract_data: any;
  sent_to_client: boolean;
  sent_to_client_at: string | null;
  sent_to_mover: boolean;
  sent_to_mover_at: string | null;
}

export function AdminContractsPanel() {
  const [contracts, setContracts] = useState<ContractView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<ContractDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Try the view first
      let { data, error } = await supabase
        .from('admin_contracts_view')
        .select('*')
        .order('created_at', { ascending: false });

      // If the view doesn't exist or errors, fall back to contracts table with manual joins
      if (error || !data) {
        console.warn('admin_contracts_view not available, falling back to contracts table:', error?.message);
        
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false });

        if (contractsError) {
          console.error('Error fetching from contracts table:', contractsError);
          // Last resort: check if contracts table exists at all
          setContracts([]);
          setLoading(false);
          return;
        }

        if (contractsData && contractsData.length > 0) {
          // Enrich contracts with data from related tables
          const enrichedContracts: ContractView[] = [];
          
          for (const contract of contractsData) {
            let clientName = 'Client';
            let clientEmail = '';
            let moverCompany = 'Déménageur';
            let moverEmail = '';
            let fromCity = '';
            let toCity = '';
            let movingDate = '';
            let totalAmount = 0;

            // Get data from contract_data JSON if available
            if (contract.contract_data) {
              const cd = contract.contract_data;
              clientName = cd.client?.name || clientName;
              clientEmail = cd.client?.email || clientEmail;
              moverCompany = cd.mover?.company_name || moverCompany;
              moverEmail = cd.mover?.email || moverEmail;
              fromCity = cd.moving?.from_city || cd.from_city || fromCity;
              toCity = cd.moving?.to_city || cd.to_city || toCity;
              movingDate = cd.moving?.moving_date || cd.moving_date || movingDate;
              totalAmount = cd.financial?.total_amount || cd.total_amount || totalAmount;
            }

            // Try to get additional info from quote_requests if we have the ID
            if (contract.quote_request_id) {
              try {
                const { data: qr } = await supabase
                  .from('quote_requests')
                  .select('client_name, from_city, to_city, moving_date')
                  .eq('id', contract.quote_request_id)
                  .maybeSingle();
                
                if (qr) {
                  clientName = qr.client_name || clientName;
                  fromCity = qr.from_city || fromCity;
                  toCity = qr.to_city || toCity;
                  movingDate = qr.moving_date || movingDate;
                }
              } catch (e) {
                // Ignore errors from related data
              }
            }

            enrichedContracts.push({
              id: contract.id,
              contract_number: contract.contract_number || `CTR-${contract.id.slice(0, 8).toUpperCase()}`,
              status: contract.status || 'active',
              created_at: contract.created_at,
              pdf_url: contract.pdf_url || null,
              sent_to_client: contract.sent_to_client || false,
              sent_to_mover: contract.sent_to_mover || false,
              moving_date: movingDate,
              client_name: clientName,
              client_email: clientEmail,
              mover_company: moverCompany,
              mover_email: moverEmail,
              from_city: fromCity,
              to_city: toCity,
              total_amount: totalAmount,
              quote_request_id: contract.quote_request_id || '',
              mover_id: contract.mover_id || '',
            });
          }
          
          data = enrichedContracts as any;
        } else {
          data = [];
        }
      }

      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showToast('Erreur lors du chargement des contrats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchContractDetail = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) throw error;
      setSelectedContract(data);
    } catch (error) {
      console.error('Error fetching contract detail:', error);
      showToast('Erreur lors du chargement du contrat', 'error');
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

  const handleSendEmail = async (contractId: string, recipient: 'client' | 'mover' | 'both') => {
    setSendingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contract-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractId, recipient }),
        }
      );

      if (response.ok) {
        showToast('Email envoyé avec succès', 'success');
        fetchContracts();
        if (selectedContract?.id === contractId) {
          fetchContractDetail(contractId);
        }
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Erreur lors de l\'envoi de l\'email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateStatus = async (contractId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', contractId);

      if (error) throw error;

      showToast('Statut mis à jour', 'success');
      fetchContracts();
      if (selectedContract?.id === contractId) {
        fetchContractDetail(contractId);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleGeneratePDF = async (contractId: string) => {
    try {
      showToast('Génération du PDF en cours...', 'info');
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractId }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.pdfUrl) {
          window.open(result.pdfUrl, '_blank');
          showToast('PDF généré avec succès', 'success');
          fetchContracts();
        }
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.mover_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.from_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.to_city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const contractDate = new Date(contract.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = contractDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = contractDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = contractDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    disputed: contracts.filter(c => c.status === 'disputed').length,
    totalAmount: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
    pendingEmails: contracts.filter(c => !c.sent_to_client || !c.sent_to_mover).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Actifs</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Terminés</div>
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Litiges</div>
          <div className="text-2xl font-bold text-red-600">{stats.disputed}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">CA Total</div>
          <div className="text-2xl font-bold text-purple-600">{stats.totalAmount.toLocaleString('fr-FR')} €</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Emails en attente</div>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingEmails}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, client, déménageur, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <button
            onClick={fetchContracts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Déménageur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emails</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{contract.contract_number}</div>
                    <div className="text-xs text-gray-500">{new Date(contract.created_at).toLocaleDateString('fr-FR')}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{contract.client_name}</div>
                    <div className="text-xs text-gray-500">{contract.client_email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{contract.mover_company}</div>
                    <div className="text-xs text-gray-500">{contract.mover_email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <span>{contract.from_city}</span>
                      <span>→</span>
                      <span>{contract.to_city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {contract.moving_date ? new Date(contract.moving_date).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{contract.total_amount?.toLocaleString('fr-FR')} €</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span title="Client" className={contract.sent_to_client ? 'text-green-600' : 'text-gray-300'}>
                        {contract.sent_to_client ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                      <span title="Déménageur" className={contract.sent_to_mover ? 'text-green-600' : 'text-gray-300'}>
                        {contract.sent_to_mover ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => fetchContractDetail(contract.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleGeneratePDF(contract.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Télécharger PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(contract.id, 'both')}
                        disabled={sendingEmail}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                        title="Envoyer emails"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContracts.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun contrat trouvé</h3>
            <p className="text-gray-600">Aucun contrat ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Contrat {selectedContract.contract_number}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedContract.status)}
                  <span className="text-sm text-gray-500">
                    Créé le {new Date(selectedContract.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Email Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📧 Statut des emails</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium">Client</div>
                      <div className="text-xs text-gray-500">
                        {selectedContract.sent_to_client 
                          ? `Envoyé le ${new Date(selectedContract.sent_to_client_at!).toLocaleDateString('fr-FR')}`
                          : 'Non envoyé'}
                      </div>
                    </div>
                    {!selectedContract.sent_to_client && (
                      <button
                        onClick={() => handleSendEmail(selectedContract.id, 'client')}
                        disabled={sendingEmail}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Envoyer
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium">Déménageur</div>
                      <div className="text-xs text-gray-500">
                        {selectedContract.sent_to_mover 
                          ? `Envoyé le ${new Date(selectedContract.sent_to_mover_at!).toLocaleDateString('fr-FR')}`
                          : 'Non envoyé'}
                      </div>
                    </div>
                    {!selectedContract.sent_to_mover && (
                      <button
                        onClick={() => handleSendEmail(selectedContract.id, 'mover')}
                        disabled={sendingEmail}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Envoyer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contract Data */}
              {selectedContract.contract_data && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">👤 Client</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>Nom:</strong> {selectedContract.contract_data.client?.name}</p>
                        <p><strong>Email:</strong> {selectedContract.contract_data.client?.email}</p>
                        <p><strong>Tél:</strong> {selectedContract.contract_data.client?.phone}</p>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">🚚 Déménageur</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>Entreprise:</strong> {selectedContract.contract_data.mover?.company_name}</p>
                        <p><strong>SIRET:</strong> {selectedContract.contract_data.mover?.siret}</p>
                        <p><strong>Email:</strong> {selectedContract.contract_data.mover?.email}</p>
                        <p><strong>Tél:</strong> {selectedContract.contract_data.mover?.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">💰 Financier</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Montant total</div>
                        <div className="text-xl font-bold">{selectedContract.contract_data.financial?.total_amount?.toLocaleString('fr-FR')} €</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Commission (30%)</div>
                        <div className="text-xl font-bold text-purple-600">{selectedContract.contract_data.financial?.platform_fee?.toLocaleString('fr-FR')} €</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Escrow (10%)</div>
                        <div className="text-xl font-bold text-orange-600">{selectedContract.contract_data.financial?.escrow_amount?.toLocaleString('fr-FR')} €</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Status Change */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">⚙️ Changer le statut</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedContract.id, 'active')}
                    className={`px-4 py-2 rounded-lg transition ${selectedContract.status === 'active' ? 'bg-green-600 text-white' : 'bg-white border hover:bg-green-50'}`}
                  >
                    Actif
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedContract.id, 'completed')}
                    className={`px-4 py-2 rounded-lg transition ${selectedContract.status === 'completed' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-blue-50'}`}
                  >
                    Terminé
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedContract.id, 'disputed')}
                    className={`px-4 py-2 rounded-lg transition ${selectedContract.status === 'disputed' ? 'bg-red-600 text-white' : 'bg-white border hover:bg-red-50'}`}
                  >
                    Litige
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedContract.id, 'cancelled')}
                    className={`px-4 py-2 rounded-lg transition ${selectedContract.status === 'cancelled' ? 'bg-gray-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
                  >
                    Annulé
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleGeneratePDF(selectedContract.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => handleSendEmail(selectedContract.id, 'both')}
                  disabled={sendingEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  Envoyer aux deux parties
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
  );
}
