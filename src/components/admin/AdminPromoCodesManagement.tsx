import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart2,
  Clock,
  Users,
  Euro,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  min_amount: number | null;
  max_discount_amount: number | null;
  is_active: boolean;
  single_use_per_user: boolean;
  description: string | null;
  created_at: string;
}

interface PromoUsage {
  id: string;
  user_id: string;
  quote_id: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  used_at: string;
  // joined
  user_email?: string;
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'expired';

interface FormState {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  valid_from: string;
  valid_until: string;
  max_uses: string;
  min_amount: string;
  max_discount_amount: string;
  is_active: boolean;
  single_use_per_user: boolean;
  description: string;
}

const EMPTY_FORM: FormState = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: '',
  max_uses: '',
  min_amount: '',
  max_discount_amount: '',
  is_active: true,
  single_use_per_user: false,
  description: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExpired(pc: PromoCode) {
  if (!pc.valid_until) return false;
  return new Date(pc.valid_until) < new Date();
}

function statusLabel(pc: PromoCode) {
  if (!pc.is_active) return { label: 'Inactif', color: 'bg-slate-100 text-slate-600' };
  if (isExpired(pc)) return { label: 'Expiré', color: 'bg-red-100 text-red-700' };
  if (pc.max_uses !== null && pc.current_uses >= pc.max_uses)
    return { label: 'Épuisé', color: 'bg-orange-100 text-orange-700' };
  return { label: 'Actif', color: 'bg-green-100 text-green-700' };
}

function fmt(n: number | null | undefined, suffix = '') {
  if (n === null || n === undefined) return '∞';
  return `${n.toLocaleString('fr-FR')}${suffix}`;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  adminRole: string;
}

export default function AdminPromoCodesManagement({ adminRole }: Props) {
  const isSuperAdmin = adminRole === 'super_admin';

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  // Form / modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Usage detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usages, setUsages] = useState<Record<string, PromoUsage[]>>({});
  const [loadingUsage, setLoadingUsage] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCodes(data as PromoCode[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const fetchUsage = async (codeId: string) => {
    if (usages[codeId]) return; // already loaded
    setLoadingUsage(codeId);
    const { data, error } = await supabase
      .from('promo_code_usage')
      .select('id, user_id, quote_id, discount_amount, original_amount, final_amount, used_at')
      .eq('promo_code_id', codeId)
      .order('used_at', { ascending: false });
    if (!error && data) setUsages(prev => ({ ...prev, [codeId]: data as PromoUsage[] }));
    setLoadingUsage(null);
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = codes.filter(pc => {
    const matchesSearch = pc.code.includes(search.toUpperCase()) ||
      (pc.description || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    switch (filterStatus) {
      case 'active': return pc.is_active && !isExpired(pc);
      case 'inactive': return !pc.is_active;
      case 'expired': return isExpired(pc);
      default: return true;
    }
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalActive = codes.filter(pc => pc.is_active && !isExpired(pc)).length;
  const totalUses = codes.reduce((s, pc) => s + pc.current_uses, 0);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (pc: PromoCode) => {
    setEditing(pc);
    setForm({
      code: pc.code,
      discount_type: pc.discount_type,
      discount_value: String(pc.discount_value),
      valid_from: pc.valid_from.slice(0, 10),
      valid_until: pc.valid_until ? pc.valid_until.slice(0, 10) : '',
      max_uses: pc.max_uses !== null ? String(pc.max_uses) : '',
      min_amount: pc.min_amount !== null ? String(pc.min_amount) : '',
      max_discount_amount: pc.max_discount_amount !== null ? String(pc.max_discount_amount) : '',
      is_active: pc.is_active,
      single_use_per_user: pc.single_use_per_user,
      description: pc.description || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.code.trim()) { setFormError('Le code est obligatoire.'); return; }
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) {
      setFormError('La valeur de la réduction doit être un nombre positif.'); return;
    }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      setFormError('Un pourcentage ne peut pas dépasser 100%.'); return;
    }

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      valid_from: form.valid_from || new Date().toISOString(),
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      min_amount: form.min_amount ? Number(form.min_amount) : null,
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      is_active: form.is_active,
      single_use_per_user: form.single_use_per_user,
      description: form.description || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('promo_codes').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('promo_codes').insert(payload));
    }

    setSaving(false);
    if (error) {
      setFormError(error.message.includes('unique') ? 'Ce code existe déjà.' : error.message);
      return;
    }
    setShowForm(false);
    fetchCodes();
  };

  const handleToggleActive = async (pc: PromoCode) => {
    await supabase.from('promo_codes').update({ is_active: !pc.is_active }).eq('id', pc.id);
    fetchCodes();
  };

  const handleDelete = async (pc: PromoCode) => {
    if (!confirm(`Supprimer le code "${pc.code}" ? Cette action est irréversible.`)) return;
    await supabase.from('promo_codes').delete().eq('id', pc.id);
    fetchCodes();
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchUsage(id);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Accès restreint</h2>
          <p className="text-slate-500">Seuls les super-administrateurs peuvent gérer les codes promo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Codes Promo</h1>
            <p className="text-sm text-slate-500">{codes.length} code{codes.length !== 1 ? 's' : ''} au total</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer un code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Tag} label="Total codes" value={String(codes.length)} color="bg-purple-100 text-purple-600" />
        <StatCard icon={CheckCircle} label="Codes actifs" value={String(totalActive)} color="bg-green-100 text-green-600" />
        <StatCard icon={Users} label="Utilisations totales" value={String(totalUses)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={BarChart2} label="Codes expirés" value={String(codes.filter(isExpired).length)} color="bg-red-100 text-red-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un code..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-sm">
          {(['all', 'active', 'inactive', 'expired'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors capitalize ${
                filterStatus === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : f === 'inactive' ? 'Inactifs' : 'Expirés'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun code promo trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(pc => {
            const status = statusLabel(pc);
            const isOpen = expandedId === pc.id;
            const pcUsages = usages[pc.id] || [];
            const totalDiscount = pcUsages.reduce((s, u) => s + u.discount_amount, 0);

            return (
              <div key={pc.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Code + badge */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-800">{pc.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pc.single_use_per_user ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {pc.single_use_per_user ? '1× / client' : 'Multi-usage'}
                        </span>
                      </div>
                      {pc.description && (
                        <p className="text-xs text-slate-500 truncate">{pc.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Discount value */}
                  <div className="text-center min-w-[80px]">
                    <p className="text-lg font-bold text-purple-600">
                      {pc.discount_type === 'percentage'
                        ? `−${pc.discount_value}%`
                        : `−${pc.discount_value.toFixed(2)} €`}
                    </p>
                    <p className="text-xs text-slate-400">{pc.discount_type === 'percentage' ? 'Pourcentage' : 'Fixe'}</p>
                  </div>

                  {/* Uses */}
                  <div className="text-center min-w-[80px]">
                    <p className="font-semibold text-slate-700">{pc.current_uses} / {fmt(pc.max_uses)}</p>
                    <p className="text-xs text-slate-400">Utilisations</p>
                  </div>

                  {/* Expiry */}
                  <div className="text-center min-w-[100px]">
                    {pc.valid_until ? (
                      <>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(pc.valid_until).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-slate-400">Expire le</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">Sans expiration</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(pc)}
                      title={pc.is_active ? 'Désactiver' : 'Activer'}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {pc.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => openEdit(pc)}
                      title="Modifier"
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pc)}
                      title="Supprimer"
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExpand(pc.id)}
                      title="Historique d'utilisation"
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: usage history */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Historique d'utilisation
                      </h4>
                      {pcUsages.length > 0 && (
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{pcUsages.length} utilisation{pcUsages.length > 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{totalDiscount.toFixed(2)} € économisés</span>
                        </div>
                      )}
                    </div>

                    {loadingUsage === pc.id ? (
                      <div className="flex items-center gap-2 py-4 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Chargement...</span>
                      </div>
                    ) : pcUsages.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Aucune utilisation enregistrée.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-200">
                              <th className="text-left pb-2 font-medium">Utilisateur</th>
                              <th className="text-left pb-2 font-medium">Devis</th>
                              <th className="text-right pb-2 font-medium">Montant original</th>
                              <th className="text-right pb-2 font-medium">Réduction</th>
                              <th className="text-right pb-2 font-medium">Montant final</th>
                              <th className="text-right pb-2 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pcUsages.map(u => (
                              <tr key={u.id} className="hover:bg-white transition-colors">
                                <td className="py-2 font-mono text-slate-600">{u.user_id.slice(0, 8)}…</td>
                                <td className="py-2 font-mono text-slate-600">{u.quote_id.slice(0, 8)}…</td>
                                <td className="py-2 text-right text-slate-600">{u.original_amount.toFixed(2)} €</td>
                                <td className="py-2 text-right text-green-600 font-medium">−{u.discount_amount.toFixed(2)} €</td>
                                <td className="py-2 text-right font-semibold text-slate-800">{u.final_amount.toFixed(2)} €</td>
                                <td className="py-2 text-right text-slate-500">
                                  {new Date(u.used_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-800">
                  {editing ? 'Modifier le code' : 'Créer un code promo'}
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="ex: WELCOME20"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  disabled={!!editing}
                />
                {editing && <p className="text-xs text-slate-400 mt-1">Le code ne peut pas être modifié après création.</p>}
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type de réduction *</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valeur * {form.discount_type === 'percentage' ? '(%)' : '(€)'}
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    placeholder={form.discount_type === 'percentage' ? '20' : '50'}
                    min="0.01"
                    max={form.discount_type === 'percentage' ? '100' : undefined}
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Validity dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valide à partir du</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expire le (optionnel)</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Max uses + min amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nb max d'utilisations</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Illimité"
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant minimum (€)</label>
                  <input
                    type="number"
                    value={form.min_amount}
                    onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                    placeholder="Aucun"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Max discount (only for percentage) */}
              {form.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plafond de réduction (€, optionnel)</label>
                  <input
                    type="number"
                    value={form.max_discount_amount}
                    onChange={e => setForm(f => ({ ...f, max_discount_amount: e.target.value }))}
                    placeholder="ex: 100 pour limiter à 100 € max"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description interne</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Note pour l'équipe admin..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Code actif</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  aria-pressed={form.is_active}
                  aria-label={`Code actif ${form.is_active ? 'activé' : 'désactivé'}`}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Single-use per user toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-slate-700">Usage unique par client</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {form.single_use_per_user
                      ? 'Chaque client ne peut utiliser ce code qu\'une seule fois'
                      : 'Les clients peuvent utiliser ce code plusieurs fois'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, single_use_per_user: !f.single_use_per_user }))}
                  aria-pressed={form.single_use_per_user}
                  aria-label={`Usage unique par client ${form.single_use_per_user ? 'activé' : 'désactivé'}`}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.single_use_per_user ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.single_use_per_user ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editing ? 'Enregistrer' : 'Créer le code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
