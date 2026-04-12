import { useState, useEffect, useMemo } from 'react';
import {
  Phone, PhoneOff, PhoneCall, PhoneForwarded, Mail, Send, Search,
  ChevronDown, Users, Clock, CheckCircle, Upload, RefreshCw, Eye, X,
  Download, RotateCw, Trash2, Globe, CheckSquare, Square, User, MessageSquare, UserPlus, Pencil, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import AddressAutocomplete from '../AddressAutocomplete';
import { calculateRealDistance } from '../../utils/distanceCalculator';
import ImportClientsModal from './ImportClientsModal';
import * as XLSX from 'xlsx';

interface ClientProspect {
  id: string; email: string; firstname: string; lastname: string; phone: string;
  has_phone: boolean; discovery_email_sent: boolean; discovery_email_sent_at: string | null;
  call_status: string; call_notes: string; called_at: string | null; callback_date: string | null;
  invitation_status: string; invitation_token: string | null; invitation_sent_at: string | null;
  invitation_expires_at: string | null; invitation_clicked_at: string | null;
  user_id: string | null; created_at: string;
  inscription_type?: string; initial_quote_data?: any;
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

export default function AdminClientProspects() {
  const [prospects, setProspects] = useState<ClientProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const handleSaveClientEmail = async (prospectId: string) => {
    const trimmed = editEmailValue.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { showToast('Email invalide', 'error'); return; }
    setSavingEmail(true);
    try {
      const { error } = await supabase.from('client_prospects').update({ email: trimmed }).eq('id', prospectId);
      if (error) throw error;
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, email: trimmed } : p));
      showToast('Email mis à jour', 'success');
      setEditingEmailId(null);
    } catch (err: any) { showToast(`Erreur: ${err.message}`, 'error'); }
    finally { setSavingEmail(false); }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [sendingAction, setSendingAction] = useState<string | null>(null);
  const [updatingCall, setUpdatingCall] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });
  const [selectedProspect, setSelectedProspect] = useState<ClientProspect | null>(null);

  useEffect(() => { fetchProspects(); }, []);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('client_prospects').select('*').order('created_at', { ascending: false });
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
      f = f.filter(p => p.email.toLowerCase().includes(l) || (p.firstname || '').toLowerCase().includes(l) || (p.lastname || '').toLowerCase().includes(l) || (p.phone || '').replace(/\s/g, '').includes(l.replace(/\s/g, '')));
    }
    return f;
  }, [prospects, tabFilter, searchTerm]);

  const updateCallStatus = async (id: string, status: CallStatus, notes?: string) => {
    setUpdatingCall(id);
    try {
      const updates: any = { call_status: status, called_at: new Date().toISOString() };
      if (notes !== undefined) updates.call_notes = notes;
      const { error } = await supabase.from('client_prospects').update(updates).eq('id', id);
      if (error) throw error;
      setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      showToast(`Statut: ${CALL_STATUS_CONFIG[status].label}`, 'success');
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setUpdatingCall(null); }
  };

  const sendInvitation = async (prospect: ClientProspect, isResend = false) => {
    setSendingAction(prospect.id);
    try {
      const token = isResend ? prospect.invitation_token || crypto.randomUUID() : crypto.randomUUID();
      const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase.from('client_prospects').update({
        invitation_status: 'invited',
        ...(!isResend && { invitation_token: token }),
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: expiresAt.toISOString(),
        call_status: 'called_interested',
      }).eq('id', prospect.id);

      let finalToken = token;
      if (isResend) {
        const { data } = await supabase.from('client_prospects').select('invitation_token').eq('id', prospect.id).single();
        finalToken = data?.invitation_token || token;
      }

      const sbUrl = import.meta.env.VITE_SUPABASE_URL;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const resp = await fetch(`${sbUrl}/functions/v1/send-client-invitation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prospect.email, firstname: prospect.firstname, lastname: prospect.lastname, token: finalToken, initialQuoteData: prospect.initial_quote_data || null }),
      });
      if (!resp.ok) throw new Error('Erreur envoi email');

      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, invitation_status: 'invited', invitation_sent_at: new Date().toISOString(), call_status: 'called_interested' } : p));
      showToast(isResend ? `Invitation renvoyée à ${prospect.email}` : `Invitation envoyée à ${prospect.email}`, 'success');
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setSendingAction(null); }
  };

  const sendDiscoveryEmail = async (prospect: ClientProspect) => {
    setSendingAction(prospect.id);
    try {
      const sbUrl = import.meta.env.VITE_SUPABASE_URL;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const resp = await fetch(`${sbUrl}/functions/v1/send-prospect-discovery-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prospect.email, managerFirstname: prospect.firstname, managerLastname: prospect.lastname, prospectType: 'client' }),
      });
      if (!resp.ok) throw new Error('Erreur envoi');
      await supabase.from('client_prospects').update({ discovery_email_sent: true, discovery_email_sent_at: new Date().toISOString() }).eq('id', prospect.id);
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
          body: JSON.stringify({ email: p.email, managerFirstname: p.firstname, managerLastname: p.lastname, prospectType: 'client' }),
        });
        if (r.ok) {
          await supabase.from('client_prospects').update({ discovery_email_sent: true, discovery_email_sent_at: new Date().toISOString() }).eq('id', p.id);
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
    if (!confirm('Supprimer ?')) return;
    await supabase.from('client_prospects').delete().eq('id', id);
    setProspects(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast('Supprimé', 'success');
  };

  const deleteSelectedProspects = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} prospect(s) sélectionné(s) ?`)) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('client_prospects').delete().eq('id', id);
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
    const data = source.map(p => ({ Email: p.email, Prénom: p.firstname, Nom: p.lastname, Téléphone: p.phone, 'Statut appel': CALL_STATUS_CONFIG[p.call_status as CallStatus]?.label || p.call_status, 'Statut invitation': p.invitation_status, 'Email découverte': p.discovery_email_sent ? 'Oui' : 'Non' }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Clients');
    XLSX.writeFile(wb, `client_prospects_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleSelectAll = () => {
    const ids = filteredProspects.map(p => p.id);
    setSelectedIds(ids.every(id => selectedIds.has(id)) ? new Set() : new Set(ids));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prospects Clients</h2>
          <p className="text-sm text-gray-500 mt-1">Importez, appelez, et invitez des clients</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportProspects(false)} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"><Download className="w-4 h-4" /> Exporter tout</button>
          <button onClick={fetchProspects} className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Upload className="w-4 h-4" /> Importer</button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"><UserPlus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map(tab => {
          const TI = tab.icon;
          const isActive = tabFilter === tab.id || (tab.id === 'to_call' && tabFilter.startsWith('to_call'));
          return (
            <button key={tab.id} onClick={() => { setTabFilter(tab.id); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {TI && <TI className="w-3.5 h-3.5" />}{tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for "À appeler" */}
      {tabFilter.startsWith('to_call') && (
        <div className="flex flex-wrap gap-2 pl-4">
          {toCallSubTabs.map(sub => (
            <button key={sub.id} onClick={() => { setTabFilter(sub.id); setSelectedIds(new Set()); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-colors ${tabFilter === sub.id ? 'bg-purple-100 text-purple-700 border border-purple-300 font-medium' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
              {sub.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tabFilter === sub.id ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'}`}>{sub.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Global selection bar */}
      {filteredProspects.length > 0 && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-purple-700">
            {filteredProspects.every(p => selectedIds.has(p.id)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {filteredProspects.every(p => selectedIds.has(p.id)) ? 'Désélectionner' : `Tout sélectionner (${filteredProspects.length})`}
          </button>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-purple-600 font-medium">{selectedIds.size} sélectionné(s)</span>
              <button onClick={() => exportProspects(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100">
                <Download className="w-3.5 h-3.5" /> Exporter
              </button>
              <button onClick={deleteSelectedProspects}
                className="flex items-center gap-2 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
              {tabFilter === 'no_phone' && (
                <button onClick={sendBulkEmails} disabled={bulkSending}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {bulkSending ? <>{bulkProgress.sent}/{bulkProgress.total}</> : <><Send className="w-3.5 h-3.5" /> Envoyer emails</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom, email, téléphone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div></div>
      ) : filteredProspects.length === 0 ? (
        <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun prospect client</p></div>
      ) : (
        <div className="space-y-3">
          {filteredProspects.map(p => {
            const isNoPhone = tabFilter === 'no_phone';
            const isLocked = p.invitation_status === 'invited' || p.invitation_status === 'signed_up';
            const cc = CALL_STATUS_CONFIG[p.call_status as CallStatus] || CALL_STATUS_CONFIG.not_called;
            const CI = cc.icon;
            return (
              <div key={p.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${selectedIds.has(p.id) ? 'border-purple-400 bg-purple-50/50' : 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Checkbox for selection */}
                  <button onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}>
                    {selectedIds.has(p.id) ? <CheckSquare className="w-5 h-5 text-purple-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{[p.firstname, p.lastname].filter(Boolean).join(' ') || p.email}</span>
                      {!isNoPhone && !isLocked && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cc.bg} ${cc.color}`}><CI className="w-3 h-3" />{cc.label}</span>
                      )}
                      {p.invitation_status === 'invited' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600"><Mail className="w-3 h-3" />Invité</span>}
                      {p.invitation_status === 'signed_up' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-600"><CheckCircle className="w-3 h-3" />Nous a rejoint</span>}
                      {isNoPhone && p.discovery_email_sent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-600"><CheckCircle className="w-3 h-3" />Email envoyé</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {editingEmailId === p.id ? (
                        <span className="flex items-center gap-1">
                          <input type="email" value={editEmailValue} onChange={(e) => setEditEmailValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveClientEmail(p.id); }}
                            className="px-2 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48" autoFocus />
                          <button onClick={() => handleSaveClientEmail(p.id)} disabled={savingEmail} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingEmailId(null)} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{p.email}{p.inscription_type === 'with_quote' && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-medium">+ demande</span>}</span>
                      )}
                      {p.phone ? <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.phone}</span> : <span className="flex items-center gap-1 text-orange-500"><PhoneOff className="w-3.5 h-3.5" />Sans tél</span>}
                    </div>
                    {p.call_notes && <div className="mt-1 text-xs text-gray-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{p.call_notes}</div>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View / Edit detail */}
                    <button onClick={() => setSelectedProspect(p)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Voir / Modifier"><Eye className="w-4 h-4" /></button>

                    {/* Delete */}
                    {p.invitation_status === 'not_invited' && (
                      <button onClick={() => deleteProspect(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 disabled:opacity-50">
                        {sendingAction === p.id ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div> : <RotateCw className="w-3.5 h-3.5" />} Renvoyer
                      </button>
                    )}

                    {/* Signed up badge */}
                    {p.invitation_status === 'signed_up' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg"><CheckCircle className="w-3.5 h-3.5" /> Inscrit</span>
                    )}

                    {/* Discovery email for no-phone */}
                    {isNoPhone && !p.discovery_email_sent && p.invitation_status === 'not_invited' && (
                      <button onClick={() => sendDiscoveryEmail(p)} disabled={sendingAction === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        {sendingAction === p.id ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div> : <Globe className="w-3.5 h-3.5" />} Envoyer
                      </button>
                    )}
                    {isNoPhone && p.discovery_email_sent && p.invitation_status === 'not_invited' && (
                      <button onClick={() => sendDiscoveryEmail(p)} disabled={sendingAction === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50">
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

      {showImportModal && <ImportClientsModal onClose={() => setShowImportModal(false)} onImportComplete={() => { setShowImportModal(false); fetchProspects(); }} />}

      {/* Add single prospect modal */}
      {showAddModal && <AddSingleClientModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchProspects(); }} />}

      {/* Detail / Edit modal */}
      {selectedProspect && (
        <ClientProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdated={(updated) => {
            setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSelectedProspect(updated);
          }}
        />
      )}
    </div>
  );
}

// Small call dropdown component
function CallDropdown({ prospectId, currentStatus, onUpdate, loading }: {
  prospectId: string; currentStatus: CallStatus; onUpdate: (id: string, status: CallStatus) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
        <PhoneCall className="w-3.5 h-3.5" /><span>Appel</span><ChevronDown className="w-3 h-3" />
      </button>
      {open && (<>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          {(Object.entries(CALL_STATUS_CONFIG) as [CallStatus, typeof CALL_STATUS_CONFIG[CallStatus]][]).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <button key={status} onClick={() => { onUpdate(prospectId, status); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${currentStatus === status ? 'bg-gray-50 font-medium' : ''}`}>
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
// ============================================================
// Client prospect detail / edit modal
// ============================================================
function ClientProspectDetailModal({ prospect, onClose, onUpdated }: {
  prospect: ClientProspect;
  onClose: () => void;
  onUpdated: (updated: ClientProspect) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: prospect.email || '',
    firstname: prospect.firstname || '',
    lastname: prospect.lastname || '',
    phone: prospect.phone || '',
  });

  const handleSave = async () => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showToast('Email invalide', 'error'); return;
    }
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        email: form.email.trim().toLowerCase(),
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        phone: form.phone.trim(),
        has_phone: !!form.phone.trim(),
      };
      const { error } = await supabase.from('client_prospects').update(updates).eq('id', prospect.id);
      if (error) throw error;
      onUpdated({ ...prospect, ...updates });
      showToast('Prospect mis à jour', 'success');
      setEditing(false);
    } catch (err: any) { showToast(`Erreur: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const fieldInput = (label: string, field: string, type = 'text') => (
    <div key={field}>
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            {[prospect.firstname, prospect.lastname].filter(Boolean).join(' ') || prospect.email}
          </h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
            )}
            {editing && (
              <>
                <button onClick={() => { setEditing(false); setForm({ email: prospect.email || '', firstname: prospect.firstname || '', lastname: prospect.lastname || '', phone: prospect.phone || '' }); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> {saving ? '...' : 'Enregistrer'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {fieldInput('Email', 'email', 'email')}
            {fieldInput('Téléphone', 'phone', 'tel')}
            {fieldInput('Prénom', 'firstname')}
            {fieldInput('Nom', 'lastname')}
          </div>

          {/* Status info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 space-y-1">
            <p>Statut : <strong>{prospect.invitation_status === 'signed_up' ? 'Inscrit' : prospect.invitation_status === 'invited' ? 'Invité' : 'Non invité'}</strong></p>
            {prospect.invitation_sent_at && <p>Invitation envoyée le {new Date(prospect.invitation_sent_at).toLocaleDateString('fr-FR')}</p>}
            <p>Créé le {new Date(prospect.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Add single client prospect modal
// ============================================================
const QUOTE_HOME_SIZES = ['Studio', 'T1', 'T2', 'T3', 'T4', 'T5+'];
const QUOTE_HOME_TYPES = ['Appartement', 'Maison', 'Bureau'];
const QUOTE_SERVICES = ['Emballage/Déballage', 'Fourniture de cartons', 'Démontage/Remontage meubles', 'Garde-meubles', "Transport d'objets fragiles", 'Nettoyage après déménagement'];
const QUOTE_FORMULAS = [
  { id: 'eco', label: 'ECO', desc: 'Aucun service' },
  { id: 'standard', label: 'STANDARD', desc: 'Démontage/Remontage' },
  { id: 'confort', label: 'CONFORT', desc: 'Emballage + Démontage/Remontage' },
  { id: 'premium', label: 'PREMIUM', desc: 'Tout inclus' },
];
const CARRYING_DISTANCES = ['10m', '20m', '30m', '40m', '50m+'];

function AddSingleClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [inscriptionType, setInscriptionType] = useState<'standard' | 'with_quote'>('standard');
  const [form, setForm] = useState({ email: '', firstname: '', lastname: '', phone: '' });
  const [quoteForm, setQuoteForm] = useState({
    from_address: '', from_city: '', from_postal_code: '',
    from_latitude: null as number | null, from_longitude: null as number | null,
    from_home_size: '', from_home_type: '', from_surface_m2: '' as string,
    to_address: '', to_city: '', to_postal_code: '',
    to_latitude: null as number | null, to_longitude: null as number | null,
    to_home_size: '', to_home_type: '', to_surface_m2: '' as string,
    moving_date: '', floor_from: 0, floor_to: 0,
    elevator_from: false, elevator_to: false,
    elevator_capacity_from: '', elevator_capacity_to: '',
    furniture_lift_needed_departure: false, furniture_lift_needed_arrival: false,
    carrying_distance_from: '', carrying_distance_to: '',
    volume_m3: '' as string, formula: 'eco',
    services_needed: [] as string[], accepts_groupage: false,
    additional_info: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedDistance, setCalculatedDistance] = useState<{ distance: number; distanceText: string; duration: number; durationText: string } | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Auto-calculate distance when both addresses are filled
  useEffect(() => {
    if (inscriptionType !== 'with_quote') return;
    if (!quoteForm.from_address || !quoteForm.from_city || !quoteForm.to_address || !quoteForm.to_city) {
      setCalculatedDistance(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCalculatingDistance(true);
      try {
        const result = await calculateRealDistance(
          quoteForm.from_address, quoteForm.from_city, quoteForm.from_postal_code,
          quoteForm.to_address, quoteForm.to_city, quoteForm.to_postal_code
        );
        if (result) setCalculatedDistance(result);
      } catch { /* ignore */ }
      finally { setCalculatingDistance(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [inscriptionType, quoteForm.from_address, quoteForm.from_city, quoteForm.from_postal_code, quoteForm.to_address, quoteForm.to_city, quoteForm.to_postal_code]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email obligatoire';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email invalide';
    if (!form.firstname.trim()) e.firstname = 'Prénom obligatoire';
    if (!form.lastname.trim()) e.lastname = 'Nom obligatoire';
    if (!form.phone.trim()) e.phone = 'Téléphone obligatoire';
    if (inscriptionType === 'with_quote') {
      // Adresses complètes avec code postal obligatoire
      if (!quoteForm.from_address.trim() || !quoteForm.from_city.trim()) e.from_address = 'Adresse de départ requise';
      else if (!quoteForm.from_postal_code.trim()) e.from_address = 'Adresse incomplète — veuillez sélectionner une adresse avec code postal';
      if (!quoteForm.to_address.trim() || !quoteForm.to_city.trim()) e.to_address = "Adresse d'arrivée requise";
      else if (!quoteForm.to_postal_code.trim()) e.to_address = "Adresse incomplète — veuillez sélectionner une adresse avec code postal";
      if (!quoteForm.moving_date) e.moving_date = 'Date requise';
      if (!quoteForm.from_home_size) e.from_home_size = 'Taille requise';
      if (!quoteForm.from_home_type) e.from_home_type = 'Type requis';
      if (!quoteForm.from_surface_m2) e.from_surface_m2 = 'Surface requise';
      if (!quoteForm.to_home_size) e.to_home_size = 'Taille requise';
      if (!quoteForm.to_home_type) e.to_home_type = 'Type requis';
      if (!quoteForm.to_surface_m2) e.to_surface_m2 = 'Surface requise';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('client_prospects').select('id').eq('email', form.email.trim().toLowerCase()).maybeSingle();
      if (existing) { setErrors({ email: 'Cet email existe déjà dans les prospects' }); setSaving(false); return; }

      const hasPhone = !!form.phone.trim();
      const insertData: any = {
        email: form.email.trim().toLowerCase(),
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        phone: form.phone.trim(),
        has_phone: hasPhone,
        call_status: 'not_called',
        invitation_status: 'not_invited',
        inscription_type: inscriptionType,
      };

      if (inscriptionType === 'with_quote') {
        insertData.initial_quote_data = {
          from_address: quoteForm.from_address.trim(),
          from_city: quoteForm.from_city.trim(),
          from_postal_code: quoteForm.from_postal_code.trim(),
          from_latitude: quoteForm.from_latitude,
          from_longitude: quoteForm.from_longitude,
          from_home_size: quoteForm.from_home_size,
          from_home_type: quoteForm.from_home_type,
          from_surface_m2: quoteForm.from_surface_m2 ? parseFloat(quoteForm.from_surface_m2) : null,
          to_address: quoteForm.to_address.trim(),
          to_city: quoteForm.to_city.trim(),
          to_postal_code: quoteForm.to_postal_code.trim(),
          to_latitude: quoteForm.to_latitude,
          to_longitude: quoteForm.to_longitude,
          to_home_size: quoteForm.to_home_size,
          to_home_type: quoteForm.to_home_type,
          to_surface_m2: quoteForm.to_surface_m2 ? parseFloat(quoteForm.to_surface_m2) : null,
          moving_date: quoteForm.moving_date,
          floor_from: quoteForm.floor_from,
          floor_to: quoteForm.floor_to,
          elevator_from: quoteForm.elevator_from,
          elevator_to: quoteForm.elevator_to,
          elevator_capacity_from: quoteForm.elevator_capacity_from,
          elevator_capacity_to: quoteForm.elevator_capacity_to,
          furniture_lift_needed_departure: quoteForm.furniture_lift_needed_departure,
          furniture_lift_needed_arrival: quoteForm.furniture_lift_needed_arrival,
          carrying_distance_from: quoteForm.carrying_distance_from,
          carrying_distance_to: quoteForm.carrying_distance_to,
          volume_m3: quoteForm.volume_m3 ? parseFloat(quoteForm.volume_m3) : null,
          formula: quoteForm.formula,
          services_needed: quoteForm.services_needed,
          accepts_groupage: quoteForm.accepts_groupage,
          additional_info: quoteForm.additional_info.trim(),
          distance_km: calculatedDistance?.distance || null,
          distance_text: calculatedDistance?.distanceText || null,
          duration_text: calculatedDistance?.durationText || null,
        };
      }

      const { error } = await supabase.from('client_prospects').insert(insertData);
      if (error) throw error;
      showToast(inscriptionType === 'with_quote' ? 'Prospect + demande initiale ajoutés' : 'Prospect client ajouté', 'success');
      onAdded();
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally { setSaving(false); }
  };

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };
  const setQ = (field: string, value: any) => {
    setQuoteForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const inputClass = (field: string) =>
    `w-full text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors[field] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`;

  const toggleService = (s: string) => {
    setQuoteForm(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(s) ? prev.services_needed.filter(x => x !== s) : [...prev.services_needed, s]
    }));
  };

  const selectFormula = (formula: string) => {
    let newServices: string[] = [];
    switch (formula) {
      case 'eco': newServices = []; break;
      case 'standard': newServices = ['Démontage/Remontage meubles']; break;
      case 'confort': newServices = ['Emballage/Déballage', 'Démontage/Remontage meubles']; break;
      case 'premium': newServices = ['Emballage/Déballage', 'Démontage/Remontage meubles', 'Fourniture de cartons']; break;
    }
    setQuoteForm(prev => ({ ...prev, formula, services_needed: newServices }));
    if (errors.formula) setErrors(prev => { const n = { ...prev }; delete n.formula; return n; });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            Ajouter un prospect client
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Inscription type toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button type="button" onClick={() => setInscriptionType('standard')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${inscriptionType === 'standard' ? 'bg-white dark:bg-gray-600 shadow text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Inscription standard
            </button>
            <button type="button" onClick={() => setInscriptionType('with_quote')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${inscriptionType === 'with_quote' ? 'bg-white dark:bg-gray-600 shadow text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Avec demande initiale
            </button>
          </div>

          {inscriptionType === 'with_quote' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
              Le client recevra un email d'invitation avec le récapitulatif de sa demande. En confirmant son inscription, la demande sera automatiquement créée et visible par les déménageurs.
            </div>
          )}

          {/* Client info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Informations client</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@exemple.com" className={inputClass('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom <span className="text-red-500">*</span></label>
                <input type="text" value={form.firstname} onChange={(e) => set('firstname', e.target.value)} placeholder="Prénom" className={inputClass('firstname')} />
                {errors.firstname && <p className="text-xs text-red-500 mt-1">{errors.firstname}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom <span className="text-red-500">*</span></label>
                <input type="text" value={form.lastname} onChange={(e) => set('lastname', e.target.value)} placeholder="Nom" className={inputClass('lastname')} />
                {errors.lastname && <p className="text-xs text-red-500 mt-1">{errors.lastname}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone <span className="text-red-500">*</span></label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="06 12 34 56 78" className={inputClass('phone')} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Quote form (only if with_quote) */}
          {inscriptionType === 'with_quote' && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Détails de la demande</h3>

              {/* Departure */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">🏠 Départ</p>
                <AddressAutocomplete
                  id="admin-from-address"
                  value={`${quoteForm.from_address}${quoteForm.from_city ? ', ' + quoteForm.from_city : ''}${quoteForm.from_postal_code ? ' ' + quoteForm.from_postal_code : ''}`}
                  onAddressSelect={(addr) => {
                    if (!addr.postalCode) {
                      setErrors(prev => ({ ...prev, from_address: 'Adresse incomplète — veuillez sélectionner une adresse avec code postal' }));
                      return;
                    }
                    setQuoteForm(prev => ({
                      ...prev,
                      from_address: addr.street,
                      from_city: addr.city,
                      from_postal_code: addr.postalCode,
                      from_latitude: addr.latitude || null,
                      from_longitude: addr.longitude || null,
                    }));
                    if (errors.from_address) setErrors(prev => { const n = { ...prev }; delete n.from_address; return n; });
                  }}
                  placeholder="Tapez l'adresse de départ..."
                  label="Adresse complète *"
                  required
                  error={errors.from_address}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Taille logement <span className="text-red-500">*</span></label>
                    <select value={quoteForm.from_home_size} onChange={(e) => setQ('from_home_size', e.target.value)} className={inputClass('from_home_size')}>
                      <option value="">Taille</option>
                      {QUOTE_HOME_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.from_home_size && <p className="text-xs text-red-500 mt-0.5">{errors.from_home_size}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Type logement <span className="text-red-500">*</span></label>
                    <select value={quoteForm.from_home_type} onChange={(e) => setQ('from_home_type', e.target.value)} className={inputClass('from_home_type')}>
                      <option value="">Type</option>
                      {QUOTE_HOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.from_home_type && <p className="text-xs text-red-500 mt-0.5">{errors.from_home_type}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Surface (m²) <span className="text-red-500">*</span></label>
                    <input type="number" min="1" step="1" value={quoteForm.from_surface_m2} onChange={(e) => setQ('from_surface_m2', e.target.value)} placeholder="ex: 65" className={inputClass('from_surface_m2')} />
                    {errors.from_surface_m2 && <p className="text-xs text-red-500 mt-0.5">{errors.from_surface_m2}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Étage</label>
                    <input type="number" min="0" max="30" value={quoteForm.floor_from} onChange={(e) => setQ('floor_from', parseInt(e.target.value) || 0)} className={inputClass('')} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Distance portage</label>
                    <select value={quoteForm.carrying_distance_from} onChange={(e) => setQ('carrying_distance_from', e.target.value)} className={inputClass('')}>
                      <option value="">Sélectionner</option>
                      {CARRYING_DISTANCES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end gap-1">
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <input type="checkbox" checked={quoteForm.elevator_from} onChange={(e) => setQ('elevator_from', e.target.checked)} className="rounded" />
                      Ascenseur
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <input type="checkbox" checked={quoteForm.furniture_lift_needed_departure} onChange={(e) => setQ('furniture_lift_needed_departure', e.target.checked)} className="rounded" />
                      Monte-meuble
                    </label>
                  </div>
                </div>
              </div>

              {/* Arrival */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">📍 Arrivée</p>
                <AddressAutocomplete
                  id="admin-to-address"
                  value={`${quoteForm.to_address}${quoteForm.to_city ? ', ' + quoteForm.to_city : ''}${quoteForm.to_postal_code ? ' ' + quoteForm.to_postal_code : ''}`}
                  onAddressSelect={(addr) => {
                    if (!addr.postalCode) {
                      setErrors(prev => ({ ...prev, to_address: "Adresse incomplète — veuillez sélectionner une adresse avec code postal" }));
                      return;
                    }
                    setQuoteForm(prev => ({
                      ...prev,
                      to_address: addr.street,
                      to_city: addr.city,
                      to_postal_code: addr.postalCode,
                      to_latitude: addr.latitude || null,
                      to_longitude: addr.longitude || null,
                    }));
                    if (errors.to_address) setErrors(prev => { const n = { ...prev }; delete n.to_address; return n; });
                  }}
                  placeholder="Tapez l'adresse d'arrivée..."
                  label="Adresse complète *"
                  required
                  error={errors.to_address}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Taille logement <span className="text-red-500">*</span></label>
                    <select value={quoteForm.to_home_size} onChange={(e) => setQ('to_home_size', e.target.value)} className={inputClass('to_home_size')}>
                      <option value="">Taille</option>
                      {QUOTE_HOME_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.to_home_size && <p className="text-xs text-red-500 mt-0.5">{errors.to_home_size}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Type logement <span className="text-red-500">*</span></label>
                    <select value={quoteForm.to_home_type} onChange={(e) => setQ('to_home_type', e.target.value)} className={inputClass('to_home_type')}>
                      <option value="">Type</option>
                      {QUOTE_HOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.to_home_type && <p className="text-xs text-red-500 mt-0.5">{errors.to_home_type}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Surface (m²) <span className="text-red-500">*</span></label>
                    <input type="number" min="1" step="1" value={quoteForm.to_surface_m2} onChange={(e) => setQ('to_surface_m2', e.target.value)} placeholder="ex: 65" className={inputClass('to_surface_m2')} />
                    {errors.to_surface_m2 && <p className="text-xs text-red-500 mt-0.5">{errors.to_surface_m2}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Étage</label>
                    <input type="number" min="0" max="30" value={quoteForm.floor_to} onChange={(e) => setQ('floor_to', parseInt(e.target.value) || 0)} className={inputClass('')} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Distance portage</label>
                    <select value={quoteForm.carrying_distance_to} onChange={(e) => setQ('carrying_distance_to', e.target.value)} className={inputClass('')}>
                      <option value="">Sélectionner</option>
                      {CARRYING_DISTANCES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end gap-1">
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <input type="checkbox" checked={quoteForm.elevator_to} onChange={(e) => setQ('elevator_to', e.target.checked)} className="rounded" />
                      Ascenseur
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <input type="checkbox" checked={quoteForm.furniture_lift_needed_arrival} onChange={(e) => setQ('furniture_lift_needed_arrival', e.target.checked)} className="rounded" />
                      Monte-meuble
                    </label>
                  </div>
                </div>
              </div>

              {/* Distance */}
              {(quoteForm.from_city && quoteForm.to_city) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">📏 Distance du trajet</p>
                  {calculatingDistance ? (
                    <p className="text-xs text-blue-600 animate-pulse">Calcul en cours...</p>
                  ) : calculatedDistance ? (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-blue-800 dark:text-blue-200">{calculatedDistance.distanceText}</span>
                      <span className="text-green-700 dark:text-green-300">Durée : {calculatedDistance.durationText}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Renseignez les adresses complètes pour calculer</p>
                  )}
                </div>
              )}

              {/* Date + Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de déménagement *</label>
                  <input type="date" value={quoteForm.moving_date} onChange={(e) => setQ('moving_date', e.target.value)} min={new Date().toISOString().split('T')[0]} className={inputClass('moving_date')} />
                  {errors.moving_date && <p className="text-xs text-red-500">{errors.moving_date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Volume estimé (m³)</label>
                  <input type="number" min="0" step="0.5" value={quoteForm.volume_m3} onChange={(e) => setQ('volume_m3', e.target.value)} placeholder="ex: 25" className={inputClass('')} />
                </div>
              </div>

              {/* Formula */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Formule</label>
                <div className="grid grid-cols-4 gap-2">
                  {QUOTE_FORMULAS.map(f => (
                    <button key={f.id} type="button" onClick={() => selectFormula(f.id)}
                      className={`p-2 border-2 rounded-lg text-center transition text-xs ${quoteForm.formula === f.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}>
                      <div className="font-bold text-gray-900 dark:text-white">{f.label}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-[10px]">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Services supplémentaires</label>
                <div className="flex flex-wrap gap-2">
                  {QUOTE_SERVICES.map(s => (
                    <button key={s} type="button" onClick={() => toggleService(s)}
                      className={`px-2 py-1 rounded-full text-xs border transition ${quoteForm.services_needed.includes(s) ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Groupage + Notes */}
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={quoteForm.accepts_groupage} onChange={(e) => setQ('accepts_groupage', e.target.checked)} className="rounded" />
                Accepte le groupage
              </label>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Informations complémentaires</label>
                <textarea rows={2} value={quoteForm.additional_info} onChange={(e) => setQ('additional_info', e.target.value)} placeholder="Détails supplémentaires (meubles lourds, piano, objets fragiles...)" className={inputClass('')} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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