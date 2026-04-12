import { useState, useEffect, useMemo } from 'react';
import {
  Phone, PhoneOff, PhoneCall, PhoneForwarded, Mail, Send, Search,
  ChevronDown, Users, Clock, CheckCircle, Upload, RefreshCw, Eye, X,
  Download, RotateCw, Trash2, Globe, CheckSquare, Square, Building2, MessageSquare, UserPlus, Pencil, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import ImportMoversModal from './ImportMoversModal';
import * as XLSX from 'xlsx';

interface MoverProspect {
  id: string;
  company_name: string;
  siret: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  postal_code: string;
  city: string;
  department: string;
  region: string;
  activity: string;
  manager_firstname: string;
  manager_lastname: string;
  has_phone: boolean;
  discovery_email_sent: boolean;
  discovery_email_sent_at: string | null;
  call_status: string;
  call_notes: string;
  called_at: string | null;
  callback_date: string | null;
  invitation_status: string;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  invitation_clicked_at: string | null;
  mover_verification_status: string | null;
  user_id: string | null;
  raw_data: Record<string, any>;
  created_at: string;
}

type CallStatus = 'not_called' | 'called_interested' | 'called_not_interested' | 'called_no_answer' | 'callback_later';
type TabFilter = 'all' | 'to_call' | 'to_call_not_called' | 'to_call_no_answer' | 'to_call_callback_later' | 'not_interested' | 'interested' | 'invited' | 'signed_up' | 'no_phone';

const CALL_STATUS_CONFIG: Record<CallStatus, { label: string; color: string; icon: any; bg: string }> = {
  not_called: { label: 'Pas appelé', color: 'text-gray-600', icon: Phone, bg: 'bg-gray-100' },
  called_interested: { label: 'Intéressé', color: 'text-green-600', icon: PhoneForwarded, bg: 'bg-green-100' },
  called_not_interested: { label: 'Pas intéressé', color: 'text-red-600', icon: PhoneOff, bg: 'bg-red-100' },
  called_no_answer: { label: 'Pas de réponse', color: 'text-yellow-600', icon: PhoneCall, bg: 'bg-yellow-100' },
  callback_later: { label: 'À rappeler', color: 'text-blue-600', icon: Clock, bg: 'bg-blue-100' },
};

const EMAIL_DELAY_MS = 600;
const MAX_BULK_EMAILS = 50;

export default function AdminMoverProspects({ adminRole = '' }: { adminRole?: string }) {
  const [prospects, setProspects] = useState<MoverProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [savingEmailInline, setSavingEmailInline] = useState(false);

  const handleSaveMoverEmail = async (prospectId: string) => {
    const trimmed = editEmailValue.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { showToast('Email invalide', 'error'); return; }
    setSavingEmailInline(true);
    try {
      const { error } = await supabase.from('mover_prospects').update({ email: trimmed }).eq('id', prospectId);
      if (error) throw error;
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, email: trimmed } : p));
      showToast('Email mis à jour', 'success');
      setEditingEmailId(null);
    } catch (err: any) { showToast(`Erreur: ${err.message}`, 'error'); }
    finally { setSavingEmailInline(false); }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [sendingAction, setSendingAction] = useState<string | null>(null);
  const [updatingCall, setUpdatingCall] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });
  const [selectedProspect, setSelectedProspect] = useState<MoverProspect | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => { fetchProspects(); }, []);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('mover_prospects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProspects(data || []);
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const all = prospects;
    const withPhone = all.filter(p => p.has_phone);
    return {
      total: all.length,
      toCall: withPhone.filter(p => ['not_called', 'called_no_answer', 'callback_later'].includes(p.call_status) && p.invitation_status === 'not_invited').length,
      notCalled: withPhone.filter(p => p.call_status === 'not_called' && p.invitation_status === 'not_invited').length,
      noAnswer: withPhone.filter(p => p.call_status === 'called_no_answer' && p.invitation_status === 'not_invited').length,
      callbackLater: withPhone.filter(p => p.call_status === 'callback_later' && p.invitation_status === 'not_invited').length,
      notInterested: withPhone.filter(p => p.call_status === 'called_not_interested' && p.invitation_status === 'not_invited').length,
      interested: withPhone.filter(p => p.call_status === 'called_interested' && p.invitation_status === 'not_invited').length,
      invited: all.filter(p => p.invitation_status === 'invited').length,
      signedUp: all.filter(p => p.invitation_status === 'signed_up').length,
      noPhone: all.filter(p => !p.has_phone).length,
    };
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    let f = prospects;
    switch (tabFilter) {
      case 'to_call': f = f.filter(p => p.has_phone && ['not_called', 'called_no_answer', 'callback_later'].includes(p.call_status) && p.invitation_status === 'not_invited'); break;
      case 'to_call_not_called': f = f.filter(p => p.has_phone && p.call_status === 'not_called' && p.invitation_status === 'not_invited'); break;
      case 'to_call_no_answer': f = f.filter(p => p.has_phone && p.call_status === 'called_no_answer' && p.invitation_status === 'not_invited'); break;
      case 'to_call_callback_later': f = f.filter(p => p.has_phone && p.call_status === 'callback_later' && p.invitation_status === 'not_invited'); break;
      case 'not_interested': f = f.filter(p => p.has_phone && p.call_status === 'called_not_interested' && p.invitation_status === 'not_invited'); break;
      case 'interested': f = f.filter(p => p.has_phone && p.call_status === 'called_interested' && p.invitation_status === 'not_invited'); break;
      case 'invited': f = f.filter(p => p.invitation_status === 'invited'); break;
      case 'signed_up': f = f.filter(p => p.invitation_status === 'signed_up'); break;
      case 'no_phone': f = f.filter(p => !p.has_phone); break;
    }
    if (searchTerm) {
      const l = searchTerm.toLowerCase();
      f = f.filter(p =>
        p.email.toLowerCase().includes(l) ||
        (p.company_name || '').toLowerCase().includes(l) ||
        (p.siret || '').toLowerCase().includes(l) ||
        (p.manager_firstname || '').toLowerCase().includes(l) ||
        (p.manager_lastname || '').toLowerCase().includes(l) ||
        (p.phone || '').replace(/\s/g, '').includes(l.replace(/\s/g, '')) ||
        (p.mobile || '').replace(/\s/g, '').includes(l.replace(/\s/g, '')) ||
        (p.city || '').toLowerCase().includes(l)
      );
    }
    return f;
  }, [prospects, tabFilter, searchTerm]);

  const updateCallStatus = async (id: string, status: CallStatus, notes?: string) => {
    setUpdatingCall(id);
    try {
      const updates: any = { call_status: status, called_at: new Date().toISOString() };
      if (notes !== undefined) updates.call_notes = notes;
      const { error } = await supabase.from('mover_prospects').update(updates).eq('id', id);
      if (error) throw error;
      setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      showToast(`Statut: ${CALL_STATUS_CONFIG[status].label}`, 'success');
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setUpdatingCall(null); }
  };

  const sendInvitation = async (prospect: MoverProspect, isResend = false) => {
    setSendingAction(prospect.id);
    setSendingInvite(true);
    try {
      const token = isResend ? prospect.invitation_token || crypto.randomUUID() : crypto.randomUUID();
      const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase.from('mover_prospects').update({
        invitation_status: 'invited',
        ...(!isResend && { invitation_token: token }),
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: expiresAt.toISOString(),
        call_status: 'called_interested',
      }).eq('id', prospect.id);

      let finalToken = token;
      if (isResend) {
        const { data } = await supabase.from('mover_prospects').select('invitation_token').eq('id', prospect.id).single();
        finalToken = data?.invitation_token || token;
      }

      const sbUrl = import.meta.env.VITE_SUPABASE_URL;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const resp = await fetch(`${sbUrl}/functions/v1/send-mover-invitation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: prospect.email,
          companyName: prospect.company_name,
          managerFirstname: prospect.manager_firstname,
          managerLastname: prospect.manager_lastname,
          siret: prospect.siret,
          phone: prospect.phone || prospect.mobile,
          token: finalToken,
        }),
      });
      if (!resp.ok) throw new Error('Erreur envoi email');

      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, invitation_status: 'invited', invitation_sent_at: new Date().toISOString(), call_status: 'called_interested' } : p));
      showToast(isResend ? `Invitation renvoyée à ${prospect.email}` : `Invitation envoyée à ${prospect.email}`, 'success');
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setSendingAction(null); setSendingInvite(false); }
  };

  const sendDiscoveryEmail = async (prospect: MoverProspect) => {
    setSendingAction(prospect.id);
    try {
      const sbUrl = import.meta.env.VITE_SUPABASE_URL;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const resp = await fetch(`${sbUrl}/functions/v1/send-prospect-discovery-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: prospect.email,
          companyName: prospect.company_name,
          managerFirstname: prospect.manager_firstname,
          managerLastname: prospect.manager_lastname,
          prospectType: 'mover',
        }),
      });
      if (!resp.ok) throw new Error('Erreur envoi');
      await supabase.from('mover_prospects').update({ discovery_email_sent: true, discovery_email_sent_at: new Date().toISOString() }).eq('id', prospect.id);
      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, discovery_email_sent: true, discovery_email_sent_at: new Date().toISOString() } : p));
      showToast(`Email envoyé à ${prospect.email}`, 'success');
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setSendingAction(null); }
  };

  const sendBulkEmails = async () => {
    const toSend = filteredProspects.filter(p => selectedIds.has(p.id) && !p.discovery_email_sent);
    if (toSend.length === 0) { showToast('Aucun email à envoyer', 'warning'); return; }
    const batch = toSend.slice(0, MAX_BULK_EMAILS);
    setBulkSending(true); setBulkProgress({ sent: 0, total: batch.length });
    const sbUrl = import.meta.env.VITE_SUPABASE_URL;
    const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    let sent = 0;
    for (const p of batch) {
      try {
        const r = await fetch(`${sbUrl}/functions/v1/send-prospect-discovery-email`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: p.email, companyName: p.company_name, managerFirstname: p.manager_firstname, managerLastname: p.manager_lastname, prospectType: 'mover' }),
        });
        if (r.ok) {
          await supabase.from('mover_prospects').update({ discovery_email_sent: true, discovery_email_sent_at: new Date().toISOString() }).eq('id', p.id);
          setProspects(prev => prev.map(pp => pp.id === p.id ? { ...pp, discovery_email_sent: true } : pp));
          sent++;
        }
      } catch (e) { /* skip */ }
      setBulkProgress({ sent, total: batch.length });
      await new Promise(r => setTimeout(r, EMAIL_DELAY_MS));
    }
    setBulkSending(false); setSelectedIds(new Set());
    showToast(`${sent}/${batch.length} email(s) envoyé(s)`, 'success');
  };

  const deleteProspect = async (id: string) => {
    if (!confirm('Supprimer ce prospect ?')) return;
    await supabase.from('mover_prospects').delete().eq('id', id);
    setProspects(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast('Prospect supprimé', 'success');
  };

  const deleteSelectedProspects = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} prospect(s) sélectionné(s) ?`)) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('mover_prospects').delete().eq('id', id);
    }
    setProspects(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    showToast(`${ids.length} prospect(s) supprimé(s)`, 'success');
  };

  const exportProspects = async (onlySelected = false) => {
    const pwd = window.prompt('Entrez le mot de passe pour exporter :');
    if (pwd === null) return;

    // Fetch export password from platform_settings
    const { data: settings } = await supabase.from('platform_settings').select('export_password').single();
    const exportPwd = settings?.export_password || 'Adminttd@Heikel';
    if (pwd !== exportPwd) { showToast('Mot de passe incorrect', 'error'); return; }
    const source = onlySelected && selectedIds.size > 0
      ? filteredProspects.filter(p => selectedIds.has(p.id))
      : filteredProspects;
    const data = source.map(p => ({
      'Raison sociale': p.company_name,
      SIRET: p.siret,
      Email: p.email,
      Téléphone: p.phone,
      Mobile: p.mobile,
      Ville: p.city,
      Département: p.department,
      Région: p.region,
      Dirigeant: [p.manager_firstname, p.manager_lastname].filter(Boolean).join(' '),
      'Statut appel': CALL_STATUS_CONFIG[p.call_status as CallStatus]?.label || p.call_status,
      'Statut invitation': p.invitation_status,
      'Email découverte': p.discovery_email_sent ? 'Oui' : 'Non',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Déménageurs');
    XLSX.writeFile(wb, `mover_prospects_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleSelectAll = () => {
    const ids = filteredProspects.map(p => p.id);
    setSelectedIds(ids.every(id => selectedIds.has(id)) ? new Set() : new Set(ids));
  };

  const handleSendInvitationFromModal = async (isResend: boolean) => {
    if (!selectedProspect) return;
    await sendInvitation(selectedProspect, isResend);
    // Refresh prospect in modal
    const { data } = await supabase.from('mover_prospects').select('*').eq('id', selectedProspect.id).single();
    if (data) setSelectedProspect(data);
  };

  const tabs: { id: TabFilter; label: string; count: number; icon?: any }[] = [
    { id: 'all', label: 'Tous', count: stats.total },
    { id: 'to_call', label: 'À appeler', count: stats.toCall },
    { id: 'not_interested', label: 'Pas intéressé', count: stats.notInterested },
    { id: 'interested', label: 'Intéressés', count: stats.interested },
    { id: 'invited', label: 'Invités', count: stats.invited },
    { id: 'signed_up', label: 'Inscrits', count: stats.signedUp },
    { id: 'no_phone', label: 'Sans téléphone', count: stats.noPhone, icon: Globe },
  ];

  const toCallSubTabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'to_call', label: 'Tous', count: stats.toCall },
    { id: 'to_call_not_called', label: 'Pas appelé', count: stats.notCalled },
    { id: 'to_call_no_answer', label: 'Pas de réponse', count: stats.noAnswer },
    { id: 'to_call_callback_later', label: 'À rappeler', count: stats.callbackLater },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prospects Déménageurs</h2>
          <p className="text-sm text-gray-500 mt-1">Importez, appelez, et invitez des déménageurs</p>
        </div>
        <div className="flex items-center gap-3">
          {adminRole === 'super_admin' && <button onClick={() => exportProspects(false)} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"><Download className="w-4 h-4" /> Exporter tout</button>}
          <button onClick={fetchProspects} className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Upload className="w-4 h-4" /> Importer</button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"><UserPlus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {tabs.map(tab => {
          const TI = tab.icon;
          const isActive = tabFilter === tab.id || (tab.id === 'to_call' && tabFilter.startsWith('to_call'));
          return (
            <button key={tab.id} onClick={() => { setTabFilter(tab.id); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
              {TI && <TI className="w-3.5 h-3.5" />}{tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for "À appeler" */}
      {tabFilter.startsWith('to_call') && (
        <div className="flex flex-wrap gap-2 pl-4">
          {toCallSubTabs.map(sub => (
            <button key={sub.id} onClick={() => { setTabFilter(sub.id); setSelectedIds(new Set()); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-colors ${tabFilter === sub.id ? 'bg-blue-100 text-blue-700 border border-blue-300 font-medium' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
              {sub.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tabFilter === sub.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>{sub.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Global selection bar */}
      {filteredProspects.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            {filteredProspects.every(p => selectedIds.has(p.id)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {filteredProspects.every(p => selectedIds.has(p.id)) ? 'Désélectionner' : `Tout sélectionner (${filteredProspects.length})`}
          </button>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-blue-600 dark:text-blue-300 font-medium">{selectedIds.size} sélectionné(s)</span>
              {adminRole === 'super_admin' && <button onClick={() => exportProspects(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800">
                <Download className="w-3.5 h-3.5" /> Exporter
              </button>}
              <button onClick={deleteSelectedProspects}
                className="flex items-center gap-2 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
              {tabFilter === 'no_phone' && (
                <button onClick={sendBulkEmails} disabled={bulkSending}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {bulkSending ? <>{bulkProgress.sent}/{bulkProgress.total}</> : <><Send className="w-3.5 h-3.5" /> Envoyer emails</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom, email, SIRET, téléphone, ville..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      </div>

      {/* Loading / Empty / List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div></div>
      ) : filteredProspects.length === 0 ? (
        <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun prospect déménageur</p></div>
      ) : (
        <div className="space-y-3">
          {filteredProspects.map(p => {
            const isNoPhone = tabFilter === 'no_phone';
            const isLocked = p.invitation_status === 'invited' || p.invitation_status === 'signed_up';
            const cc = CALL_STATUS_CONFIG[p.call_status as CallStatus] || CALL_STATUS_CONFIG.not_called;
            const CI = cc.icon;
            return (
              <div key={p.id} className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow ${selectedIds.has(p.id) ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Checkbox for selection */}
                  <button onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}>
                    {selectedIds.has(p.id) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                  </button>

                  {/* Prospect info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        {p.company_name || p.email}
                      </span>
                      {p.siret && <span className="text-xs text-gray-400 font-mono">SIRET: {p.siret}</span>}
                      {/* Call status badge (not shown for no-phone or locked) */}
                      {!isNoPhone && !isLocked && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cc.bg} ${cc.color}`}><CI className="w-3 h-3" />{cc.label}</span>
                      )}
                      {p.invitation_status === 'invited' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600"><Mail className="w-3 h-3" />Invité</span>}
                      {p.invitation_status === 'signed_up' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-600"><CheckCircle className="w-3 h-3" />Inscrit</span>}
                      {p.invitation_status === 'signed_up' && p.mover_verification_status && p.mover_verification_status !== 'verified' && (
                        p.mover_verification_status === 'contract_sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-600">✍️ Signature en attente</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-600"><Clock className="w-3 h-3" />Validation en attente</span>
                        )
                      )}
                      {p.invitation_status === 'signed_up' && p.mover_verification_status === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">✅ Validé</span>
                      )}
                      {isNoPhone && p.discovery_email_sent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-600"><CheckCircle className="w-3 h-3" />Email envoyé</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      {editingEmailId === p.id ? (
                        <span className="flex items-center gap-1">
                          <input type="email" value={editEmailValue} onChange={(e) => setEditEmailValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMoverEmail(p.id); }}
                            className="px-2 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48" autoFocus />
                          <button onClick={() => handleSaveMoverEmail(p.id)} disabled={savingEmailInline} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingEmailId(null)} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{p.email}</span>
                      )}
                      {(p.phone || p.mobile) ? (
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.phone || p.mobile}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-500"><PhoneOff className="w-3.5 h-3.5" />Sans tél</span>
                      )}
                      {p.city && <span className="text-xs text-gray-400">{p.city}{p.department ? ` (${p.department})` : ''}</span>}
                      {(p.manager_firstname || p.manager_lastname) && (
                        <span className="text-xs text-gray-400">Dirigeant: {[p.manager_firstname, p.manager_lastname].filter(Boolean).join(' ')}</span>
                      )}
                    </div>
                    {p.call_notes && <div className="mt-1 text-xs text-gray-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{p.call_notes}</div>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View detail */}
                    <button onClick={() => setSelectedProspect(p)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Voir détails"><Eye className="w-4 h-4" /></button>

                    {/* Edit email */}
                    <button onClick={() => { setEditingEmailId(p.id); setEditEmailValue(p.email); }} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title="Modifier email"><Pencil className="w-4 h-4" /></button>

                    {/* Delete */}
                    {p.invitation_status === 'not_invited' && (
                      <button onClick={() => deleteProspect(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    )}

                    {/* Call dropdown — with phone, not locked */}
                    {!isLocked && p.has_phone && !isNoPhone && (
                      <CallDropdown prospectId={p.id} currentStatus={p.call_status as CallStatus} onUpdate={updateCallStatus} loading={updatingCall === p.id} />
                    )}

                    {/* Invite button — interested, not yet invited */}
                    {p.call_status === 'called_interested' && p.invitation_status === 'not_invited' && p.has_phone && (
                      <button onClick={() => sendInvitation(p)} disabled={sendingAction === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {sendingAction === p.id ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div> : <Send className="w-3.5 h-3.5" />} Inviter
                      </button>
                    )}

                    {/* Resend invitation */}
                    {p.invitation_status === 'invited' && (
                      <button onClick={() => sendInvitation(p, true)} disabled={sendingAction === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                        {sendingAction === p.id ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div> : <RotateCw className="w-3.5 h-3.5" />} Renvoyer
                      </button>
                    )}

                    {/* Signed up badge */}
                    {p.invitation_status === 'signed_up' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg"><CheckCircle className="w-3.5 h-3.5" /> Inscrit</span>
                    )}

                    {/* Discovery email for no-phone */}
                    {isNoPhone && !p.discovery_email_sent && p.invitation_status === 'not_invited' && (
                      <button onClick={() => sendDiscoveryEmail(p)} disabled={sendingAction === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {sendingAction === p.id ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div> : <Globe className="w-3.5 h-3.5" />} Envoyer
                      </button>
                    )}
                    {isNoPhone && p.discovery_email_sent && p.invitation_status === 'not_invited' && (
                      <button onClick={() => sendDiscoveryEmail(p)} disabled={sendingAction === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/20">
                        <RotateCw className="w-3.5 h-3.5" /> Renvoyer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import modal */}
      {showImportModal && <ImportMoversModal onClose={() => setShowImportModal(false)} onImportComplete={() => { setShowImportModal(false); fetchProspects(); }} />}

      {/* Add single prospect modal */}
      {showAddModal && <AddSingleMoverModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchProspects(); }} />}

      {/* Prospect detail / call management modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdateCallStatus={async (status: CallStatus, notes?: string) => {
            await updateCallStatus(selectedProspect.id, status, notes);
            const { data } = await supabase.from('mover_prospects').select('*').eq('id', selectedProspect.id).single();
            if (data) setSelectedProspect(data);
          }}
          onSendInvitation={handleSendInvitationFromModal}
          sendingInvite={sendingInvite}
          onProspectUpdated={(updated) => {
            setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSelectedProspect(updated);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Call status dropdown component
// ============================================================
function CallDropdown({ prospectId, currentStatus, onUpdate, loading }: {
  prospectId: string; currentStatus: CallStatus; onUpdate: (id: string, status: CallStatus, notes?: string) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
        <PhoneCall className="w-3.5 h-3.5" /><span>Appel</span><ChevronDown className="w-3 h-3" />
      </button>
      {open && (<>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
          {(Object.entries(CALL_STATUS_CONFIG) as [CallStatus, typeof CALL_STATUS_CONFIG[CallStatus]][]).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <button key={status} onClick={() => { onUpdate(prospectId, status); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${currentStatus === status ? 'bg-gray-50 dark:bg-gray-700 font-medium' : ''}`}>
                <Icon className={`w-4 h-4 ${config.color}`} /><span className={config.color}>{config.label}</span>
                {currentStatus === status && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
              </button>
            );
          })}
        </div>
      </>)}
    </div>
  );
}

// ============================================================
// Prospect detail modal with call management + invitation
// ============================================================
function ProspectDetailModal({ prospect, onClose, onUpdateCallStatus, onSendInvitation, sendingInvite, onProspectUpdated }: {
  prospect: MoverProspect;
  onClose: () => void;
  onUpdateCallStatus: (status: CallStatus, notes?: string) => void;
  onSendInvitation: (isResend: boolean) => void;
  sendingInvite: boolean;
  onProspectUpdated?: (updated: MoverProspect) => void;
}) {
  const [callNotes, setCallNotes] = useState(prospect.call_notes || '');
  const [localCallStatus, setLocalCallStatus] = useState<CallStatus>(prospect.call_status as CallStatus);
  const isLocked = prospect.invitation_status === 'invited' || prospect.invitation_status === 'signed_up';

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: prospect.company_name || '',
    siret: prospect.siret || '',
    email: prospect.email || '',
    phone: prospect.phone || '',
    mobile: prospect.mobile || '',
    address: prospect.address || '',
    postal_code: prospect.postal_code || '',
    city: prospect.city || '',
    department: prospect.department || '',
    region: prospect.region || '',
    activity: prospect.activity || '',
    manager_firstname: prospect.manager_firstname || '',
    manager_lastname: prospect.manager_lastname || '',
  });

  const handleSaveAll = async () => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showToast('Email invalide', 'error'); return;
    }
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        company_name: form.company_name.trim(),
        siret: form.siret.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
        city: form.city.trim(),
        department: form.department.trim(),
        region: form.region.trim(),
        activity: form.activity.trim(),
        manager_firstname: form.manager_firstname.trim(),
        manager_lastname: form.manager_lastname.trim(),
        has_phone: !!(form.phone.trim() || form.mobile.trim()),
      };
      const { error } = await supabase.from('mover_prospects').update(updates).eq('id', prospect.id);
      if (error) throw error;
      // Update local prospect object
      Object.assign(prospect, updates);
      if (onProspectUpdated) onProspectUpdated({ ...prospect, ...updates });
      showToast('Prospect mis à jour', 'success');
      setEditing(false);
    } catch (err: any) { showToast(`Erreur: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const fieldInput = (label: string, field: string, type = 'text', colSpan = false) => (
    <div className={colSpan ? 'col-span-2' : ''} key={field}>
      <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
      {editing ? (
        <input type={type} value={(form as any)[field] || ''} onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
          className="mt-0.5 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      ) : (
        <p className="font-medium text-gray-900 dark:text-white text-sm">{(form as any)[field] || <span className="text-gray-400 italic">—</span>}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {prospect.company_name || prospect.email}
          </h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
            )}
            {editing && (
              <>
                <button onClick={() => { setEditing(false); setForm({ company_name: prospect.company_name || '', siret: prospect.siret || '', email: prospect.email || '', phone: prospect.phone || '', mobile: prospect.mobile || '', address: prospect.address || '', postal_code: prospect.postal_code || '', city: prospect.city || '', department: prospect.department || '', region: prospect.region || '', activity: prospect.activity || '', manager_firstname: prospect.manager_firstname || '', manager_lastname: prospect.manager_lastname || '' }); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
                <button onClick={handleSaveAll} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Company info — all editable */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {fieldInput('Raison sociale', 'company_name')}
            {fieldInput('SIRET', 'siret')}
            {fieldInput('Email', 'email', 'email')}
            {fieldInput('Téléphone fixe', 'phone', 'tel')}
            {fieldInput('Mobile', 'mobile', 'tel')}
            {fieldInput('Adresse', 'address')}
            {fieldInput('Code postal', 'postal_code')}
            {fieldInput('Ville', 'city')}
            {fieldInput('Département', 'department')}
            {fieldInput('Région', 'region')}
            {fieldInput('Activité', 'activity', 'text', true)}
            {fieldInput('Prénom dirigeant', 'manager_firstname')}
            {fieldInput('Nom dirigeant', 'manager_lastname')}
          </div>

          {/* Call status management (only if has phone and not locked) */}
          {prospect.has_phone !== false && !isLocked && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><PhoneCall className="w-4 h-4 text-blue-600" /> Statut d'appel</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(Object.entries(CALL_STATUS_CONFIG) as [CallStatus, typeof CALL_STATUS_CONFIG[CallStatus]][]).map(([status, config]) => {
                  const Icon = config.icon;
                  return (
                    <button key={status} onClick={() => setLocalCallStatus(status)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${localCallStatus === status ? `${config.bg} border-current ${config.color} font-medium` : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <Icon className="w-4 h-4" />{config.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Notes sur l'appel (optionnel)..."
                rows={2}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
              />
              <button onClick={() => { onUpdateCallStatus(localCallStatus, callNotes); showToast('Statut mis à jour', 'success'); }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"><CheckCircle className="w-4 h-4" /> Sauvegarder</button>
            </div>
          )}

          {/* Locked status message */}
          {isLocked && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Ce prospect est <strong>{prospect.invitation_status === 'signed_up' ? 'inscrit' : 'invité'}</strong>. Le statut d'appel est verrouillé.
              </div>
            </div>
          )}

          {/* Invitation section */}
          {(prospect.call_status === 'called_interested' || isLocked) && prospect.has_phone !== false && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-green-600" /> Invitation</h3>
              {prospect.invitation_status === 'not_invited' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-3">Ce déménageur est intéressé ! Envoyez-lui une invitation.</p>
                  <button onClick={() => onSendInvitation(false)} disabled={sendingInvite}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {sendingInvite ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Envoi...</> : <><Send className="w-4 h-4" /> Envoyer l'invitation</>}
                  </button>
                </div>
              )}
              {prospect.invitation_status === 'invited' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-blue-800"><Mail className="w-4 h-4 inline mr-1" /> Envoyée le {prospect.invitation_sent_at ? new Date(prospect.invitation_sent_at).toLocaleDateString('fr-FR') : '—'}</p>
                  <button onClick={() => onSendInvitation(true)} disabled={sendingInvite}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {sendingInvite ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Envoi...</> : <><RotateCw className="w-4 h-4" /> Renvoyer</>}
                  </button>
                </div>
              )}
              {prospect.invitation_status === 'signed_up' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800"><CheckCircle className="w-4 h-4 inline mr-1" /> Ce déménageur nous a rejoint.{' '}
                    {prospect.mover_verification_status === 'verified' ? <strong className="text-green-700">Validé.</strong> : <strong className="text-yellow-700">En attente.</strong>}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Add single mover prospect modal
// ============================================================
function AddSingleMoverModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    company_name: '', email: '', siret: '',
    phone: '', mobile: '', dirigeants: '',
    address: '', postal_code: '', city: '',
    department: '', activity: '', region: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.company_name.trim()) e.company_name = 'Raison sociale obligatoire';
    if (!form.email.trim()) e.email = 'Email obligatoire';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email invalide';
    if (!form.siret.trim()) e.siret = 'SIRET obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Check for duplicate email
      const { data: existing } = await supabase.from('mover_prospects').select('id').eq('email', form.email.trim().toLowerCase()).maybeSingle();
      if (existing) { setErrors({ email: 'Cet email existe déjà dans les prospects' }); setSaving(false); return; }

      // Parse dirigeants into firstname/lastname
      let manager_firstname = '', manager_lastname = '';
      if (form.dirigeants.trim()) {
        const parts = form.dirigeants.trim().split(/\s+/);
        if (parts.length >= 2) { manager_firstname = parts[0]; manager_lastname = parts.slice(1).join(' '); }
        else { manager_lastname = parts[0]; }
      }

      const hasPhone = !!(form.phone.trim() || form.mobile.trim());

      const { error } = await supabase.from('mover_prospects').insert({
        company_name: form.company_name.trim(),
        email: form.email.trim().toLowerCase(),
        siret: form.siret.trim(),
        phone: form.phone.trim(),
        mobile: form.mobile.trim(),
        manager_firstname,
        manager_lastname,
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
        city: form.city.trim(),
        department: form.department.trim(),
        activity: form.activity.trim(),
        region: form.region.trim(),
        has_phone: hasPhone,
        call_status: 'not_called',
        invitation_status: 'not_invited',
      });

      if (error) throw error;
      showToast('Prospect déménageur ajouté avec succès', 'success');
      onAdded();
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally { setSaving(false); }
  };

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const inputClass = (field: string) =>
    `w-full text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[field] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            Ajouter un prospect déménageur
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Required fields */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
            Les champs marqués <span className="text-red-500 font-bold">*</span> sont obligatoires
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison sociale <span className="text-red-500">*</span></label>
            <input type="text" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="Nom de l'entreprise" className={inputClass('company_name')} />
            {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@entreprise.com" className={inputClass('email')} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIRET <span className="text-red-500">*</span></label>
            <input type="text" value={form.siret} onChange={(e) => set('siret', e.target.value)} placeholder="12345678901234" className={inputClass('siret')} />
            {errors.siret && <p className="text-xs text-red-500 mt-1">{errors.siret}</p>}
          </div>

          {/* Optional fields */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Champs optionnels</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01 23 45 67 89" className={inputClass('phone')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mobile</label>
                <input type="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="06 12 34 56 78" className={inputClass('mobile')} />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dirigeant(s)</label>
              <input type="text" value={form.dirigeants} onChange={(e) => set('dirigeants', e.target.value)} placeholder="Prénom Nom" className={inputClass('dirigeants')} />
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
              <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 rue..." className={inputClass('address')} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Code postal</label>
                <input type="text" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} placeholder="75001" className={inputClass('postal_code')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ville</label>
                <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Paris" className={inputClass('city')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Département</label>
                <input type="text" value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="Paris" className={inputClass('department')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Activité</label>
                <input type="text" value={form.activity} onChange={(e) => set('activity', e.target.value)} placeholder="Déménagement" className={inputClass('activity')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Région</label>
                <input type="text" value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="Île-de-France" className={inputClass('region')} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Ajout...</> : <><UserPlus className="w-4 h-4" /> Ajouter</>}
          </button>
        </div>
      </div>
    </div>
  );
}