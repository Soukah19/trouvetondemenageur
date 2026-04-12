import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DollarSign, RefreshCw, Search, CheckCircle, Clock,
  BarChart3, XCircle, Wallet, ArrowLeftRight, AlertTriangle,
  Euro, Shield, Download, Send, BanknoteIcon, Calendar,
} from 'lucide-react';
import { showToast } from '../../utils/toast';

interface Payment {
  id: string;
  quote_id: string;
  quote_request_id: string;
  client_id: string;
  mover_id: string;
  total_amount: number;
  deposit_amount: number;
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
  refund_amount: number;
  pending_refund_amount: number;
  mover_payout_status: string;
  mover_payout_date: string;
  mover_payout_amount: number;
  mover_payout_reference: string;
  created_at: string;
  released_at?: string;
  has_damage_report?: boolean;
  moving_date?: string;
  stripe_fee: number;
  stripe_card_country: string;
  stripe_card_brand: string;
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

interface MoverPayout {
  paymentId: string;
  quoteId: string;
  moverName: string;
  moverIban: string;
  moverBic: string;
  moverBankName: string;
  moverAccountHolder: string;
  amount: number;
  status: string;
  reference: string;
  guaranteeDecisionAt: string;
  payoutDate: string;
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
  pendingPayouts: number;
  completedPayouts: number;
}

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';
type FinancialTab = 'overview' | 'payments' | 'refunds' | 'virements';

interface Props {
  onNavigateToDisputes?: (quoteRequestId?: string) => void;
  highlightPaymentId?: string | null;
}

export default function AdminFinancialManagement({ onNavigateToDisputes, highlightPaymentId }: Props) {
  const [activeTab, setActiveTab] = useState<FinancialTab>(highlightPaymentId ? 'payments' : 'overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payouts, setPayouts] = useState<MoverPayout[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({ totalRevenue: 0, totalCommission: 0, totalEscrow: 0, totalReleased: 0, pendingPayments: 0, completedPayments: 0, avgTransactionValue: 0, totalRefunds: 0, pendingPayouts: 0, completedPayouts: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [guaranteePayment, setGuaranteePayment] = useState<Payment | null>(null);
  const [guaranteeDecision, setGuaranteeDecision] = useState<'full_return' | 'partial_return' | 'no_return'>('full_return');
  const [guaranteeReturnAmount, setGuaranteeReturnAmount] = useState(0);
  const [guaranteeNotes, setGuaranteeNotes] = useState('');
  const [processingGuarantee, setProcessingGuarantee] = useState(false);
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());
  const [refundFilterPaymentId, setRefundFilterPaymentId] = useState<string | null>(null);

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
      const { data: paymentsData, error } = await supabase.from('payments').select('*, quote_requests!quote_request_id(moving_date)').gte('created_at', startDate.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;

      const qrIds = [...new Set((paymentsData || []).map((p: any) => p.quote_request_id).filter(Boolean))];
      let damageMap: Record<string, boolean> = {};
      if (qrIds.length > 0) {
        const { data: dmg } = await supabase.from('damage_reports').select('quote_request_id').in('quote_request_id', qrIds);
        if (dmg) dmg.forEach((d: any) => { damageMap[d.quote_request_id] = true; });
      }

      const fmt: Payment[] = (paymentsData || []).map((p: any) => ({
        id: p.id, quote_id: p.quote_id, quote_request_id: p.quote_request_id, client_id: p.client_id, mover_id: p.mover_id,
        total_amount: p.total_amount || 0, deposit_amount: p.deposit_amount || p.amount_paid || 0,
        platform_commission: p.platform_fee || 0, mover_payment: p.mover_deposit || 0,
        escrow_amount: p.escrow_amount || 0, escrow_released: p.escrow_released || false, payment_status: p.payment_status || 'pending',
        guarantee_amount: p.guarantee_amount || 0, guarantee_status: p.guarantee_status || 'held',
        guarantee_released_amount: p.guarantee_released_amount || 0, guarantee_notes: p.guarantee_notes || '',
        guarantee_decision_at: p.guarantee_decision_at || '', refund_amount: p.refund_amount || 0,
        pending_refund_amount: 0,
        mover_payout_status: p.mover_payout_status || 'pending',
        mover_payout_date: p.mover_payout_date || '',
        mover_payout_amount: p.mover_payout_amount || 0,
        mover_payout_reference: p.mover_payout_reference || '',
        created_at: p.created_at, released_at: p.escrow_release_date,
        has_damage_report: !!damageMap[p.quote_request_id],
        moving_date: (p.quote_requests as any)?.moving_date || '',
        stripe_fee: p.stripe_fee || 0,
        stripe_card_country: p.stripe_card_country || '',
        stripe_card_brand: p.stripe_card_brand || '',
      }));

      setPayments(fmt);
      applyFilters(fmt);

      const { data: refData } = await supabase.from('refunds').select('*').gte('created_at', startDate.toISOString()).order('requested_at', { ascending: false });
      setRefunds(refData || []);

      // Compute pending refund amounts per payment
      const pendingRefundMap: Record<string, number> = {};
      (refData || []).forEach((r: any) => {
        if (r.status === 'pending' || r.status === 'approved') {
          pendingRefundMap[r.payment_id] = (pendingRefundMap[r.payment_id] || 0) + r.amount;
        }
      });
      // Update payments with pending refund info
      fmt.forEach(p => { p.pending_refund_amount = pendingRefundMap[p.id] || 0; });

      // ─── Load mover payout data ───
      const payoutsToLoad = fmt.filter(p =>
        (p.guarantee_status === 'released_to_mover' || p.guarantee_status === 'partial_release') && p.guarantee_released_amount > 0
      );
      const moverIds = [...new Set(payoutsToLoad.map(p => p.mover_id).filter(Boolean))];
      let moverMap: Record<string, any> = {};
      if (moverIds.length > 0) {
        const { data: moversData } = await supabase.from('movers').select('id, company_name, iban, bic, bank_name, account_holder_name').in('id', moverIds);
        if (moversData) moversData.forEach(m => { moverMap[m.id] = m; });
      }

      const payoutsList: MoverPayout[] = payoutsToLoad.map(p => {
        const mover = moverMap[p.mover_id] || {};
        // Payout amount = what was decided to release to mover (independent of client refunds)
        const payoutAmount = p.mover_payout_amount || p.guarantee_released_amount || 0;
        return {
          paymentId: p.id,
          quoteId: p.quote_id,
          moverName: mover.company_name || 'Inconnu',
          moverIban: mover.iban || '',
          moverBic: mover.bic || '',
          moverBankName: mover.bank_name || '',
          moverAccountHolder: mover.account_holder_name || mover.company_name || '',
          amount: payoutAmount,
          status: p.mover_payout_status || 'pending',
          reference: p.mover_payout_reference || `TTD-${p.id.substring(0, 8).toUpperCase()}`,
          guaranteeDecisionAt: p.guarantee_decision_at || '',
          payoutDate: p.mover_payout_date || '',
        };
      }).filter(p => p.amount > 0);
      setPayouts(payoutsList);

      // Summary
      const totalRevenue = fmt.reduce((s, p) => s + p.total_amount, 0);
      const totalCommission = fmt.reduce((s, p) => s + p.platform_commission, 0);
      const totalEscrow = fmt.filter(p => !p.escrow_released).reduce((s, p) => s + p.escrow_amount, 0);
      const totalReleased = fmt.filter(p => p.escrow_released).reduce((s, p) => s + p.escrow_amount, 0);
      const totalRefunds = (refData || []).reduce((s: number, r: any) => s + (r.status === 'completed' ? r.amount : 0), 0);
      const pendingPayouts = payoutsList.filter(p => p.status === 'pending' || p.status === 'ready_to_pay').length;
      const completedPayouts = payoutsList.filter(p => p.status === 'paid').length;
      setSummary({ totalRevenue, totalCommission, totalEscrow, totalReleased, pendingPayments: fmt.filter(p => !p.escrow_released).length, completedPayments: fmt.filter(p => p.escrow_released).length, avgTransactionValue: fmt.length > 0 ? totalRevenue / fmt.length : 0, totalRefunds, pendingPayouts, completedPayouts });
    } catch (error) {
      showToast('Erreur chargement données', 'error');
    } finally { setLoading(false); }
  };

  const applyFilters = (data: Payment[]) => {
    let f = [...data];
    if (searchTerm) f = f.filter(p => p.id.toLowerCase().includes(searchTerm.toLowerCase()) || (p.quote_id || '').toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredPayments(f);
  };

  const openGuaranteeModal = (payment: Payment) => {
    setGuaranteePayment(payment);
    setGuaranteeDecision('full_return');
    const maxReleasable = Math.max(0, (payment.guarantee_amount || 0) - (payment.refund_amount || 0));
    setGuaranteeReturnAmount(maxReleasable);
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
      const maxReleasable = Math.max(0, gAmt - (guaranteePayment.refund_amount || 0));
      switch (guaranteeDecision) {
        case 'full_return':
          gStatus = 'released_to_mover'; released = maxReleasable;
          notes = 'Restitution totale au déménageur. ' + guaranteeNotes; break;
        case 'no_return':
          gStatus = 'kept_for_client'; released = 0;
          notes = 'Aucune restitution - totalité au client. ' + guaranteeNotes; break;
        case 'partial_return': default:
          gStatus = 'partial_release'; released = guaranteeReturnAmount;
          notes = `Partiel: ${released}€ déménageur, ${maxReleasable - released}€ client. ${guaranteeNotes}`; break;
      }

      const { error } = await supabase.from('payments').update({
        guarantee_status: gStatus, guarantee_released_amount: released,
        guarantee_decision_at: new Date().toISOString(), guarantee_decision_by: userData.user?.id, guarantee_notes: notes,
        // Auto-release escrow when guarantee decision is made
        escrow_released: true, escrow_release_date: new Date().toISOString(),
        // Auto-set payout status to pending if money is released to mover
        ...(released > 0 ? { mover_payout_status: 'pending', mover_payout_amount: released, mover_payout_reference: `TTD-${guaranteePayment.id.substring(0, 8).toUpperCase()}` } : {}),
      }).eq('id', guaranteePayment.id);
      if (error) throw error;

      // Notify mover
      if (guaranteePayment.quote_id) {
        const { data: q } = await supabase.from('quotes').select('mover_id').eq('id', guaranteePayment.quote_id).maybeSingle();
        if (q) {
          const { data: m } = await supabase.from('movers').select('user_id').eq('id', q.mover_id).maybeSingle();
          if (m) {
            const t = gStatus === 'released_to_mover' ? '✅ Garantie restituée' : gStatus === 'kept_for_client' ? '❌ Garantie retenue' : '⚠️ Garantie partielle';
            const msg = gStatus === 'released_to_mover' ? `Garantie de ${released}€ restituée. Le virement sera effectué sous 48h.` : gStatus === 'kept_for_client' ? `Garantie de ${gAmt}€ retenue pour le client.` : `${released}€/${gAmt}€ restitués. Le virement sera effectué sous 48h.`;
            await supabase.from('notifications').insert({ user_id: m.user_id, user_type: 'mover', title: t, message: msg, type: 'payment', related_id: guaranteePayment.id, read: false });
          }
        }
      }
      showToast('Décision garantie enregistrée' + (released > 0 ? ' — virement ajouté à l\'onglet Virements' : ''), 'success');
      setShowGuaranteeModal(false); setGuaranteePayment(null);
      loadFinancialData();
    } catch { showToast('Erreur décision garantie', 'error'); }
    finally { setProcessingGuarantee(false); }
  };

  const handleCreateRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) { showToast('Remplissez tous les champs', 'error'); return; }
    const amount = parseFloat(refundAmount);
    const maxRefundable = selectedPayment.deposit_amount - selectedPayment.refund_amount;
    if (isNaN(amount) || amount <= 0 || amount > maxRefundable) { showToast(`Montant invalide (max: ${maxRefundable.toFixed(2)}€)`, 'error'); return; }

    const policyLabels: Record<string, string> = {
      'full': 'Annulation J-10+ : remboursement intégral',
      'half': 'Annulation J-5 à J-9 : remboursement 50%',
      'custom': 'Montant personnalisé',
    };
    const reasonText = `${policyLabels[refundReason] || refundReason}${refundNotes ? ' — ' + refundNotes : ''}`;

    try {
      const { error } = await supabase.from('refunds').insert({ payment_id: selectedPayment.id, client_id: selectedPayment.client_id, quote_id: selectedPayment.quote_id, amount, reason: reasonText, status: 'pending' });
      if (error) throw error;
      showToast('Remboursement créé', 'success');
      setShowRefundModal(false); setSelectedPayment(null); setRefundAmount(''); setRefundReason(''); setRefundNotes('');
      loadFinancialData();
    } catch { showToast('Erreur', 'error'); }
  };

  const handleProcessRefund = async (refundId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    try {
      if (newStatus === 'approved') {
        const { data: refund, error: refundFetchError } = await supabase.from('refunds').select('payment_id, amount, reason').eq('id', refundId).single();
        if (refundFetchError || !refund) throw new Error('Remboursement introuvable');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        showToast('Traitement du remboursement Stripe en cours...', 'info');

        const response = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseAnonKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: refund.payment_id, refundAmount: refund.amount, reason: refund.reason, refundId }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erreur Stripe');
        showToast(`✅ Remboursement Stripe effectué: ${result.stripeRefundId}`, 'success');
      } else {
        const { error } = await supabase.from('refunds').update({ status: newStatus, processed_at: new Date().toISOString() }).eq('id', refundId);
        if (error) throw error;
        showToast(`Remboursement ${newStatus === 'rejected' ? 'rejeté' : 'complété'}`, 'success');
      }
      loadFinancialData();
    } catch (err: any) { showToast(err.message || 'Erreur', 'error'); }
  };

  // ─── VIREMENTS (Payouts) ───

  const handleMarkAsPaid = async (paymentId: string) => {
    if (!confirm('Confirmer que le virement SEPA a été effectué ?')) return;
    try {
      const { error } = await supabase.from('payments').update({
        mover_payout_status: 'paid',
        mover_payout_date: new Date().toISOString(),
      }).eq('id', paymentId);
      if (error) throw error;

      // Notify mover
      const payment = payments.find(p => p.id === paymentId);
      if (payment?.quote_id) {
        const { data: q } = await supabase.from('quotes').select('mover_id').eq('id', payment.quote_id).maybeSingle();
        if (q) {
          const { data: m } = await supabase.from('movers').select('user_id').eq('id', q.mover_id).maybeSingle();
          if (m) {
            await supabase.from('notifications').insert({
              user_id: m.user_id, user_type: 'mover',
              title: '💰 Virement effectué',
              message: `Votre garantie de ${payment.mover_payout_amount || payment.guarantee_released_amount}€ a été virée sur votre compte bancaire.`,
              type: 'payment', related_id: paymentId, read: false,
            });
          }
        }
      }
      showToast('✅ Virement marqué comme effectué', 'success');
      loadFinancialData();
    } catch { showToast('Erreur', 'error'); }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedPayouts.size === 0) { showToast('Sélectionnez au moins un virement', 'error'); return; }
    if (!confirm(`Marquer ${selectedPayouts.size} virement(s) comme effectué(s) ?`)) return;
    try {
      for (const paymentId of selectedPayouts) {
        await supabase.from('payments').update({ mover_payout_status: 'paid', mover_payout_date: new Date().toISOString() }).eq('id', paymentId);
      }
      showToast(`✅ ${selectedPayouts.size} virement(s) marqué(s) comme effectué(s)`, 'success');
      setSelectedPayouts(new Set());
      loadFinancialData();
    } catch { showToast('Erreur', 'error'); }
  };

  const togglePayoutSelection = (paymentId: string) => {
    setSelectedPayouts(prev => {
      const next = new Set(prev);
      if (next.has(paymentId)) next.delete(paymentId); else next.add(paymentId);
      return next;
    });
  };

  const selectAllPending = () => {
    const pendingIds = payouts.filter(p => p.status === 'pending' || p.status === 'ready_to_pay').map(p => p.paymentId);
    setSelectedPayouts(new Set(pendingIds));
  };

  const exportCSV = (onlySelected: boolean) => {
    const toExport = onlySelected
      ? payouts.filter(p => selectedPayouts.has(p.paymentId))
      : payouts.filter(p => p.status === 'pending' || p.status === 'ready_to_pay');

    if (toExport.length === 0) { showToast('Aucun virement à exporter', 'error'); return; }

    // Standard SEPA CSV format
    const headers = ['Nom bénéficiaire', 'IBAN', 'BIC', 'Montant (EUR)', 'Référence', 'Motif'];
    const rows = toExport.map(p => [
      p.moverAccountHolder || p.moverName,
      p.moverIban,
      p.moverBic,
      p.amount.toFixed(2),
      p.reference,
      `Garantie demenagement ${p.reference}`,
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virements_TTD_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📥 ${toExport.length} virement(s) exporté(s)`, 'success');
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

  const getPayoutBadge = (s: string) => {
    switch (s) {
      case 'pending': return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">⏳ À virer</span>;
      case 'ready_to_pay': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">📋 Prêt</span>;
      case 'paid': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">✅ Viré</span>;
      case 'failed': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">❌ Échoué</span>;
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

  const pendingPayoutsCount = payouts.filter(p => p.status === 'pending' || p.status === 'ready_to_pay').length;

  return (
    <div className="space-y-6">
      {/* Guarantee Modal */}
      {showGuaranteeModal && guaranteePayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Euro className="w-6 h-6 text-emerald-600" />Décision Garantie</h3>
            <p className="text-sm text-gray-500 mb-2">Garantie initiale: {(guaranteePayment.guarantee_amount || 0).toLocaleString('fr-FR')} €</p>
            {guaranteePayment.refund_amount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-800 font-medium">⚠️ {guaranteePayment.refund_amount.toLocaleString('fr-FR')} € déjà remboursé au client</p>
                <p className="text-xs text-red-700">Montant maximum libérable: {Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0)).toLocaleString('fr-FR')} €</p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-green-50 ${guaranteeDecision === 'full_return' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="gd" checked={guaranteeDecision === 'full_return'} onChange={() => { setGuaranteeDecision('full_return'); setGuaranteeReturnAmount(Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0))); }} />
                <div><span className="font-medium">Restitution totale</span><p className="text-xs text-gray-500">Totalité restante restituée au déménageur ({Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0)).toLocaleString('fr-FR')} €)</p></div>
                <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-yellow-50 ${guaranteeDecision === 'partial_return' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}>
                <input type="radio" name="gd" checked={guaranteeDecision === 'partial_return'} onChange={() => { setGuaranteeDecision('partial_return'); setGuaranteeReturnAmount(Math.round(Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0)) * 0.5)); }} />
                <div className="flex-1">
                  <span className="font-medium">Restitution partielle</span>
                  <p className="text-xs text-gray-500">Montant au déménageur, reste au client</p>
                  {guaranteeDecision === 'partial_return' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input type="number" value={guaranteeReturnAmount} onChange={(e) => setGuaranteeReturnAmount(Math.min(Number(e.target.value), Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0))))} min={0} max={Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0))} className="w-28 px-3 py-1 border rounded text-sm" />
                      <span className="text-sm text-gray-600">€ → déménageur</span>
                    </div>
                  )}
                  {guaranteeDecision === 'partial_return' && (
                    <p className="text-xs text-orange-600 mt-1">{(Math.max(0, (guaranteePayment.guarantee_amount || 0) - (guaranteePayment.refund_amount || 0)) - guaranteeReturnAmount).toLocaleString('fr-FR')} € → client</p>
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
      {showRefundModal && selectedPayment && (() => {
        const maxRefundable = selectedPayment.deposit_amount - selectedPayment.refund_amount;
        const movingDate = selectedPayment.moving_date ? new Date(selectedPayment.moving_date) : null;
        const today = new Date();
        const daysBeforeMoving = movingDate ? Math.ceil((movingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

        // Stripe fees: use REAL fee from webhook if available, otherwise estimate
        const hasRealFee = selectedPayment.stripe_fee > 0;
        const stripeFeeEstimate = hasRealFee
          ? selectedPayment.stripe_fee
          : Math.round((selectedPayment.deposit_amount * 0.015 + 0.25) * 100) / 100;
        const feeLabel = hasRealFee
          ? `Frais Stripe réels (${selectedPayment.stripe_card_brand || 'carte'}${selectedPayment.stripe_card_country ? ' ' + selectedPayment.stripe_card_country : ''})`
          : 'Frais Stripe (estimés 1.5% + 0.25€)';

        // Helper: compute refund amount after Stripe fee deduction
        const afterFees = (grossAmount: number) => Math.max(0, Math.round((grossAmount - stripeFeeEstimate) * 100) / 100);

        const policies = [
          { id: 'full', label: 'J-10 ou plus : Remboursement intégral', sublabel: 'Commission intégrale moins frais Stripe', percentage: 100, icon: '✓', color: 'green', match: daysBeforeMoving !== null && daysBeforeMoving >= 10 },
          { id: 'half', label: 'Entre J-9 et J-5 : Remboursement 50%', sublabel: '50% de la commission moins frais Stripe', percentage: 50, icon: '!', color: 'yellow', match: daysBeforeMoving !== null && daysBeforeMoving >= 5 && daysBeforeMoving <= 9 },
          { id: 'custom', label: 'Montant personnalisé', sublabel: 'Saisir un montant manuellement', percentage: -1, icon: '✎', color: 'gray', match: false },
        ];

        const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
          green: { bg: 'bg-green-50', border: 'border-green-300 ring-green-500', text: 'text-green-700', icon: 'text-green-600' },
          yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300 ring-yellow-500', text: 'text-yellow-700', icon: 'text-yellow-600' },
          red: { bg: 'bg-red-50', border: 'border-red-300 ring-red-500', text: 'text-red-700', icon: 'text-red-600' },
          gray: { bg: 'bg-gray-50', border: 'border-gray-300 ring-gray-500', text: 'text-gray-700', icon: 'text-gray-500' },
        };

        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Créer un Remboursement</h3>

            {/* Payment summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Commission encaissée (Stripe)</span><span className="font-semibold">{selectedPayment.deposit_amount.toFixed(2)} €</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">└ Commission plateforme</span><span>{selectedPayment.platform_commission.toFixed(2)} €</span></div>
              {selectedPayment.escrow_amount > 0 && (
                <div className="flex justify-between text-xs"><span className="text-gray-500">└ Garantie</span><span>{selectedPayment.escrow_amount.toFixed(2)} €</span></div>
              )}
              <div className="flex justify-between text-xs text-orange-600"><span>└ {feeLabel}</span><span>-{stripeFeeEstimate.toFixed(2)} €</span></div>
              {selectedPayment.refund_amount > 0 && (
                <div className="flex justify-between text-red-600"><span>Déjà remboursé</span><span>-{selectedPayment.refund_amount.toFixed(2)} €</span></div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-blue-700">
                <span>Remboursable restant (hors frais Stripe)</span>
                <span>{afterFees(maxRefundable).toFixed(2)} €</span>
              </div>
            </div>

            {/* Moving date info */}
            {movingDate && daysBeforeMoving !== null && (
              <div className={`rounded-lg p-3 mb-4 text-sm flex items-center gap-2 ${
                daysBeforeMoving >= 10 ? 'bg-green-50 text-green-800' :
                daysBeforeMoving >= 5 ? 'bg-yellow-50 text-yellow-800' :
                'bg-red-50 text-red-800'
              }`}>
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Date de déménagement : <strong>{movingDate.toLocaleDateString('fr-FR')}</strong> — <strong>J-{daysBeforeMoving > 0 ? daysBeforeMoving : 0}</strong></span>
              </div>
            )}

            {/* Cancellation policy options */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Barème d'annulation contractuel</label>
              {policies.map((policy) => {
                const c = colorMap[policy.color];
                const isSelected = refundReason === policy.id;
                const isRecommended = policy.match;
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => {
                      setRefundReason(policy.id);
                      if (policy.percentage >= 0) {
                        const gross = Math.min(maxRefundable, Math.round(maxRefundable * policy.percentage / 100 * 100) / 100);
                        setRefundAmount(afterFees(gross).toString());
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected ? `${c.bg} ${c.border} ring-2` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`font-bold text-lg mt-0.5 ${isSelected ? c.icon : 'text-gray-400'}`}>{policy.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isSelected ? c.text : 'text-gray-700'}`}>{policy.label}</span>
                          {isRecommended && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>Recommandé</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{policy.sublabel}</p>
                        {policy.percentage >= 0 && (() => {
                          const gross = Math.min(maxRefundable, Math.round(maxRefundable * policy.percentage / 100 * 100) / 100);
                          const net = afterFees(gross);
                          return (
                            <p className={`text-xs font-semibold mt-1 ${isSelected ? c.text : 'text-gray-400'}`}>
                              → {net.toFixed(2)} € <span className="font-normal">(= {gross.toFixed(2)} € − {stripeFeeEstimate.toFixed(2)} € frais Stripe)</span>
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom amount input (always visible but highlighted when custom selected) */}
            <div className={`space-y-3 p-3 rounded-lg border ${refundReason === 'custom' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
              <div>
                <label className="block text-sm font-medium mb-1">Montant du remboursement (max: {afterFees(maxRefundable).toFixed(2)} €)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => { setRefundAmount(e.target.value); if (refundReason !== 'custom') setRefundReason('custom'); }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  max={maxRefundable}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes / Justification</label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Raison détaillée du remboursement..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRefundModal(false); setSelectedPayment(null); setRefundAmount(''); setRefundReason(''); setRefundNotes(''); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreateRefund} disabled={!refundAmount || parseFloat(refundAmount) <= 0} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Créer le remboursement</button>
            </div>
          </div>
        </div>
        );
      })()}

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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview' as FinancialTab, label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'payments' as FinancialTab, label: 'Paiements', icon: Wallet },
          { id: 'refunds' as FinancialTab, label: 'Remboursements', icon: ArrowLeftRight },
          { id: 'virements' as FinancialTab, label: `Virements${pendingPayoutsCount > 0 ? ` (${pendingPayoutsCount})` : ''}`, icon: Send },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.id === 'virements' && pendingPayoutsCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingPayoutsCount}</span>
            )}
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
          {/* Payout quick stats */}
          {(summary.pendingPayouts > 0 || summary.completedPayouts > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">{summary.pendingPayouts} virement(s) en attente</p>
                  <p className="text-sm text-amber-700">{summary.completedPayouts} virement(s) effectué(s)</p>
                </div>
              </div>
              {summary.pendingPayouts > 0 && (
                <button onClick={() => setActiveTab('virements')} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
                  Voir les virements →
                </button>
              )}
            </div>
          )}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remboursé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde Dispo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garantie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Virement</th>
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
                    <td className="px-4 py-4 text-sm">
                      {(p.refund_amount > 0 || p.pending_refund_amount > 0) ? (
                        <div className="space-y-1">
                          {p.refund_amount > 0 && (
                            <span className="text-red-600 font-semibold block">-{p.refund_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                          )}
                          {p.pending_refund_amount > 0 && (
                            <span className="text-orange-500 text-xs block">⏳ {p.pending_refund_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} en attente</span>
                          )}
                          <button onClick={() => { setRefundFilterPaymentId(p.id); setActiveTab('refunds'); }}
                            className="text-blue-500 hover:text-blue-700 text-xs underline">Voir détails</button>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`font-semibold ${(p.deposit_amount - p.refund_amount) > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {(p.deposit_amount - p.refund_amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {p.guarantee_amount > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">{p.guarantee_amount.toLocaleString('fr-FR')} €</p>
                          {getGuaranteeBadge(p.guarantee_status)}
                          {p.guarantee_status === 'released_to_mover' && <p className="text-xs text-green-700">→ {p.guarantee_released_amount.toLocaleString('fr-FR')} € déménageur</p>}
                          {p.guarantee_status === 'kept_for_client' && <p className="text-xs text-red-700">→ {p.guarantee_amount.toLocaleString('fr-FR')} € client</p>}
                          {p.guarantee_status === 'partial_release' && (
                            <>
                              <p className="text-xs text-blue-700">→ {(p.guarantee_released_amount || 0).toLocaleString('fr-FR')} € déménageur</p>
                              <p className="text-xs text-orange-700">→ {((p.guarantee_amount || 0) - (p.guarantee_released_amount || 0)).toLocaleString('fr-FR')} € client</p>
                            </>
                          )}
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {p.mover_payout_status === 'paid' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">✅ Viré</span>
                      ) : p.mover_payout_status === 'pending' && p.guarantee_released_amount > 0 ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">⏳ À virer</span>
                      ) : p.guarantee_status === 'held' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : p.guarantee_status === 'kept_for_client' ? (
                        <span className="text-xs text-gray-400">N/A</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Show Décider Garantie only if guarantee exists and is still held */}
                        {p.guarantee_amount > 0 && p.guarantee_status === 'held' && (
                          <button onClick={() => openGuaranteeModal(p)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 flex items-center gap-1"><Shield className="w-3 h-3" />Décider Garantie</button>
                        )}
                        {/* Show Modifier only for partial_release (not for released_to_mover or kept_for_client which are final) */}
                        {p.guarantee_amount > 0 && p.guarantee_status === 'partial_release' && p.mover_payout_status !== 'paid' && (
                          <button onClick={() => openGuaranteeModal(p)} className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 flex items-center gap-1"><Shield className="w-3 h-3" />Modifier</button>
                        )}
                        {p.has_damage_report && (
                          <button onClick={() => onNavigateToDisputes?.(p.quote_request_id)} className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Litige</button>
                        )}
                        {/* Show Rembourser if there's still money to refund */}
                        {p.deposit_amount - p.refund_amount > 0 && (p.guarantee_status === 'held' || p.guarantee_status === 'none') && (
                          <button onClick={() => { setSelectedPayment(p); setShowRefundModal(true); }} className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">Rembourser</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">Aucun paiement trouvé</td></tr>
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
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Demandes de Remboursement</h3>
              <div className="flex items-center gap-2">
                {refundFilterPaymentId && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Filtre: Paiement {refundFilterPaymentId.substring(0, 8)}...</span>
                    <button onClick={() => setRefundFilterPaymentId(null)} className="text-sm text-gray-500 hover:text-red-600 underline">Voir tout</button>
                  </div>
                )}
                <button onClick={async () => {
                  const filteredRefunds = refundFilterPaymentId ? refunds.filter(r => r.payment_id === refundFilterPaymentId) : refunds;
                  if (filteredRefunds.length === 0) { showToast('Aucun remboursement à exporter', 'info'); return; }
                  // Fetch client details for each refund
                  const clientIds = [...new Set(filteredRefunds.map(r => r.client_id).filter(Boolean))];
                  const clientInfo: Record<string, { name: string; email: string }> = {};
                  if (clientIds.length > 0) {
                    // Try clients table first
                    const { data: clientsData } = await supabase.from('clients').select('user_id, first_name, last_name, email').in('user_id', clientIds);
                    if (clientsData) clientsData.forEach((c: any) => { clientInfo[c.user_id] = { name: [c.first_name, c.last_name].filter(Boolean).join(' '), email: c.email || '' }; });
                    // For any missing, try auth users
                    const missing = clientIds.filter(id => !clientInfo[id]?.email);
                    if (missing.length > 0) {
                      const { data: authUsers } = await supabase.rpc('get_all_users');
                      if (authUsers) authUsers.forEach((u: any) => { if (missing.includes(u.id)) { clientInfo[u.id] = { name: clientInfo[u.id]?.name || '', email: u.email || '' }; } });
                    }
                  }
                  const BOM = '\uFEFF';
                  const headers = ['ID Remboursement', 'ID Paiement', 'Nom Client', 'Email Client', 'Montant', 'Raison', 'Statut', 'Date demande', 'Date traitement'];
                  const rows = filteredRefunds.map(r => {
                    const client = clientInfo[r.client_id] || { name: '', email: '' };
                    return [
                      r.id,
                      r.payment_id,
                      '"' + (client.name || 'N/A').replace(/"/g, '""') + '"',
                      client.email || 'N/A',
                      r.amount.toFixed(2) + ' €',
                      '"' + (r.reason || '').replace(/"/g, '""') + '"',
                      r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvé' : r.status === 'rejected' ? 'Rejeté' : 'Complété',
                      new Date(r.requested_at).toLocaleDateString('fr-FR'),
                      r.processed_at ? new Date(r.processed_at).toLocaleDateString('fr-FR') : '—',
                    ];
                  });
                  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
                  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `remboursements_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  showToast('Export réussi', 'success');
                }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                  <Download className="w-4 h-4" /> Exporter
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  const filteredRefunds = refundFilterPaymentId
                    ? refunds.filter(r => r.payment_id === refundFilterPaymentId)
                    : refunds;
                  return filteredRefunds.length > 0 ? filteredRefunds.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">{r.id.substring(0, 8)}...</td>
                      <td className="px-4 py-4 text-sm">
                        <button onClick={() => { setRefundFilterPaymentId(r.payment_id); }}
                          className="text-blue-600 hover:underline text-xs font-mono">{r.payment_id.substring(0, 8)}...</button>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold">{r.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
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
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune demande</td></tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIREMENTS TAB */}
      {activeTab === 'virements' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" />Virements Déménageurs</h3>
                {pendingPayoutsCount > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">{pendingPayoutsCount} en attente</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={selectAllPending} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />Tout sélectionner
                </button>
                <button onClick={() => exportCSV(false)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
                  <Download className="w-4 h-4" />Exporter CSV (en attente)
                </button>
                {selectedPayouts.size > 0 && (
                  <>
                    <button onClick={() => exportCSV(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1">
                      <Download className="w-4 h-4" />Exporter sélection ({selectedPayouts.size})
                    </button>
                    <button onClick={handleBulkMarkAsPaid} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />Marquer viré ({selectedPayouts.size})
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* How it works info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Comment ça marche :</strong> Quand vous libérez une garantie, le virement apparaît ici. 
              Exportez le CSV → Importez-le dans votre banque en ligne → Les virements SEPA partent automatiquement → 
              Revenez ici et cliquez "Marquer comme viré".
            </p>
          </div>

          {/* Payouts table */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center w-10">
                      <input type="checkbox" checked={selectedPayouts.size === payouts.filter(p => p.status !== 'paid').length && payouts.filter(p => p.status !== 'paid').length > 0}
                        onChange={(e) => { if (e.target.checked) selectAllPending(); else setSelectedPayouts(new Set()); }}
                        className="w-4 h-4 rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Déménageur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IBAN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BIC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date décision</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payouts.length > 0 ? payouts.map((p) => (
                    <tr key={p.paymentId} className={`hover:bg-gray-50 ${selectedPayouts.has(p.paymentId) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        {p.status !== 'paid' && (
                          <input type="checkbox" checked={selectedPayouts.has(p.paymentId)}
                            onChange={() => togglePayoutSelection(p.paymentId)} className="w-4 h-4 rounded" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold">{p.moverName}</p>
                        <p className="text-xs text-gray-500">{p.moverAccountHolder}</p>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{p.moverIban || <span className="text-red-500">⚠️ Manquant</span>}</code>
                      </td>
                      <td className="px-4 py-4 text-sm font-mono">{p.moverBic || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="text-lg font-bold text-emerald-700">{p.amount.toFixed(2)} €</span>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{p.reference}</code>
                      </td>
                      <td className="px-4 py-4">{getPayoutBadge(p.status)}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {p.guaranteeDecisionAt ? new Date(p.guaranteeDecisionAt).toLocaleDateString('fr-FR') : '—'}
                        {p.status === 'paid' && p.payoutDate && (
                          <p className="text-xs text-green-600">Viré le {new Date(p.payoutDate).toLocaleDateString('fr-FR')}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {(p.status === 'pending' || p.status === 'ready_to_pay') && (
                          <button onClick={() => handleMarkAsPaid(p.paymentId)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1 ml-auto">
                            <CheckCircle className="w-3 h-3" />Marquer viré
                          </button>
                        )}
                        {p.status === 'paid' && (
                          <span className="text-xs text-green-600 font-medium">✅ Effectué</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-lg font-medium">Aucun virement en attente</p>
                      <p className="text-sm">Les virements apparaîtront ici quand vous libérerez des garanties</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {payouts.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{payouts.length} virement(s) total</span>
                  <div className="flex items-center gap-4">
                    <span className="text-orange-600 font-medium">En attente: {payouts.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0).toFixed(2)} €</span>
                    <span className="text-green-600 font-medium">Viré: {payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0).toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}