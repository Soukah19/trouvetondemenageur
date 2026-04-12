import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Lock, Save, ArrowLeft, AlertCircle, Loader2, Building, FileText, Download, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { MoverLayout } from '../components/MoverLayout';

export default function MoverSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [managerFirstname, setManagerFirstname] = useState('');
  const [managerLastname, setManagerLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [originalData, setOriginalData] = useState({
    managerFirstname: '', managerLastname: '', phone: '', managerPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    if (user) { loadProfile(); loadContract(); }
  }, [user]);

  const loadContract = async () => {
    try {
      const { data: mover } = await supabase
        .from('movers').select('id').eq('user_id', user?.id).maybeSingle();
      if (!mover) return;

      const { data } = await supabase
        .from('mover_contracts')
        .select('*')
        .eq('mover_id', mover.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setContract(data);
    } catch (e) { console.error('Error loading contract:', e); }
  };

  const handleDownloadContract = async () => {
    if (!contract?.signed_pdf_url) return;
    try {
      const { data, error } = await supabase.storage
        .from('signed-contracts')
        .download(contract.signed_pdf_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contrat_partenaire_signe.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch { showToast('Erreur lors du téléchargement', 'error'); }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('manager_firstname, manager_lastname, phone, manager_phone, company_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setManagerFirstname(data.manager_firstname || '');
        setManagerLastname(data.manager_lastname || '');
        setPhone(data.phone || '');
        setManagerPhone(data.manager_phone || '');
        setCompanyName(data.company_name || '');
        setOriginalData({
          managerFirstname: data.manager_firstname || '',
          managerLastname: data.manager_lastname || '',
          phone: data.phone || '',
          managerPhone: data.manager_phone || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      showToast('Erreur lors du chargement du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    managerFirstname !== originalData.managerFirstname ||
    managerLastname !== originalData.managerLastname ||
    phone !== originalData.phone ||
    managerPhone !== originalData.managerPhone;

  const validatePhone = (value: string) => {
    if (!value.trim()) return true; // optional
    return /^(\+33|0)[1-9](\d{2}){4}$/.test(value.replace(/\s/g, ''));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!managerFirstname.trim()) newErrors.managerFirstname = 'Le prénom est requis';
    if (!managerLastname.trim()) newErrors.managerLastname = 'Le nom est requis';
    if (phone.trim() && !validatePhone(phone)) {
      newErrors.phone = 'Numéro invalide (ex: 06 12 34 56 78)';
    }
    if (managerPhone.trim() && !validatePhone(managerPhone)) {
      newErrors.managerPhone = 'Numéro invalide (ex: 06 12 34 56 78)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !hasChanges) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({
          manager_firstname: managerFirstname.trim(),
          manager_lastname: managerLastname.trim(),
          phone: phone.trim() || null,
          manager_phone: managerPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setOriginalData({
        managerFirstname: managerFirstname.trim(),
        managerLastname: managerLastname.trim(),
        phone: phone.trim(),
        managerPhone: managerPhone.trim(),
      });

      showToast('Profil mis à jour avec succès !', 'success');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };

  if (loading) {
    return (
      <MoverLayout title="Paramètres">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout title="Paramètres du compte" activeSection="settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Informations du responsable</h2>
                <p className="text-sm text-gray-500">{companyName} — {user?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Manager First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom du responsable</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={managerFirstname}
                    onChange={(e) => { setManagerFirstname(e.target.value); setErrors(prev => ({ ...prev, managerFirstname: '' })); }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${
                      errors.managerFirstname ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Prénom"
                  />
                </div>
                {errors.managerFirstname && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.managerFirstname}
                  </p>
                )}
              </div>

              {/* Manager Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du responsable</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={managerLastname}
                    onChange={(e) => { setManagerLastname(e.target.value); setErrors(prev => ({ ...prev, managerLastname: '' })); }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${
                      errors.managerLastname ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Nom"
                  />
                </div>
                {errors.managerLastname && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.managerLastname}
                  </p>
                )}
              </div>
            </div>

            {/* Company Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone entreprise</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(formatPhone(e.target.value)); setErrors(prev => ({ ...prev, phone: '' })); }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="01 23 45 67 89"
                  maxLength={14}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Manager Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone du responsable</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={managerPhone}
                  onChange={(e) => { setManagerPhone(formatPhone(e.target.value)); setErrors(prev => ({ ...prev, managerPhone: '' })); }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${
                    errors.managerPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="06 12 34 56 78"
                  maxLength={14}
                />
              </div>
              {errors.managerPhone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.managerPhone}
                </p>
              )}
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                hasChanges && !saving
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contract Section */}
        {contract && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-6 py-4 border-b border-gray-100 ${
              contract.status === 'signed'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  contract.status === 'signed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <FileText className={`w-5 h-5 ${contract.status === 'signed' ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Contrat de partenariat</h2>
                  <p className="text-sm text-gray-500">Contrat signé électroniquement via Dropbox Sign</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {contract.status === 'signed' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">Contrat signé</p>
                      <p className="text-sm text-green-600">
                        Signé le {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                  {contract.signed_pdf_url && (
                    <button
                      onClick={handleDownloadContract}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger le contrat signé
                    </button>
                  )}
                </div>
              ) : contract.status === 'sent' || contract.status === 'opened' ? (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">En attente de signature</p>
                    <p className="text-sm text-blue-600">
                      Vérifiez votre boîte email pour signer le contrat envoyé par Dropbox Sign.
                      {contract.expires_at && (
                        <> Expire le {new Date(contract.expires_at).toLocaleDateString('fr-FR')}.</>
                      )}
                    </p>
                  </div>
                </div>
              ) : contract.status === 'declined' ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Contrat refusé</p>
                    <p className="text-sm text-red-600">Vous avez refusé le contrat. Contactez-nous pour plus d'informations.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Security Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sécurité</h2>
                <p className="text-sm text-gray-500">Gérez votre mot de passe</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <button
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Modifier le mot de passe</p>
                  <p className="text-sm text-gray-500">Changez votre mot de passe de connexion</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </MoverLayout>
  );
}
