import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, User, Lock, CheckCircle, AlertCircle, FileText, Shield, EyeOff, Eye, Loader2, MapPin, Phone, Mail, ArrowRight, X, Check, Upload, Truck, Plus, Trash2, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { validatePassword, validateName } from '../utils/validation';

interface ProspectData {
  id: string; company_name: string; siret: string; email: string; phone: string; mobile: string;
  address: string; postal_code: string; city: string; department: string; region: string; activity: string;
  manager_firstname: string; manager_lastname: string; invitation_status: string; invitation_expires_at: string;
}
interface TruckEntry { id: string; registration_number: string; capacity_m3: number; registration_card_files: File[]; }
type Step = 'verify' | 'documents' | 'vehicles' | 'password' | 'success';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function MoverInviteSignupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [step, setStep] = useState<Step>('verify');
  const [submitting, setSubmitting] = useState(false);

  // Editable company fields (issue 6)
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyMobile, setCompanyMobile] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');

  const [managerFirstname, setManagerFirstname] = useState('');
  const [managerLastname, setManagerLastname] = useState('');
  const [managerPhone, setManagerPhone] = useState('');

  // RIB / Bank details
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [kbisFiles, setKbisFiles] = useState<File[]>([]);
  const [identityRectoFiles, setIdentityRectoFiles] = useState<File[]>([]);
  const [identityVersoFiles, setIdentityVersoFiles] = useState<File[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<File[]>([]);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [urssafFiles, setUrssafFiles] = useState<File[]>([]);
  const [bankDetailsFiles, setBankDetailsFiles] = useState<File[]>([]);

  // Vehicle ownership (issue 7)
  const [vehicleOwnership, setVehicleOwnership] = useState<'owns' | 'rents'>('owns');
  const [trucks, setTrucks] = useState<TruckEntry[]>([{ id: crypto.randomUUID(), registration_number: '', capacity_m3: 0, registration_card_files: [] }]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { if (token) fetchProspect(); }, [token]);

  const fetchProspect = async () => {
    try {
      const { data, error: fe } = await supabase.from('mover_prospects').select('*').eq('invitation_token', token).single();
      if (fe || !data) { setError("Lien d'invitation invalide ou expiré."); return; }
      if (data.invitation_status === 'signed_up') { setError('Vous êtes déjà inscrit ! Connectez-vous.'); return; }
      if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) { setError('Ce lien a expiré. Contactez-nous.'); return; }
      setProspect(data);
      setCompanyName(data.company_name || '');
      setSiret(data.siret || '');
      setCompanyPhone(data.phone || '');
      setCompanyMobile(data.mobile || '');
      setCompanyAddress(data.address || '');
      setPostalCode(data.postal_code || '');
      setCity(data.city || '');
      setDepartment(data.department || '');
      setManagerFirstname(data.manager_firstname || '');
      setManagerLastname(data.manager_lastname || '');
      setManagerPhone(data.mobile || data.phone || '');
      await supabase.from('mover_prospects').update({ invitation_clicked_at: new Date().toISOString() }).eq('id', data.id);
    } catch { setError('Erreur de chargement.'); } finally { setLoading(false); }
  };

  const addTruck = () => setTrucks(p => [...p, { id: crypto.randomUUID(), registration_number: '', capacity_m3: 0, registration_card_files: [] }]);
  const removeTruck = (id: string) => { if (trucks.length <= 1) { showToast('Au moins un véhicule requis', 'error'); return; } setTrucks(p => p.filter(t => t.id !== id)); };
  const updateTruck = (id: string, field: keyof TruckEntry, value: any) => setTrucks(p => p.map(t => t.id === id ? { ...t, [field]: value } : t));

  const handleSubmit = async () => {
    if (!prospect) return;
    if (!companyName.trim()) { showToast('Raison sociale requise', 'error'); setStep('verify'); return; }
    if (!managerFirstname.trim() || !managerLastname.trim()) { showToast('Nom et prénom requis', 'error'); setStep('verify'); return; }
    const fnCheck = validateName(managerFirstname); if (!fnCheck.isValid) { showToast(fnCheck.error!, 'error'); setStep('verify'); return; }
    const lnCheck = validateName(managerLastname); if (!lnCheck.isValid) { showToast(lnCheck.error!, 'error'); setStep('verify'); return; }
    if (!iban.trim() || !bic.trim() || !bankName.trim() || !accountHolderName.trim()) { showToast('Coordonnées bancaires (RIB) requises', 'error'); setStep('verify'); return; }
    if (!kbisFiles.length) { showToast('KBIS requis', 'error'); setStep('documents'); return; }
    if (!identityRectoFiles.length) { showToast('Pièce identité recto requise', 'error'); setStep('documents'); return; }
    if (!identityVersoFiles.length) { showToast('Pièce identité verso requise', 'error'); setStep('documents'); return; }
    if (!insuranceFiles.length) { showToast('Assurance RC Pro requise', 'error'); setStep('documents'); return; }
    if (!licenseFiles.length) { showToast('Licence transport requise', 'error'); setStep('documents'); return; }
    if (!urssafFiles.length) { showToast('Attestation URSSAF requise', 'error'); setStep('documents'); return; }
    if (vehicleOwnership === 'owns') {
      for (const tr of trucks) {
        if (!tr.registration_number.trim()) { showToast('Immatriculation requise', 'error'); setStep('vehicles'); return; }
        if (!tr.capacity_m3 || tr.capacity_m3 <= 0) { showToast('Cubage requis', 'error'); setStep('vehicles'); return; }
        if (!tr.registration_card_files.length) { showToast('Carte grise requise', 'error'); setStep('vehicles'); return; }
      }
    }
    if (password.length < 8) { showToast('Mot de passe: min 8 caractères', 'error'); return; }
    const pwValidation = validatePassword(password);
    if (!pwValidation.isValid) { showToast(pwValidation.errors.join('\n'), 'error'); return; }
    if (password !== confirmPassword) { showToast('Mots de passe différents', 'error'); return; }

    setSubmitting(true);
    try {
      const sbUrl = import.meta.env.VITE_SUPABASE_URL;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const cr = await fetch(`${sbUrl}/functions/v1/create-invited-mover`, { method: 'POST', headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: prospect.email, password, companyName: companyName, prospectId: prospect.id, token }) });
      const cRes = await cr.json();
      if (!cr.ok) { if (cRes.error === 'already_exists') { showToast('Compte existant', 'error'); return; } throw new Error(cRes.error || 'Erreur création'); }

      const { data: sid, error: sie } = await supabase.auth.signInWithPassword({ email: prospect.email, password });
      if (sie) throw new Error('Erreur connexion: ' + sie.message);
      if (!sid.user) throw new Error('Erreur connexion');
      const userId = sid.user.id;

      const upF = async (file: File, folder: string) => {
        const ext = file.name.split('.').pop() || 'pdf';
        const fn = `${userId}/${folder}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { data: d, error: e } = await supabase.storage.from('identity-documents').upload(fn, file);
        if (e) throw new Error(`Upload ${folder}: ${e.message}`);
        return d.path;
      };
      const upAll = async (files: File[], folder: string) => { const u: string[] = []; for (const f of files) u.push(await upF(f, folder)); return u; };

      const kU = await upAll(kbisFiles, 'kbis');
      const irU = await upAll(identityRectoFiles, 'identity_recto');
      const ivU = await upAll(identityVersoFiles, 'identity_verso');
      const inU = await upAll(insuranceFiles, 'insurance');
      const liU = await upAll(licenseFiles, 'license');
      const urU = await upAll(urssafFiles, 'urssaf');
      const bdU = await upAll(bankDetailsFiles, 'bank_details');

      const cov = [department, prospect.region].filter(Boolean);
      const { data: md, error: me } = await supabase.from('movers').insert({
        user_id: userId, company_name: companyName, siret: siret || `IMPORT-${Date.now()}`,
        email: prospect.email, phone: companyPhone || companyMobile || '', address: companyAddress || '',
        city: city || '', postal_code: postalCode || '', manager_firstname: managerFirstname,
        manager_lastname: managerLastname, manager_phone: managerPhone || '', description: '',
        coverage_area: cov, services: [prospect.activity || 'Déménagement'], verification_status: 'pending',
        is_active: false, invitation_token: token, invited_at: new Date().toISOString(), invitation_source: 'import',
        vehicle_ownership: vehicleOwnership,
        iban: iban || null, bic: bic || null, bank_name: bankName || null,
        account_holder_name: accountHolderName || null, bank_details_verified: false,
      }).select().single();
      if (me) throw me;

      // Issue 5: Use proper document_type for identity docs
      const docs: any[] = [];
      kU.forEach(u => docs.push({ mover_id: md.id, document_type: 'kbis', document_name: 'KBIS', document_url: u, verification_status: 'pending' }));
      irU.forEach(u => docs.push({ mover_id: md.id, document_type: 'identity_recto', document_name: "Pièce d'identité (Recto)", document_url: u, verification_status: 'pending' }));
      ivU.forEach(u => docs.push({ mover_id: md.id, document_type: 'identity_verso', document_name: "Pièce d'identité (Verso)", document_url: u, verification_status: 'pending' }));
      inU.forEach(u => docs.push({ mover_id: md.id, document_type: 'insurance', document_name: 'Assurance RC Pro', document_url: u, verification_status: 'pending' }));
      liU.forEach(u => docs.push({ mover_id: md.id, document_type: 'license', document_name: 'Licence de transport', document_url: u, verification_status: 'pending' }));
      urU.forEach(u => docs.push({ mover_id: md.id, document_type: 'urssaf', document_name: 'Attestation URSSAF', document_url: u, verification_status: 'pending' }));
      bdU.forEach(u => docs.push({ mover_id: md.id, document_type: 'bank_details', document_name: 'RIB / Relevé bancaire', document_url: u, verification_status: 'pending' }));
      if (docs.length > 0) await supabase.from('mover_documents').insert(docs);

      // Upload truck docs only if owns vehicles
      if (vehicleOwnership === 'owns') {
        for (const tr of trucks) {
          let cardUrl = '';
          if (tr.registration_card_files.length > 0) {
            const f = tr.registration_card_files[0];
            const ext = f.name.split('.').pop() || 'pdf';
            const fn = `${userId}/truck_${tr.registration_number}_${Date.now()}.${ext}`;
            const { data: td, error: te } = await supabase.storage.from('truck-documents').upload(fn, f);
            if (te) throw new Error('Upload carte grise: ' + te.message);
            cardUrl = td.path;
          }
          await supabase.from('trucks').insert({ mover_id: md.id, registration_number: tr.registration_number, capacity_m3: tr.capacity_m3, registration_card_url: cardUrl || null });
        }
      }

      await supabase.from('mover_prospects').update({ invitation_status: 'signed_up', mover_id: md.id }).eq('id', prospect.id);
      setStep('success');
      showToast('Inscription réussie !', 'success');
    } catch (err: any) { console.error(err); showToast(`Erreur: ${err.message}`, 'error'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" /><p className="text-gray-600">Chargement...</p></div></div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h1 className="text-xl font-bold text-gray-900 mb-2">Invitation invalide</h1><p className="text-gray-600 mb-6">{error}</p><button onClick={() => navigate('/mover/auth')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Connexion</button></div></div>;
  if (!prospect) return null;
  if (step === 'success') return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div><h1 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie ! 🎉</h1><p className="text-gray-600 mb-2">Bienvenue <strong>{companyName}</strong> !</p><p className="text-gray-500 text-sm mb-6">Compte en attente de validation. Vous serez notifié par email.</p><button onClick={() => navigate('/mover/auth')} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Se connecter</button></div></div>;

  const stepsConfig: { id: Step; label: string; icon: any }[] = [
    { id: 'verify', label: 'Informations', icon: Building }, { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'vehicles', label: 'Véhicules', icon: Truck }, { id: 'password', label: 'Mot de passe', icon: Lock },
  ];
  const ci = stepsConfig.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue {companyName} ! 🚚</h1><p className="text-gray-600">Finalisez votre inscription</p></div>
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {stepsConfig.map((s, i) => { const Ic = s.icon; const ac = s.id === step; const dn = i < ci; return (
            <div key={s.id} className="flex items-center gap-1">{i > 0 && <div className={`w-6 h-0.5 ${dn ? 'bg-green-500' : 'bg-gray-300'}`} />}
              <button onClick={() => { if (dn) setStep(s.id); }} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${ac ? 'bg-blue-600 text-white' : dn ? 'bg-green-100 text-green-700 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-default'}`}>{dn ? <Check className="w-3.5 h-3.5" /> : <Ic className="w-3.5 h-3.5" />}{s.label}</button></div>); })}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">

          {/* STEP 1: VERIFY — all fields editable (issue 6) */}
          {step === 'verify' && (<div className="space-y-6">
            <div><h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1"><Building className="w-5 h-5 text-blue-600" /> Vérifiez et complétez vos informations</h2><p className="text-sm text-gray-500">Données pré-remplies. <strong>Complétez les champs manquants</strong> si besoin.</p></div>
            {(!companyPhone && !companyMobile) && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2"><Phone className="w-4 h-4" /> Merci de renseigner votre numéro de téléphone pour être contacté par les clients.</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Building className="w-3 h-3" /> Raison sociale <span className="text-red-500">*</span></label><input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> SIRET</label><input type="text" value={siret} onChange={e => setSiret(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label><div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">{prospect.email}</div></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</label><input type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Mobile</label><input type="tel" value={companyMobile} onChange={e => setCompanyMobile(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</label><input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Code postal</label><input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Ville</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Département</label><input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" /></div>
            </div>
            <div className="border-t border-gray-200 pt-5"><h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> Informations du gérant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label><input type="text" value={managerFirstname} onChange={e => setManagerFirstname(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label><input type="text" value={managerLastname} onChange={e => setManagerLastname(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone gérant</label><input type="tel" value={managerPhone} onChange={e => setManagerPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="06 12 34 56 78" /></div>
              </div></div>

            {/* RIB / Bank details */}
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-600" /> Coordonnées bancaires (RIB)</h3>
              <p className="text-xs text-gray-500 mb-3">Pour recevoir le remboursement de la garantie après chaque mission validée.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IBAN <span className="text-red-500">*</span></label>
                  <input type="text" value={iban} onChange={e => setIban(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="FR76 1234 5678 9012 3456 7890 123" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono" />
                  <p className="text-xs text-gray-400 mt-0.5">Format : FR76 suivi de 23 chiffres</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">BIC / SWIFT <span className="text-red-500">*</span></label>
                    <input type="text" value={bic} onChange={e => setBic(e.target.value.toUpperCase())} placeholder="BNPAFRPP" maxLength={11} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nom de la banque <span className="text-red-500">*</span></label>
                    <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="BNP Paribas, Crédit Agricole..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Titulaire du compte <span className="text-red-500">*</span></label>
                  <input type="text" value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder="Nom du titulaire (entreprise ou personne)" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end"><button onClick={() => { if (!companyName.trim()) { showToast('Raison sociale requise', 'error'); return; } const fnV = validateName(managerFirstname); if (!fnV.isValid) { showToast(fnV.error!, 'error'); return; } const lnV = validateName(managerLastname); if (!lnV.isValid) { showToast(lnV.error!, 'error'); return; } if (!iban.trim()) { showToast('IBAN requis', 'error'); return; } if (!bic.trim()) { showToast('BIC requis', 'error'); return; } if (!bankName.trim()) { showToast('Nom de la banque requis', 'error'); return; } if (!accountHolderName.trim()) { showToast('Titulaire du compte requis', 'error'); return; } setStep('documents'); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Continuer <ArrowRight className="w-4 h-4" /></button></div>
          </div>)}

          {/* STEP 2: DOCUMENTS */}
          {step === 'documents' && (<div className="space-y-6">
            <div><h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1"><FileText className="w-5 h-5 text-blue-600" /> Uploadez vos documents</h2><p className="text-sm text-gray-500">Tous obligatoires. Max 5 Mo/fichier. Plusieurs fichiers possibles.</p></div>
            <FUF label="KBIS (extrait Kbis)" desc="Moins de 3 mois" files={kbisFiles} onChange={setKbisFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 -mt-3">
              <p className="text-amber-800 text-xs">
                <strong>⚠️ Important :</strong> L'extrait KBIS doit dater de <strong>moins de 3 mois</strong> à la date de soumission. Tout document plus ancien sera refusé.
              </p>
            </div>
            <FUF label="Pièce d'identité — Recto" desc="CNI, Passeport ou Permis" files={identityRectoFiles} onChange={setIdentityRectoFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <FUF label="Pièce d'identité — Verso" desc="Verso du document" files={identityVersoFiles} onChange={setIdentityVersoFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <FUF label="Assurance RC Professionnelle" desc="Attestation en cours de validité" files={insuranceFiles} onChange={setInsuranceFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <FUF label="Licence de transport" desc="Licence communautaire ou équivalent" files={licenseFiles} onChange={setLicenseFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <FUF label="Attestation URSSAF" desc="Attestation de vigilance URSSAF en cours de validité" files={urssafFiles} onChange={setUrssafFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <FUF label="RIB / Relevé d'Identité Bancaire" desc="Document bancaire pour les virements (recommandé)" files={bankDetailsFiles} onChange={setBankDetailsFiles} accept=".pdf,.jpg,.jpeg,.png" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 -mt-3">
              <p className="text-blue-800 text-xs">
                <strong>ℹ️ Recommandé :</strong> Joignez votre RIB pour faciliter et accélérer le traitement de vos paiements.
              </p>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep('verify')} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Retour</button>
              <button onClick={() => { if (!kbisFiles.length || !identityRectoFiles.length || !identityVersoFiles.length || !insuranceFiles.length || !licenseFiles.length || !urssafFiles.length) { showToast('Tous les documents sont obligatoires', 'error'); return; } setStep('vehicles'); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Continuer <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>)}

          {/* STEP 3: VEHICLES (issue 7 — checkbox owns/rents) */}
          {step === 'vehicles' && (<div className="space-y-6">
            <div><h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1"><Truck className="w-5 h-5 text-blue-600" /> Véhicules</h2><p className="text-sm text-gray-500">Indiquez si vous possédez ou louez vos véhicules.</p></div>
            
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${vehicleOwnership === 'owns' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="vehicleOwnership" checked={vehicleOwnership === 'owns'} onChange={() => setVehicleOwnership('owns')} className="w-4 h-4 text-blue-600" />
                <div><p className="font-medium text-gray-900">Je possède mes véhicules</p><p className="text-xs text-gray-500">Ajoutez vos véhicules avec carte grise</p></div>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${vehicleOwnership === 'rents' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="vehicleOwnership" checked={vehicleOwnership === 'rents'} onChange={() => setVehicleOwnership('rents')} className="w-4 h-4 text-blue-600" />
                <div><p className="font-medium text-gray-900">Je loue mes véhicules</p><p className="text-xs text-gray-500">Pas de document véhicule requis</p></div>
              </label>
            </div>

            {vehicleOwnership === 'owns' && (<>
              {trucks.map((tr, idx) => (<div key={tr.id} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3"><h4 className="font-semibold text-gray-900 flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600" /> Véhicule #{idx + 1}</h4>{trucks.length > 1 && <button onClick={() => removeTruck(tr.id)} className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Supprimer</button>}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation <span className="text-red-500">*</span></label><input type="text" value={tr.registration_number} onChange={e => updateTruck(tr.id, 'registration_number', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="AA-123-BB" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacité (m³) <span className="text-red-500">*</span></label><input type="number" min="1" step="0.1" value={tr.capacity_m3 || ''} onChange={e => updateTruck(tr.id, 'capacity_m3', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="20" /></div>
                </div>
                <FUF label="Carte grise" desc="Document véhicule" files={tr.registration_card_files} onChange={(f) => updateTruck(tr.id, 'registration_card_files', f)} accept=".pdf,.jpg,.jpeg,.png" />
              </div>))}
              <button onClick={addTruck} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 w-full justify-center"><Plus className="w-4 h-4" /> Ajouter un véhicule</button>
            </>)}

            {vehicleOwnership === 'rents' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <Truck className="w-4 h-4 inline mr-1" /> Vous avez indiqué louer vos véhicules. Aucun document véhicule n'est requis. Vous pourrez modifier cette information plus tard dans votre espace professionnel.
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep('documents')} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Retour</button>
              <button onClick={() => {
                if (vehicleOwnership === 'owns') { for (const tr of trucks) { if (!tr.registration_number.trim() || !tr.capacity_m3 || tr.capacity_m3 <= 0 || !tr.registration_card_files.length) { showToast('Complétez tous les véhicules', 'error'); return; } } }
                setStep('password');
              }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Continuer <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>)}

          {/* STEP 4: PASSWORD */}
          {step === 'password' && (<div className="space-y-6">
            <div><h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1"><Lock className="w-5 h-5 text-blue-600" /> Mot de passe</h2><p className="text-sm text-gray-500">Pour votre espace professionnel.</p></div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"><Mail className="w-4 h-4 inline mr-1" /> Email : <strong>{prospect.email}</strong></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe <span className="text-red-500">*</span></label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10" placeholder="Min. 8 caractères, majuscule, chiffre, spécial" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{password && (() => { const v = validatePassword(password); return !v.isValid ? <div className="mt-1 space-y-0.5">{v.errors.map((e, i) => <p key={i} className="text-xs text-red-500">• {e}</p>)}</div> : <p className="text-xs text-green-500 mt-1">✓ Mot de passe valide</p>; })()}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirmer <span className="text-red-500">*</span></label><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${confirmPassword && confirmPassword !== password ? 'border-red-300' : 'border-gray-300'}`} />{confirmPassword && confirmPassword !== password && <p className="text-xs text-red-500 mt-1">Différents</p>}</div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep('vehicles')} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Retour</button>
              <button onClick={handleSubmit} disabled={submitting || !validatePassword(password).isValid || password !== confirmPassword} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscription...</> : <><CheckCircle className="w-4 h-4" /> Finaliser</>}</button>
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

function FUF({ label, desc, files, onChange, accept }: { label: string; desc: string; files: File[]; onChange: (f: File[]) => void; accept: string }) {
  const hc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nf = Array.from(e.target.files || []);
    const vf: File[] = [];
    for (const f of nf) { if (f.size > MAX_FILE_SIZE) { showToast(`${f.name} dépasse 5 Mo`, 'error'); } else { vf.push(f); } }
    if (vf.length > 0) onChange([...files, ...vf]);
    e.target.value = '';
  };
  const iid = `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2"><div><h4 className="text-sm font-medium text-gray-900">{label} <span className="text-red-500">*</span></h4><p className="text-xs text-gray-500">{desc} — Max 5 Mo</p></div>{files.length > 0 && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}</div>
      {files.length > 0 && <div className="space-y-2 mb-3">{files.map((f, i) => <div key={i} className="flex items-center gap-2 bg-green-50 rounded px-3 py-1.5 text-sm"><FileText className="w-3.5 h-3.5 text-green-600" /><span className="text-green-800 truncate flex-1">{f.name}</span><span className="text-green-600 text-xs">{(f.size/1024/1024).toFixed(1)} Mo</span><button onClick={() => onChange(files.filter((_,j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button></div>)}</div>}
      <label htmlFor={iid} className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-600"><Upload className="w-4 h-4" />{files.length > 0 ? 'Ajouter' : 'Choisir'}</label>
      <input id={iid} type="file" accept={accept} onChange={hc} className="hidden" multiple />
    </div>
  );
}