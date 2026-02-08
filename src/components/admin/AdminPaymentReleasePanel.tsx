import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, FileText, Calendar, MapPin, Euro, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface PaymentReleaseRequest {
  id: string;
  payment_id: string;
  mover_id: string;
  requested_at: string;
  status: string;
  ai_analysis: {
    isApproved: boolean;
    hasNegativeComments: boolean;
    hasClientSignature: boolean;
    riskLevel: string;
    summary: string;
    recommendations: string[];
    detectedIssues: string[];
  };
  mover_company_name: string;
  mover_email: string;
  mover_phone: string;
  total_amount: number;
  escrow_amount: number;
  mover_deposit: number;
  client_name: string;
  from_city: string;
  to_city: string;
  moving_date: string;
}

export function AdminPaymentReleasePanel() {
  const [requests, setRequests] = useState<PaymentReleaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentReleaseRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_payment_releases')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading release requests:', error);
      showToast('Erreur lors du chargement des demandes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('approve_payment_release', {
        p_request_id: requestId,
        p_admin_notes: adminNotes || null,
      });

      if (error) throw error;

      showToast('Paiement débloqué avec succès', 'success');
      setSelectedRequest(null);
      setAdminNotes('');
      await loadRequests();
    } catch (error) {
      console.error('Error approving release:', error);
      showToast('Erreur lors de l\'approbation', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!adminNotes.trim()) {
      showToast('Veuillez indiquer la raison du rejet', 'error');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_payment_release', {
        p_request_id: requestId,
        p_admin_notes: adminNotes,
      });

      if (error) throw error;

      showToast('Demande rejetée', 'success');
      setSelectedRequest(null);
      setAdminNotes('');
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting release:', error);
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'Risque faible';
      case 'medium':
        return 'Risque moyen';
      case 'high':
        return 'Risque élevé';
      default:
        return 'Non évalué';
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Demandes de déblocage de paiement</h2>
          <p className="text-slate-600 mt-1">
            {requests.length} demande{requests.length > 1 ? 's' : ''} en attente d'approbation
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune demande en attente</h3>
          <p className="text-slate-600">Toutes les demandes de déblocage ont été traitées</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {request.mover_company_name}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskBadge(request.ai_analysis.riskLevel)}`}>
                        {getRiskLabel(request.ai_analysis.riskLevel)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Demandé le {new Date(request.requested_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(request.requested_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {request.escrow_amount.toLocaleString('fr-FR')}€
                    </div>
                    <div className="text-xs text-slate-500">Montant en séquestre</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">Déménagement: </span>
                      <span className="text-slate-600">
                        {request.from_city} → {request.to_city}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">Client: </span>
                      <span className="text-slate-600">{request.client_name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">Date: </span>
                      <span className="text-slate-600">
                        {new Date(request.moving_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">Contact: </span>
                      <span className="text-slate-600">{request.mover_email}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">Téléphone: </span>
                      <span className="text-slate-600">{request.mover_phone}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">Montant total: </span>
                      <span className="text-slate-600">{request.total_amount.toLocaleString('fr-FR')}€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 mb-1">Analyse IA</div>
                      <div className="text-sm text-slate-700 mb-2">{request.ai_analysis.summary}</div>

                      {request.ai_analysis.detectedIssues && request.ai_analysis.detectedIssues.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-slate-700 mb-1">Problèmes détectés:</div>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {request.ai_analysis.detectedIssues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {request.ai_analysis.recommendations && request.ai_analysis.recommendations.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-slate-700 mb-1">Recommandations:</div>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {request.ai_analysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <TrendingUp className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                    <div className="text-center">
                      <div className={`text-xs font-medium ${request.ai_analysis.hasClientSignature ? 'text-green-600' : 'text-red-600'}`}>
                        {request.ai_analysis.hasClientSignature ? '✓ Signé' : '✗ Non signé'}
                      </div>
                      <div className="text-xs text-slate-500">Signature client</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xs font-medium ${!request.ai_analysis.hasNegativeComments ? 'text-green-600' : 'text-red-600'}`}>
                        {!request.ai_analysis.hasNegativeComments ? '✓ OK' : '✗ Négatif'}
                      </div>
                      <div className="text-xs text-slate-500">Commentaires</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xs font-medium ${request.ai_analysis.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {request.ai_analysis.isApproved ? '✓ Approuvé' : '⚠ À vérifier'}
                      </div>
                      <div className="text-xs text-slate-500">Statut IA</div>
                    </div>
                  </div>
                </div>

                {selectedRequest?.id === request.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes administratives (optionnel pour approbation, requis pour rejet)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Ajoutez vos notes ici..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Traitement...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Approuver le déblocage
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeter
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setAdminNotes('');
                        }}
                        disabled={processing}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Examiner et décider
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
