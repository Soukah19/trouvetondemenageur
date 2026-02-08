import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DollarSign, RefreshCw, Search, CheckCircle, Clock,
  BarChart3, XCircle, Wallet, ArrowLeftRight, AlertTriangle,
  Unlock, Euro, Shield,
} from 'lucide-react';
import { showToast } from '../../utils/toast';

interface Payment {
  id: string;
  quote_id: string;
  quote_request_id: string;
  client_id: string;
  mover_id: string;
  total_amount: number;
  platform_commission: number;
  mover_payment: number;
  escrow_amount: number;
  escrow_released: boolean;
  payment_status: string;
  guarantee_amount: number;
  guarantee_status: string;
  guarantee_released_amount: number;
  guarantee_notes: string;
  guarantee_decision_at: string;
  created_at: string;
  released_at?: string;
  has_damage_report?: boolean;
}

interface Refund {
  id: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  processed_at?: string;
  client_id: string;
  quote_id: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalCommission: number;
  totalEscrow: number;
  totalReleased: number;
  pendingPayments: number;
  completedPayments: number;
  avgTransactionValue: number;
  totalRefunds: number;
}

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';
type FinancialTab = 'overview' | 'payments' | 'refunds';

interface Props {
  onNavigateToDisputes?: (quoteRequestId?: string) => void;
  highlightPaymentId?: string | null;
}

export default function AdminFinancialManagement({ onNavigateToDisputes, highlightPaymentId }: Props) {
  const [activeTab, setActiveTab] = useState<FinancialTab>(highlightPaymentId ? 'payments' : 'overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({ totalRevenue: 0, totalCommission: 0, totalEscrow: 0, totalReleased: 0, pendingPayments: 0, completedPayments: 0, avgTransactionValue: 0, totalRefunds: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [guaranteePayment, setGuaranteePayment] = useState<Payment | null>(null);
  const [guaranteeDecision, setGuaranteeDecision] = useState<'full_return' | 'partial_return' | 'no_return'>('full_return');
  const [guaranteeReturnAmount, setGuaranteeReturnAmount] = useState(0);
  const [guaranteeNotes, setGuaranteeNotes] = useState('');
  const [processingGuarantee, setProcessingGuarantee] = useState(false);

  useEffect(() => { loadFinancialData(); }, [dateRange]);
  useEffect(() => { applyFilters(payments); }, [searchTerm, payments]);
  useEffect(() => {
    if (highlightPaymentId && payments.length > 0) {
      setActiveTab('payments');
      setSearchTerm(highlightPaymentId.substring(0, 8));
    }
  }, [highlightPaymentId, payments]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
        case 'all': startDate = new Date(0); break;
      }
      const { data: paymentsData, error } = await supabase.from('payments').select('*').gte('created_at', startDate.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;

      const qrIds = [...new Set((paymentsData || []).map((p: any) => p.quote_request_id).filter(Boolean))];
      let damageMap: Record<string, boolean> = {};
      if (qrIds.length > 0) {
        const { data: dmg } = await supabase.from('damage_reports').select('quote_request_id').in('quote_request_id', qrIds);
        if (dmg) dmg.forEach((d: any) => { damageMap[d.quote_request_id] = true; });
      }

      const fmt: Payment[] = (paymentsData || []).map((p: any) => ({
        id: p.id, quote_id: p.quote_id, quote_request_id: p.quote_request_id, client_id: p.client_id, mover_id: p.mover_id,
        total_amount: p.total_amount || 0, platform_commission: p.platform_fee || 0, mover_payment: p.mover_deposit || 0,
        escrow_amount: p.escrow_amount || 0, escrow_released: p.escrow_released || false, payment_status: p.payment_status || 'pending',
        guarantee_amount: p.guarantee_amount || 0, guarantee_status: p.guarantee_status || 'held',
        guarantee_released_amount: p.guarantee_released_amount || 0, guarantee_notes: p.guarantee_notes || '',
        guarantee_decision_at: p.guarantee_decision_at || '', created_at: p.created_at, released_at: p.escrow_release_date,
        has_damage_report: !!damageMap[p.quote_request_id],
      }));

      setPayments(fmt);
      applyFilters(fmt);

      const { data: refData } = await supabase.from('refunds').select('*').gte('created_at', startDate.toISOString()).order('requested_at', { ascending: false });
      setRefunds(refData || []);

      const totalRevenue = fmt.reduce((s, p) => s + p.total_amount, 0);
      const totalCommission = fmt.reduce((s, p) => s + p.platform_commission, 0);
      const totalEscrow = fmt.filter(p => !p.escrow_released).reduce((s, p) => s + p.escrow_amount, 0);
      const totalReleased = fmt.filter(p => p.escrow_released).reduce((s, p) => s + p.escrow_amount, 0);
      const totalRefunds = (refData || []).reduce((s: number, r: any) => s + (r.status === 'completed' ? r.amount : 0), 0);
      setSummary({ totalRevenue, totalCommission, totalEscrow, totalReleased, pendingPayments: fmt.filter(p => !p.escrow_released).length, completedPayments: fmt.filter(p => p.escrow_released).length, avgTransactionValue: fmt.length > 0 ? totalRevenue / fmt.length : 0, totalRefunds });
    } catch (error) {
      showToast('Erreur chargement données', 'error');
    } finally { setLoading(false); }
  };

  const applyFilters = (data: Payment[]) => {
    let f = [...data];
    if (searchTerm) f = f.filter(p => p.id.toLowerCase().includes(searchTerm.toLowerCase()) || (p.quote_id || '').toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredPayments(f);
  };

  const handleReleaseEscrow = async (paymentId: string) => {
    if (!confirm('Libérer l\'escrow ? Le déménageur recevra les fonds.')) return;
    try {
      const { error } = await supabase.from('payments').update({ escrow_released: true, escrow_release_date: new Date().toISOString() }).eq('id', paymentId);
      if (error) throw error;
      showToast('Escrow libéré', 'success');
      loadFinancialData();
    } catch { showToast("Erreur libération escrow", 'error'); }
  };

  const openGuaranteeModal = (payment: Payment) => {
    setGuaranteePayment(payment);
    setGuaranteeDecision('full_return');
    setGuaranteeReturnAmount(payment.guarantee_amount || 0);
    setGuaranteeNotes('');
    setShowGuaranteeModal(true);
  };

  const handleGuaranteeDecision = async () => {
    if (!guaranteePayment) return;
    setProcessingGuarantee(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      let gStatus: string, released: number, notes: string;
      const gAmt = guaranteePayment.guarantee_amount || 0;
      switch (guaranteeDecision) {
        case 'full_return':
          gStatus = 'released_to_mover'; released = gAmt;
          notes = 'Restitution totale au déménageur. ' + guaranteeNotes; break;
        case 'no_return':
          gStatus = 'kept_for_client'; released = 0;
          notes = 'Aucune restitution - totalité au client. ' + guaranteeNotes; break;
        case 'partial_return': default:
          gStatus = 'partial_release'; released = guaranteeReturnAmount;
          notes = `Partiel: ${released}€ déménageur, ${gAmt - released}€ client. ${guaranteeNotes}`; break;
      }
      const { error } = await supabase.from('payments').update({
        guarantee_status: gStatus, guarantee_released_amount: released,
        guarantee_decision_at: new Date().toISOString(), guarantee_decision_by: userData.user?.id, guarantee_notes: notes,
      }).eq('id', guaranteePayment.id);
      if (error) throw error;

      // Notify mover
      if (guaranteePayment.quote_id) {
        const { data: q } = await supabase.from('quotes').select('mover_id').eq('id', guaranteePayment.quote_id).maybeSingle();
        if (q) {
          const { data: m } = await supabase.from('movers').select('user_id').eq('id', q.mover_id).maybeSingle();
          if (m) {
            const t = gStatus === 'released_to_mover' ? '✅ Garantie restituée' : gStatus === 'kept_for_client' ? '❌ Garantie retenue' : '⚠️ Garantie partielle';
            const msg = gStatus === 'released_to_mover' ? `Garantie de ${gAmt}€ restituée.` : gStatus === 'kept_for_client' ? `Garantie de ${gAmt}€ retenue pour le client.` : `${released}€/${gAmt}€ restitués.`;
            await supabase.from('notifications').insert({ user_id: m.user_id, user_type: 'mover', title: t, message: msg, type: 'payment', related_id: guaranteePayment.id, read: false });
          }
        }
      }
      showToast('Décision garantie enregistrée', 'success');
      setShowGuaranteeModal(false); setGuaranteePayment(null);
      loadFinancialData();
    } catch { showToast('Erreur décision garantie', 'error'); }
    finally { setProcessingGuarantee(false); }
  };

  const handleCreateRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) { showToast('Remplissez tous les champs', 'error'); return; }
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedPayment.total_amount) { showToast('Montant invalide', 'error'); return; }
    try {
      const { error } = await supabase.from('refunds').insert({ payment_id: selectedPayment.id, client_id: selectedPayment.client_id, quote_id: selectedPayment.quote_id, amount, reason: refundReason, status: 'pending' });
      if (error) throw error;
      showToast('Remboursement créé', 'success');
      setShowRefundModal(false); setSelectedPayment(null); setRefundAmount(''); setRefundReason('');
      loadFinancialData();
    } catch { showToast('Erreur', 'error'); }
  };

  const handleProcessRefund = async (refundId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase.from('refunds').update({ status: newStatus, processed_at: new Date().toISOString() }).eq('id', refundId);
      if (error) throw error;
      showToast(`Remboursement ${newStatus === 'approved' ? 'approuvé' : newStatus === 'rejected' ? 'rejeté' : 'complété'}`, 'success');
      loadFinancialData();
    } catch { showToast('Erreur', 'error'); }
  };

  const getGuaranteeBadge = (s: string) => {
    switch (s) {
      case 'held': return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" />Retenue</span>;
      case 'released_to_mover': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" />Restituée</span>;
      case 'kept_for_client': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full inline-flex items-center gap-1"><XCircle className="w-3 h-3" />Client</span>;
      case 'partial_release': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-flex items-center gap-1"><ArrowLeftRight className="w-3 h-3" />Partiel</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{s}</span>;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className={`p-3 rounded-lg ${color} w-fit mb-4`}><Icon className="w-6 h-6 text-white" /></div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Guarantee Modal */}
      {showGuaranteeModal && guaranteePayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Euro className="w-6 h-6 text-emerald-600" />Décision Garantie</h3>
            <p className="text-sm text-gray-500 mb-4">Garantie: {(guaranteePayment.guarantee_amount || 0).toLocaleString('fr-FR')} €</p>

            <div className="space-y-3 mb-4">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-green-50 ${guaranteeDecision === 'full_return' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="gd" checked={guaranteeDecision === 'full_return'} onChange={() => { setGuaranteeDecision('full_return'); setGuaranteeReturnAmount(guaranteePayment.guarantee_amount); }} />
                <div><span className="font-medium">Restitution totale</span><p className="text-xs text-gray-500">Totalité de la garantie restituée au déménageur</p></div>
                <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-yellow-50 ${guaranteeDecision === 'partial_return' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}>
                <input type="radio" name="gd" checked={guaranteeDecision === 'partial_return'} onChange={() => { setGuaranteeDecision('partial_return'); setGuaranteeReturnAmount(Math.round((guaranteePayment.guarantee_amount || 0) * 0.5)); }} />
                <div className="flex-1">
                  <span className="font-medium">Restitution partielle</span>
                  <p className="text-xs text-gray-500">Montant au déménageur, reste au client</p>
                  {guaranteeDecision === 'partial_return' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input type="number" value={guaranteeReturnAmount} onChange={(e) => setGuaranteeReturnAmount(Math.min(Number(e.target.value), guaranteePayment.guarantee_amount || 0))} min={0} max={guaranteePayment.guarantee_amount || 0} className="w-28 px-3 py-1 border rounded text-sm" />
                      <span className="text-sm text-gray-600">€ → déménageur</span>
                    </div>
                  )}
                  {guaranteeDecision === 'partial_return' && (
                    <p className="text-xs text-orange-600 mt-1">{((guaranteePayment.guarantee_amount || 0) - guaranteeReturnAmount).toLocaleString('fr-FR')} € → client</p>
                  )}
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-red-50 ${guaranteeDecision === 'no_return' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                <input type="radio" name="gd" checked={guaranteeDecision === 'no_return'} onChange={() => { setGuaranteeDecision('no_return'); setGuaranteeReturnAmount(0); }} />
                <div><span className="font-medium">Aucune restitution</span><p className="text-xs text-gray-500">Totalité de la garantie au client (dédommagement)</p></div>
                <XCircle className="w-5 h-5 text-red-600 ml-auto" />
              </label>
            </div>

            <textarea value={guaranteeNotes} onChange={(e) => setGuaranteeNotes(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg mb-4" placeholder="Notes (optionnel)..." />

            <div className="flex gap-3">
              <button onClick={() => { setShowGuaranteeModal(false); setGuaranteePayment(null); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleGuaranteeDecision} disabled={processingGuarantee} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold">
                {processingGuarantee ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Créer un Remboursement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Montant (max: {selectedPayment.total_amount.toFixed(2)} EUR)</label>
                <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" max={selectedPayment.total_amount} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Raison</label>
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg" rows={3} placeholder="Raison..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRefundModal(false); setSelectedPayment(null); setRefundAmount(''); setRefundReason(''); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreateRefund} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion Financière</h2>
        <div className="flex items-center gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} className="px-4 py-2 border rounded-lg">
            <option value="7d">7 jours</option><option value="30d">30 jours</option><option value="90d">90 jours</option><option value="1y">1 an</option><option value="all">Tout</option>
          </select>
          <button onClick={loadFinancialData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" />Actualiser</button>
        </div>
      </div>

      {/* Tabs - NO "Suivi" tab */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview' as FinancialTab, label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'payments' as FinancialTab, label: 'Paiements', icon: Wallet },
          { id: 'refunds' as FinancialTab, label: 'Remboursements', icon: ArrowLeftRight },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Revenu Total" value={summary.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} icon={DollarSign} color="bg-green-500" />
            <MetricCard title="Commission (30%)" value={summary.totalCommission.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} icon={BarChart3} color="bg-blue-500" />
            <MetricCard title="Escrow en Attente" value={summary.totalEscrow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} icon={Clock} color="bg-orange-500" />
            <MetricCard title="Remboursements" value={summary.totalRefunds.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} icon={ArrowLeftRight} color="bg-red-500" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
              <div className="space-y-4">
                {[
                  ['Paiements Complétés', summary.completedPayments],
                  ['Paiements en Attente', summary.pendingPayments],
                  ['Escrow Libéré', summary.totalReleased.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })],
                  ['Valeur Moyenne', summary.avgTransactionValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">Répartition</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Commission Plateforme</span><span className="text-sm font-semibold">30%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Paiement Déménageur</span><span className="text-sm font-semibold">70%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }}></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historique des Paiements</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escrow</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut Escrow</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garantie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length > 0 ? filteredPayments.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${highlightPaymentId === p.id ? 'bg-yellow-50 ring-2 ring-yellow-300' : ''}`}>
                    <td className="px-4 py-4 text-sm">{p.id.substring(0, 8)}...</td>
                    <td className="px-4 py-4 text-sm font-semibold">{p.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="px-4 py-4 text-sm text-green-600">{p.platform_commission.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="px-4 py-4 text-sm">{p.escrow_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="px-4 py-4">
                      {p.escrow_released
                        ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" />Libéré</span>
                        : <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" />En attente</span>}
                    </td>
                    <td className="px-4 py-4">
                      {p.guarantee_amount > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">{p.guarantee_amount.toLocaleString('fr-FR')} €</p>
                          {getGuaranteeBadge(p.guarantee_status)}
                          {/* Show breakdown after decision */}
                          {p.guarantee_status === 'released_to_mover' && (
                            <p className="text-xs text-green-700">→ {p.guarantee_amount.toLocaleString('fr-FR')} € déménageur</p>
                          )}
                          {p.guarantee_status === 'kept_for_client' && (
                            <p className="text-xs text-red-700">→ {p.guarantee_amount.toLocaleString('fr-FR')} € client</p>
                          )}
                          {p.guarantee_status === 'partial_release' && (
                            <>
                              <p className="text-xs text-blue-700">→ {(p.guarantee_released_amount || 0).toLocaleString('fr-FR')} € déménageur</p>
                              <p className="text-xs text-orange-700">→ {((p.guarantee_amount || 0) - (p.guarantee_released_amount || 0)).toLocaleString('fr-FR')} € client</p>
                            </>
                          )}
                          {p.guarantee_notes && p.guarantee_status !== 'held' && (
                            <p className="text-xs text-gray-500 italic truncate max-w-[160px]" title={p.guarantee_notes}>{p.guarantee_notes}</p>
                          )}
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Libérer Escrow button */}
                        {!p.escrow_released && (
                          <button onClick={() => handleReleaseEscrow(p.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1" title="Libérer l'escrow">
                            <Unlock className="w-3 h-3" />Libérer Escrow
                          </button>
                        )}
                        {p.escrow_released && <span className="text-xs text-green-600 font-medium">✅ Libéré</span>}

                        {/* Guarantee decision button */}
                        {p.guarantee_amount > 0 && p.guarantee_status === 'held' && (
                          <button onClick={() => openGuaranteeModal(p)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 flex items-center gap-1">
                            <Shield className="w-3 h-3" />Décider Garantie
                          </button>
                        )}
                        {p.guarantee_amount > 0 && p.guarantee_status !== 'held' && (
                          <button onClick={() => openGuaranteeModal(p)} className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 flex items-center gap-1" title="Modifier la décision de garantie">
                            <Shield className="w-3 h-3" />Modifier
                          </button>
                        )}

                        {/* Link to litiges */}
                        {p.has_damage_report && (
                          <button onClick={() => onNavigateToDisputes?.(p.quote_request_id)} className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 flex items-center gap-1" title="Voir le litige associé">
                            <AlertTriangle className="w-3 h-3" />Litige
                          </button>
                        )}

                        {/* Refund */}
                        {!p.escrow_released && (
                          <button onClick={() => { setSelectedPayment(p); setShowRefundModal(true); }} className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">Rembourser</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun paiement trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{filteredPayments.length} paiement(s)</span>
              <span>Total: {filteredPayments.reduce((s, p) => s + p.total_amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* REFUNDS TAB */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b"><h3 className="text-lg font-semibold">Demandes de Remboursement</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {refunds.length > 0 ? refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm">{r.id.substring(0, 8)}...</td>
                    <td className="px-4 py-4 text-sm font-semibold">{r.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{r.reason}</td>
                    <td className="px-4 py-4">
                      {r.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">En attente</span>}
                      {r.status === 'approved' && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Approuvé</span>}
                      {r.status === 'rejected' && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejeté</span>}
                      {r.status === 'completed' && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Complété</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(r.requested_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleProcessRefund(r.id, 'approved')} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Approuver</button>
                            <button onClick={() => handleProcessRefund(r.id, 'rejected')} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Rejeter</button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <button onClick={() => handleProcessRefund(r.id, 'completed')} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Complété</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune demande</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
