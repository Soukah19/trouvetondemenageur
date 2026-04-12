import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Lock, CheckCircle, AlertCircle, EyeOff, Eye, Loader2, Phone, Mail, ArrowRight, ArrowLeft, MapPin, Clock, Map as MapIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { validatePassword } from '../utils/validation';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { calculateRealDistance } from '../utils/distanceCalculator';

interface ProspectData {
  id: string; email: string; firstname: string; lastname: string; phone: string;
  invitation_status: string; invitation_expires_at: string;
  inscription_type?: string; initial_quote_data?: any;
}

const HOME_SIZES = ['Studio', 'T1', 'T2', 'T3', 'T4', 'T5+'];
const HOME_TYPES = ['Appartement', 'Maison', 'Bureau'];
const SERVICES = ['Emballage/Déballage', 'Fourniture de cartons', 'Démontage/Remontage meubles', 'Garde-meubles', "Transport d'objets fragiles", 'Nettoyage après déménagement'];
const FORMULAS = [
  { id: 'eco', label: 'ECO', desc: 'Aucun service' },
  { id: 'standard', label: 'STANDARD', desc: 'Démontage/Remontage' },
  { id: 'confort', label: 'CONFORT', desc: 'Emballage + Démontage/Remontage' },
  { id: 'premium', label: 'PREMIUM', desc: 'Tout inclus' },
];
const CARRYING_DISTANCES = ['10m', '20m', '30m', '40m', '50m+'];

function RouteMapDisplay({ fromLat, fromLng, toLat, toLng }: { fromLat: number; fromLng: number; toLat: number; toLng: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mapRef.current || !fromLat || !toLat) return;
    if (typeof google === 'undefined' || !google.maps) return;
    const map = new google.maps.Map(mapRef.current, { zoom: 6, center: { lat: (fromLat + toLat) / 2, lng: (fromLng + toLng) / 2 }, disableDefaultUI: true, zoomControl: true });
    const ds = new google.maps.DirectionsService();
    const dr = new google.maps.DirectionsRenderer({ map, suppressMarkers: false, polylineOptions: { strokeColor: '#4F46E5', strokeWeight: 4 } });
    ds.route({ origin: { lat: fromLat, lng: fromLng }, destination: { lat: toLat, lng: toLng }, travelMode: google.maps.TravelMode.DRIVING }, (r, s) => { if (s === 'OK' && r) dr.setDirections(r); });
  }, [fromLat, fromLng, toLat, toLng]);
  return <div ref={mapRef} className="w-full h-64 rounded-xl border border-gray-200" />;
}

export default function ClientInviteSignupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasQuote = prospect?.inscription_type === 'with_quote' && !!prospect?.initial_quote_data;
  type StepType = 'info' | 'demande' | 'password' | 'success';
  const [step, setStep] = useState<StepType>('info');

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [qf, setQf] = useState({
    from_address: '', from_city: '', from_postal_code: '', from_latitude: null as number | null, from_longitude: null as number | null, from_home_size: '', from_home_type: '',
    from_surface_m2: null as number | null, elevator_capacity_from: '',
    to_address: '', to_city: '', to_postal_code: '', to_latitude: null as number | null, to_longitude: null as number | null, to_home_size: '', to_home_type: '',
    to_surface_m2: null as number | null, elevator_capacity_to: '',
    moving_date: '', floor_from: 0, floor_to: 0, elevator_from: false, elevator_to: false,
    furniture_lift_needed_departure: false, furniture_lift_needed_arrival: false,
    carrying_distance_from: '', carrying_distance_to: '',
    volume_m3: '', formula: 'eco', services_needed: [] as string[], accepts_groupage: false, additional_info: '',
  });
  const [showMap, setShowMap] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<{ distance: number; distanceText: string; duration: number; durationText: string } | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  useEffect(() => { if (token) fetchProspect(); }, [token]);

  useEffect(() => {
    if (!prospect?.initial_quote_data) return;
    const d = prospect.initial_quote_data;
    setQf({
      from_address: d.from_address || '', from_city: d.from_city || '', from_postal_code: d.from_postal_code || '',
      from_latitude: d.from_latitude || null, from_longitude: d.from_longitude || null, from_home_size: d.from_home_size || '', from_home_type: d.from_home_type || '',
      from_surface_m2: d.from_surface_m2 ?? null, elevator_capacity_from: d.elevator_capacity_from || '',
      to_address: d.to_address || '', to_city: d.to_city || '', to_postal_code: d.to_postal_code || '',
      to_latitude: d.to_latitude || null, to_longitude: d.to_longitude || null, to_home_size: d.to_home_size || '', to_home_type: d.to_home_type || '',
      to_surface_m2: d.to_surface_m2 ?? null, elevator_capacity_to: d.elevator_capacity_to || '',
      moving_date: d.moving_date || '', floor_from: d.floor_from || 0, floor_to: d.floor_to || 0,
      elevator_from: d.elevator_from || false, elevator_to: d.elevator_to || false,
      furniture_lift_needed_departure: d.furniture_lift_needed_departure || false, furniture_lift_needed_arrival: d.furniture_lift_needed_arrival || false,
      carrying_distance_from: d.carrying_distance_from || '', carrying_distance_to: d.carrying_distance_to || '',
      volume_m3: d.volume_m3 ? String(d.volume_m3) : '', formula: d.formula || 'eco',
      services_needed: d.services_needed || [], accepts_groupage: d.accepts_groupage || false, additional_info: d.additional_info || '',
    });
    if (d.distance_text) setCalculatedDistance({ distance: d.distance_km || 0, distanceText: d.distance_text, duration: 0, durationText: d.duration_text || '' });
  }, [prospect]);

  useEffect(() => {
    if (!qf.from_city || !qf.to_city) return;
    const t = setTimeout(async () => {
      setCalculatingDistance(true);
      try { const r = await calculateRealDistance(qf.from_address, qf.from_city, qf.from_postal_code, qf.to_address, qf.to_city, qf.to_postal_code); if (r) setCalculatedDistance(r); } catch {}
      finally { setCalculatingDistance(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [qf.from_address, qf.from_city, qf.from_postal_code, qf.to_address, qf.to_city, qf.to_postal_code]);

  const fetchProspect = async () => {
    try {
      const { data, error: fe } = await supabase.from('client_prospects').select('*').eq('invitation_token', token).single();
      if (fe || !data) { setError("Lien d'invitation invalide ou expiré."); return; }
      if (data.invitation_status === 'signed_up') { setError('Vous êtes déjà inscrit ! Connectez-vous.'); return; }
      if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) { setError('Ce lien a expiré.'); return; }
      setProspect(data); setFirstname(data.firstname || ''); setLastname(data.lastname || ''); setPhone(data.phone || '');
      await supabase.from('client_prospects').update({ invitation_clicked_at: new Date().toISOString() }).eq('id', data.id);
    } catch { setError('Erreur de chargement.'); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!prospect) return;
    if (!firstname.trim()) { showToast('Prénom requis', 'error'); setStep('info'); return; }
    if (!lastname.trim()) { showToast('Nom requis', 'error'); setStep('info'); return; }
    const pw = validatePassword(password);
    if (!pw.isValid) { showToast(pw.errors.join('\n'), 'error'); return; }
    if (password !== confirmPassword) { showToast('Mots de passe différents', 'error'); return; }
    setSubmitting(true);
    try {
      const sbUrl = import.meta.env.VITE_SUPABASE_URL; const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      // Pass the edited quote data directly to the edge function instead of relying on a
      // prior DB update — this avoids the race condition where the function reads the
      // original admin-set data before the update is committed.
      const quoteData = hasQuote ? {
        ...qf,
        volume_m3: qf.volume_m3 ? parseFloat(qf.volume_m3) : null,
        distance_km: calculatedDistance?.distance || null,
        distance_text: calculatedDistance?.distanceText || null,
        duration_text: calculatedDistance?.durationText || null,
      } : null;
      const cr = await fetch(`${sbUrl}/functions/v1/create-invited-client`, { method: 'POST', headers: { 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: prospect.email, password, firstname: firstname.trim(), lastname: lastname.trim(), phone: phone.trim(), token, quoteData }) });
      const cRes = await cr.json();
      if (!cr.ok) { if (cRes.error === 'already_exists') { showToast('Compte existant.', 'error'); return; } if (cRes.error === 'expired') { showToast('Lien expiré.', 'error'); return; } throw new Error(cRes.error || 'Erreur'); }
      await supabase.auth.signInWithPassword({ email: prospect.email, password }).catch(() => {});
      setStep('success'); showToast('Inscription réussie !', 'success');
    } catch (err: any) { showToast(`Erreur: ${err.message}`, 'error'); } finally { setSubmitting(false); }
  };

  const sf = (f: string, v: any) => setQf(p => ({ ...p, [f]: v }));
  const ts = (s: string) => setQf(p => ({ ...p, services_needed: p.services_needed.includes(s) ? p.services_needed.filter(x => x !== s) : [...p.services_needed, s] }));
  const ic = "w-full text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h1 className="text-xl font-bold mb-2">Invitation invalide</h1><p className="text-gray-600 mb-6">{error}</p><button onClick={() => navigate('/client/login')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Se connecter</button></div></div>;
  if (!prospect) return null;

  const stepsConfig = hasQuote ? [{ id: 'info', l: 'Informations' }, { id: 'demande', l: 'Demande' }, { id: 'password', l: 'Mot de passe' }] : [{ id: 'info', l: 'Informations' }, { id: 'password', l: 'Mot de passe' }];

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-lg w-full p-8 text-center ${hasQuote ? 'max-w-xl' : 'max-w-md'}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>
        <h1 className="text-2xl font-bold mb-2">Bienvenue ! 🎉</h1>
        <p className="text-gray-600 mb-4">Votre compte a été créé avec succès.</p>
        {hasQuote && <p className="text-green-700 text-sm mb-6">Votre demande de déménagement a été publiée. Les déménageurs peuvent vous envoyer des devis.</p>}
        <button onClick={() => navigate('/client/dashboard')} className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Accéder à mon espace</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue{firstname ? ` ${firstname}` : ''} ! 🏠</h1>
          <p className="text-gray-600">Créez votre compte en quelques secondes</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {stepsConfig.map((s, i) => (
            <button key={s.id} onClick={() => { if (stepsConfig.findIndex(x => x.id === step) > i) setStep(s.id as StepType); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${step === s.id ? 'bg-indigo-600 text-white' : stepsConfig.findIndex(x => x.id === step) > i ? 'bg-green-100 text-green-700 cursor-pointer' : 'bg-gray-100 text-gray-400'}`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{i + 1}</span>{s.l}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          {step === 'info' && (
            <div className="space-y-5">
              <div><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1"><User className="w-5 h-5 text-indigo-600" /> Vos informations</h2><p className="text-sm text-gray-500">Modifiez si besoin.</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</label><div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">{prospect.email}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label><input type="text" value={firstname} onChange={e => setFirstname(e.target.value)} className={ic} placeholder="Prénom" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input type="text" value={lastname} onChange={e => setLastname(e.target.value)} className={ic} placeholder="Nom" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Téléphone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={ic} placeholder="06 12 34 56 78" /></div>
              <div className="flex justify-end pt-2">
                <button onClick={() => { if (!firstname.trim()) { showToast('Prénom requis', 'error'); return; } if (!lastname.trim()) { showToast('Nom requis', 'error'); return; } setStep(hasQuote ? 'demande' : 'password'); }} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><ArrowRight className="w-4 h-4" /> Suivant</button>
              </div>
            </div>
          )}

          {step === 'demande' && hasQuote && (
            <div className="space-y-5">
              <div><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1"><MapPin className="w-5 h-5 text-blue-600" /> Votre demande de déménagement</h2><p className="text-sm text-gray-500">Vérifiez et modifiez si nécessaire.</p></div>

              {(qf.from_city && qf.to_city) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">📏 Distance</p>
                    {calculatingDistance ? <p className="text-xs text-blue-600 animate-pulse">Calcul...</p>
                      : calculatedDistance ? <div className="flex items-center gap-4 text-sm"><span className="font-bold text-blue-800">{calculatedDistance.distanceText}</span><span className="text-green-700">Durée : {calculatedDistance.durationText}</span></div>
                      : <p className="text-xs text-gray-500">Adresses nécessaires</p>}
                  </div>
                  {qf.from_latitude && qf.to_latitude && (
                    <button type="button" onClick={() => setShowMap(!showMap)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"><MapIcon className="w-3.5 h-3.5" />{showMap ? 'Masquer' : 'Voir carte'}</button>
                  )}
                </div>
              )}
              {showMap && qf.from_latitude && qf.to_latitude && <RouteMapDisplay fromLat={qf.from_latitude} fromLng={qf.from_longitude!} toLat={qf.to_latitude} toLng={qf.to_longitude!} />}

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase">🏠 Départ</p>
                <AddressAutocomplete id="invite-from" value={`${qf.from_address}${qf.from_city ? ', ' + qf.from_city : ''}`} onAddressSelect={a => setQf(p => ({ ...p, from_address: a.street, from_city: a.city, from_postal_code: a.postalCode, from_latitude: a.latitude || null, from_longitude: a.longitude || null }))} placeholder="Adresse de départ..." label="Adresse" required />
                <div className="grid grid-cols-2 gap-2">
                  <select value={qf.from_home_size} onChange={e => sf('from_home_size', e.target.value)} className={ic}><option value="">Taille</option>{HOME_SIZES.map(s => <option key={s}>{s}</option>)}</select>
                  <select value={qf.from_home_type} onChange={e => sf('from_home_type', e.target.value)} className={ic}><option value="">Type</option>{HOME_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs text-gray-600">Étage</label><input type="number" min="0" value={qf.floor_from} onChange={e => sf('floor_from', parseInt(e.target.value) || 0)} className={ic} /></div>
                  <div><label className="text-xs text-gray-600">Portage</label><select value={qf.carrying_distance_from} onChange={e => sf('carrying_distance_from', e.target.value)} className={ic}><option value="">—</option>{CARRYING_DISTANCES.map(d => <option key={d}>{d}</option>)}</select></div>
                  <div className="flex flex-col justify-end gap-1"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={qf.elevator_from} onChange={e => sf('elevator_from', e.target.checked)} className="rounded" />Ascenseur</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={qf.furniture_lift_needed_departure} onChange={e => sf('furniture_lift_needed_departure', e.target.checked)} className="rounded" />Monte-meuble</label></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase">📍 Arrivée</p>
                <AddressAutocomplete id="invite-to" value={`${qf.to_address}${qf.to_city ? ', ' + qf.to_city : ''}`} onAddressSelect={a => setQf(p => ({ ...p, to_address: a.street, to_city: a.city, to_postal_code: a.postalCode, to_latitude: a.latitude || null, to_longitude: a.longitude || null }))} placeholder="Adresse d'arrivée..." label="Adresse" required />
                <div className="grid grid-cols-2 gap-2">
                  <select value={qf.to_home_size} onChange={e => sf('to_home_size', e.target.value)} className={ic}><option value="">Taille</option>{HOME_SIZES.map(s => <option key={s}>{s}</option>)}</select>
                  <select value={qf.to_home_type} onChange={e => sf('to_home_type', e.target.value)} className={ic}><option value="">Type</option>{HOME_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs text-gray-600">Étage</label><input type="number" min="0" value={qf.floor_to} onChange={e => sf('floor_to', parseInt(e.target.value) || 0)} className={ic} /></div>
                  <div><label className="text-xs text-gray-600">Portage</label><select value={qf.carrying_distance_to} onChange={e => sf('carrying_distance_to', e.target.value)} className={ic}><option value="">—</option>{CARRYING_DISTANCES.map(d => <option key={d}>{d}</option>)}</select></div>
                  <div className="flex flex-col justify-end gap-1"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={qf.elevator_to} onChange={e => sf('elevator_to', e.target.checked)} className="rounded" />Ascenseur</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={qf.furniture_lift_needed_arrival} onChange={e => sf('furniture_lift_needed_arrival', e.target.checked)} className="rounded" />Monte-meuble</label></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><input type="date" value={qf.moving_date} onChange={e => sf('moving_date', e.target.value)} min={new Date().toISOString().split('T')[0]} className={ic} /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Volume (m³)</label><input type="number" min="0" step="0.5" value={qf.volume_m3} onChange={e => sf('volume_m3', e.target.value)} placeholder="25" className={ic} /></div>
              </div>

              <div><label className="text-xs font-medium text-gray-600 mb-2 block">Formule</label><div className="grid grid-cols-4 gap-2">{FORMULAS.map(f => (<button key={f.id} type="button" onClick={() => sf('formula', f.id)} className={`p-2 border-2 rounded-lg text-center text-xs transition ${qf.formula === f.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}><div className="font-bold">{f.label}</div><div className="text-gray-500 text-[10px]">{f.desc}</div></button>))}</div></div>
              <div><label className="text-xs font-medium text-gray-600 mb-2 block">Services</label><div className="flex flex-wrap gap-2">{SERVICES.map(s => (<button key={s} type="button" onClick={() => ts(s)} className={`px-2 py-1 rounded-full text-xs border transition ${qf.services_needed.includes(s) ? 'bg-indigo-100 border-indigo-400 text-indigo-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{s}</button>))}</div></div>
              <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={qf.accepts_groupage} onChange={e => sf('accepts_groupage', e.target.checked)} className="rounded" />Accepte le groupage</label>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label><textarea rows={2} value={qf.additional_info} onChange={e => sf('additional_info', e.target.value)} className={ic} placeholder="Détails supplémentaires..." /></div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep('info')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Retour</button>
                <button onClick={() => { if (!qf.from_city && !qf.from_address) { showToast('Adresse de départ requise', 'error'); return; } if (!qf.to_city && !qf.to_address) { showToast("Adresse d'arrivée requise", 'error'); return; } if (!qf.moving_date) { showToast('Date requise', 'error'); return; } setStep('password'); }} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><ArrowRight className="w-4 h-4" /> Suivant</button>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-5">
              <div><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1"><Lock className="w-5 h-5 text-indigo-600" /> Créez votre mot de passe</h2><p className="text-sm text-gray-500">Choisissez un mot de passe sécurisé.</p></div>
              <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className={ic} placeholder="Min. 8 caractères" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirmer *</label><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={ic} placeholder="Retapez le mot de passe" /></div>
              {password && <div className="space-y-1 text-xs">{[{ok: password.length >= 8, t: '8 caractères minimum'}, {ok: /[A-Z]/.test(password), t: '1 majuscule'}, {ok: /[0-9]/.test(password), t: '1 chiffre'}, {ok: password === confirmPassword && confirmPassword.length > 0, t: 'Identiques'}].map((r, i) => <div key={i} className={`flex items-center gap-1.5 ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>{r.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 border rounded-full border-gray-300" />}{r.t}</div>)}</div>}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(hasQuote ? 'demande' : 'info')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Retour</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : <><CheckCircle className="w-4 h-4" /> Créer mon compte</>}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}