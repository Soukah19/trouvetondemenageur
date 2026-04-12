import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Download, Send, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface Contract {
  id: string;
  mover_id: string;
  signature_request_id: string;
  status: string;
  contract_data: any;
  sent_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  expired_at: string | null;
  expires_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  movers: {
    company_name: string;
    email: string;
    siret: string;
    phone: string;
    verification_status: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  sent: { label: 'Envoyé', color: 'text-blue-600', bg: 'bg-blue-100', icon: Send },
  opened: { label: 'Ouvert', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Eye },
  signed: { label: 'Signé ✅', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  declined: { label: 'Refusé', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  expired: { label: 'Expiré', color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock },
  error: { label: 'Erreur', color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
};

export default function AdminDropboxSignContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mover_contracts')
        .select('*, movers(company_name, email, siret, phone, verification_status)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
      showToast('Erreur lors du chargement des contrats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (contract: Contract, force = false) => {
    setCheckingStatus(contract.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropboxsign-check-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractId: contract.id, force }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.activated) {
        showToast(`✅ Contrat signé ! Compte activé, admin notifié, PDF stocké.`, 'success');
        loadContracts();
      } else if (result.statusChanged) {
        showToast(`Statut mis à jour : ${statusConfig[result.localStatus]?.label || result.localStatus}`, 'success');
        loadContracts();
      } else if (result.dropboxSignComplete && !result.activated) {
        // Status was already signed but maybe notifications didn't go through — force it
        showToast(`Statut Dropbox Sign: signé. Tentative de resync...`, 'info');
        const retryRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropboxsign-check-status`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contractId: contract.id, force: true }),
          }
        );
        const retryResult = await retryRes.json();
        if (retryResult.activated) {
          showToast(`✅ Resync réussi ! Compte activé et admin notifié.`, 'success');
        } else {
          showToast(`Statut: signé — vérifiez les logs Supabase`, 'info');
        }
        loadContracts();
      } else {
        showToast(`Statut Dropbox Sign : ${result.localStatus}`, 'info');
      }
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      setCheckingStatus(null);
    }
  };

  const handleResend = async (contract: Contract) => {
    if (!window.confirm(`Renvoyer un nouveau contrat à ${contract.movers?.company_name} ?`)) return;

    setResending(contract.mover_id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropboxsign-create-signature`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ moverId: contract.mover_id }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      showToast('Nouveau contrat envoyé !', 'success');
      loadContracts();
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      setResending(null);
    }
  };

  const handleDownloadSignedPdf = async (contract: Contract) => {
    if (!contract.signed_pdf_url) {
      showToast('Aucun PDF signé disponible', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from('signed-contracts')
        .download(contract.signed_pdf_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrat_signe_${contract.contract_data?.company_name || 'demenageur'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  const handleViewSignedPdf = async (contract: Contract) => {
    if (!contract.signed_pdf_url) {
      showToast('Aucun PDF signé disponible', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from('signed-contracts')
        .download(contract.signed_pdf_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (error) {
      showToast('Erreur lors de l\'ouverture', 'error');
    }
  };

  const [syncingAll, setSyncingAll] = useState(false);

  const handleSyncAllPending = async () => {
    const pending = contracts.filter(c => c.status === 'sent' || c.status === 'opened');
    if (pending.length === 0) {
      showToast('Aucun contrat en attente à synchroniser', 'info');
      return;
    }
    setSyncingAll(true);
    let updated = 0;
    for (const contract of pending) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropboxsign-check-status`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contractId: contract.id, force: true }),
          }
        );
        const result = await response.json();
        if (result.statusChanged || result.activated) updated++;
      } catch (e) { /* continue */ }
    }
    showToast(`Synchronisation terminée : ${updated} contrat(s) mis à jour sur ${pending.length}`, updated > 0 ? 'success' : 'info');
    loadContracts();
    setSyncingAll(false);
  };

  const filteredContracts = contracts.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        c.contract_data?.company_name?.toLowerCase().includes(s) ||
        c.contract_data?.email?.toLowerCase().includes(s) ||
        c.movers?.company_name?.toLowerCase().includes(s) ||
        c.movers?.email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: contracts.length,
    sent: contracts.filter(c => c.status === 'sent' || c.status === 'opened').length,
    signed: contracts.filter(c => c.status === 'signed').length,
    declined: contracts.filter(c => c.status === 'declined').length,
    expired: contracts.filter(c => c.status === 'expired').length,
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Contrats Dropbox Sign
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Suivi des contrats de partenariat signés électroniquement</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.sent > 0 && (
            <button
              onClick={handleSyncAllPending}
              disabled={syncingAll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
              {syncingAll ? 'Synchronisation...' : `🔄 Sync ${stats.sent} en attente`}
            </button>
          )}
          <button
            onClick={loadContracts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600">En attente</p>
          <p className="text-2xl font-bold text-blue-700">{stats.sent}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600">Signés</p>
          <p className="text-2xl font-bold text-green-700">{stats.signed}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600">Refusés</p>
          <p className="text-2xl font-bold text-red-700">{stats.declined}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500">Expirés</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par entreprise ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="sent">📧 Envoyés</option>
          <option value="opened">👁 Ouverts</option>
          <option value="signed">✅ Signés</option>
          <option value="declined">❌ Refusés</option>
          <option value="expired">⏰ Expirés</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {contracts.length === 0 ? 'Aucun contrat envoyé pour le moment.' : 'Aucun contrat ne correspond au filtre.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">Entreprise</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">Envoyé le</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">Signé / Expire</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContracts.map((contract) => {
                  const sc = statusConfig[contract.status] || statusConfig.error;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {contract.movers?.company_name || contract.contract_data?.company_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500">{contract.movers?.siret || contract.contract_data?.siret || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {contract.movers?.email || contract.contract_data?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(contract.sent_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {contract.status === 'signed'
                          ? <span className="text-green-600">{formatDate(contract.signed_at)}</span>
                          : contract.expires_at
                            ? <span className={new Date(contract.expires_at) < new Date() ? 'text-red-500' : ''}>
                                Exp. {formatDate(contract.expires_at)}
                              </span>
                            : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Check status */}
                          {(contract.status === 'sent' || contract.status === 'opened') && (
                            <button
                              onClick={() => handleCheckStatus(contract)}
                              disabled={checkingStatus === contract.id}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title="Vérifier le statut"
                            >
                              <RefreshCw className={`w-4 h-4 ${checkingStatus === contract.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          {/* Download signed PDF */}
                          {contract.status === 'signed' && contract.signed_pdf_url && (
                            <>
                              <button
                                onClick={() => handleViewSignedPdf(contract)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                                title="Voir le contrat signé"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadSignedPdf(contract)}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                title="Télécharger le contrat signé"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {/* Signed but no PDF yet — offer to sync */}
                          {contract.status === 'signed' && !contract.signed_pdf_url && (
                            <button
                              onClick={() => handleCheckStatus(contract)}
                              disabled={checkingStatus === contract.id}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                              title="Récupérer le PDF signé"
                            >
                              <RefreshCw className={`w-4 h-4 ${checkingStatus === contract.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          {/* Resend for declined/expired */}
                          {(contract.status === 'declined' || contract.status === 'expired') && (
                            <button
                              onClick={() => handleResend(contract)}
                              disabled={resending === contract.mover_id}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition disabled:opacity-50"
                              title="Renvoyer un nouveau contrat"
                            >
                              <Send className={`w-4 h-4 ${resending === contract.mover_id ? 'animate-pulse' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
