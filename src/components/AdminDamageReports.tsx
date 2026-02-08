import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Eye, Sparkles, Camera, ArrowRight, Lock, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DamageReport {
  id: string;
  quote_request_id: string;
  reported_by: string;
  before_photo_id: string;
  after_photo_id: string;
  description: string;
  ai_analysis: any;
  responsibility: 'mover' | 'client' | 'disputed' | 'under_review';
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  quote_requests?: {
    from_city: string;
    to_city: string;
    moving_date: string;
    client_name: string;
  };
}

interface MovingPhoto {
  id: string;
  storage_path: string;
  photo_type: string;
  uploaded_by: string;
  created_at: string;
  metadata: any;
}

interface PaymentInfo {
  id: string;
  total_amount: number;
  guarantee_amount: number;
  guarantee_status: string;
  guarantee_released_amount: number;
  guarantee_notes: string;
  deposit_amount: number;
  remaining_amount: number;
  payment_status: string;
}

interface AdminDamageReportsProps {
  onNavigateToFinances?: (paymentId?: string) => void;
  filterQuoteRequestId?: string | null;
  onClearFilter?: () => void;
}

export default function AdminDamageReports({ onNavigateToFinances, filterQuoteRequestId, onClearFilter }: AdminDamageReportsProps) {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [damagePhotos, setDamagePhotos] = useState<MovingPhoto[]>([]);
  const [initialPhotos, setInitialPhotos] = useState<MovingPhoto[]>([]);
  const [moverPhotos, setMoverPhotos] = useState<MovingPhoto[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedResponsibility, setSelectedResponsibility] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  const isResolved = selectedReport?.status === 'resolved' || selectedReport?.status === 'rejected';

  useEffect(() => { fetchReports(); }, []);

  // Auto-select report when filterQuoteRequestId is provided
  useEffect(() => {
    if (filterQuoteRequestId && reports.length > 0) {
      const matchingReport = reports.find(r => r.quote_request_id === filterQuoteRequestId);
      if (matchingReport) {
        setSelectedReport(matchingReport);
      }
    }
  }, [filterQuoteRequestId, reports]);

  useEffect(() => {
    if (selectedReport) {
      fetchReportDetails(selectedReport);
      setResolutionNotes(selectedReport.resolution_notes || '');
      setSelectedResponsibility(selectedReport.responsibility);
      setAiResult(selectedReport.ai_analysis?.ai_result || null);
    }
  }, [selectedReport]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('damage_reports')
        .select('*, quote_requests (from_city, to_city, moving_date, client_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching damage reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (report: DamageReport) => {
    try {
      const { data: allPhotos } = await supabase
        .from('moving_photos')
        .select('*')
        .eq('quote_request_id', report.quote_request_id)
        .order('created_at', { ascending: true });
      if (allPhotos) {
        setDamagePhotos(allPhotos.filter(p => p.photo_type === 'damage'));
        setInitialPhotos(allPhotos.filter(p => ['before_departure', 'before'].includes(p.photo_type)));
        setMoverPhotos(allPhotos.filter(p => ['loading', 'unloading', 'after'].includes(p.photo_type)));
      }
      const { data: payment } = await supabase
        .from('payments')
        .select('id, total_amount, guarantee_amount, guarantee_status, guarantee_released_amount, guarantee_notes, deposit_amount, remaining_amount, payment_status')
        .eq('quote_request_id', report.quote_request_id)
        .maybeSingle();
      setPaymentInfo(payment || null);
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data: { publicUrl } } = supabase.storage.from('moving-photos').getPublicUrl(storagePath);
    return publicUrl;
  };

  const launchAIAnalysis = async () => {
    if (!selectedReport || damagePhotos.length === 0 || isResolved) return;
    setAnalyzingAI(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const analyses = [];
      for (const photo of damagePhotos) {
        const photoUrl = getPhotoUrl(photo.storage_path);
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/analyze-damage-photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
            body: JSON.stringify({ imageUrl: photoUrl, photoType: 'damage' }),
          });
          const data = await response.json();
          if (data.success && data.analysis) analyses.push({ photoId: photo.id, ...data.analysis });
          else if (data.fallback) analyses.push({ photoId: photo.id, ...data.fallback });
        } catch (err) {
          analyses.push({ photoId: photo.id, hasDamage: true, severity: 'unknown', damageDescription: 'Analyse impossible' });
        }
      }
      const severityOrder = ['none', 'minor', 'moderate', 'severe'];
      const maxSeverity = analyses.reduce((max, a) => {
        const idx = severityOrder.indexOf(a.severity || 'none');
        return idx > severityOrder.indexOf(max) ? (a.severity || 'none') : max;
      }, 'none');
      const result = { photos_analyzed: analyses.length, analyses, overall_severity: maxSeverity, has_damage: analyses.some(a => a.hasDamage), analyzed_at: new Date().toISOString() };
      setAiResult(result);
      await supabase.from('damage_reports').update({ ai_analysis: { ...selectedReport.ai_analysis, ai_result: result } }).eq('id', selectedReport.id);
    } catch (error) {
      alert('Erreur lors de l\'analyse IA');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleUpdateReport = async (newStatus: 'under_review' | 'resolved' | 'rejected') => {
    if (!selectedReport || isResolved) return;
    if (newStatus === 'resolved' && !resolutionNotes.trim()) { alert('Veuillez ajouter des notes de résolution'); return; }
    setUpdating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('damage_reports').update({
        status: newStatus,
        responsibility: selectedResponsibility,
        resolution_notes: resolutionNotes,
        resolved_by: userData.user?.id,
        resolved_at: (newStatus === 'resolved' || newStatus === 'rejected') ? new Date().toISOString() : null,
        ai_analysis: { ...selectedReport.ai_analysis, ai_result: aiResult }
      }).eq('id', selectedReport.id);
      if (error) throw error;
      alert('Déclaration mise à jour. Rendez-vous dans Gestion Financière > Paiements pour la décision escrow/garantie.');
      setSelectedReport(null);
      await fetchReports();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">En attente</span>;
      case 'under_review': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">En révision</span>;
      case 'resolved': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Résolu</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Rejeté</span>;
      default: return null;
    }
  };

  const getResponsibilityBadge = (responsibility: string) => {
    switch (responsibility) {
      case 'mover': return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Déménageur</span>;
      case 'client': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Client</span>;
      case 'disputed': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Contesté</span>;
      case 'under_review': return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">À analyser</span>;
      default: return null;
    }
  };

  const getGuaranteeStatusLabel = (status: string) => {
    switch (status) {
      case 'held': return { label: 'Retenue', color: 'bg-orange-100 text-orange-800' };
      case 'released_to_mover': return { label: 'Restituée au déménageur', color: 'bg-green-100 text-green-800' };
      case 'kept_for_client': return { label: 'Retenue pour le client', color: 'bg-red-100 text-red-800' };
      case 'partial_release': return { label: 'Restitution partielle', color: 'bg-yellow-100 text-yellow-800' };
      default: return { label: status || 'Inconnue', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'none': return { label: 'Aucun', color: 'bg-green-100 text-green-800' };
      case 'minor': return { label: 'Mineur', color: 'bg-yellow-100 text-yellow-800' };
      case 'moderate': return { label: 'Modéré', color: 'bg-orange-100 text-orange-800' };
      case 'severe': return { label: 'Important', color: 'bg-red-100 text-red-800' };
      default: return { label: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  // ================= REPORT DETAIL VIEW =================
  if (selectedReport) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedReport(null); setAiResult(null); onClearFilter?.(); }} className="text-blue-600 hover:underline">← Retour à la liste</button>

        {isResolved && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${selectedReport.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <Lock className={`w-5 h-5 ${selectedReport.status === 'resolved' ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className={`font-semibold ${selectedReport.status === 'resolved' ? 'text-green-800' : 'text-red-800'}`}>
                Ce sinistre a été {selectedReport.status === 'resolved' ? 'résolu' : 'rejeté'}
                {selectedReport.resolved_at && ` le ${new Date(selectedReport.resolved_at).toLocaleDateString('fr-FR')}`}
              </p>
              <p className="text-sm text-gray-600">Lecture seule. La décision financière se gère dans Gestion Financière.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Déclaration de sinistre</h2>
              <p className="text-gray-600">{selectedReport.quote_requests?.from_city} → {selectedReport.quote_requests?.to_city}</p>
              <p className="text-sm text-gray-500">Client: {selectedReport.quote_requests?.client_name} • {new Date(selectedReport.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="flex gap-2 flex-wrap">{getStatusBadge(selectedReport.status)}{getResponsibilityBadge(selectedReport.responsibility)}</div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description du client</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedReport.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Camera className="w-5 h-5 text-orange-600" />Photos de dommages ({damagePhotos.length})</h3>
            {damagePhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {damagePhotos.map(photo => (
                  <div key={photo.id} className="relative group cursor-pointer" onClick={() => setViewPhotoUrl(getPhotoUrl(photo.storage_path))}>
                    <img src={getPhotoUrl(photo.storage_path)} alt="Dommage" className="w-full h-32 object-cover rounded-lg border-2 border-orange-300" />
                    <div className="absolute top-1 left-1 bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold">Dommage</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">Aucune photo de dommage</p>}
          </div>

          {initialPhotos.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Photos initiales (avant déménagement)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {initialPhotos.map(photo => (
                  <div key={photo.id} className="cursor-pointer" onClick={() => setViewPhotoUrl(getPhotoUrl(photo.storage_path))}>
                    <img src={getPhotoUrl(photo.storage_path)} alt="Avant" className="w-full h-32 object-cover rounded-lg border-2 border-purple-300" />
                    <p className="text-xs text-purple-600 font-medium mt-1">Avant</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {moverPhotos.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Photos du déménageur (après mission)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moverPhotos.map(photo => (
                  <div key={photo.id} className="cursor-pointer" onClick={() => setViewPhotoUrl(getPhotoUrl(photo.storage_path))}>
                    <img src={getPhotoUrl(photo.storage_path)} alt="Déménageur" className="w-full h-32 object-cover rounded-lg border-2 border-blue-300" />
                    <p className="text-xs text-blue-600 font-medium mt-1">Déménageur</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" />Analyse IA</h3>
              {!isResolved && (
                <button onClick={launchAIAnalysis} disabled={analyzingAI || damagePhotos.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50">
                  {analyzingAI ? <><Loader2 className="w-4 h-4 animate-spin" />Analyse...</> : <><Sparkles className="w-4 h-4" />{aiResult ? 'Relancer' : 'Lancer l\'analyse IA'}</>}
                </button>
              )}
            </div>
            {aiResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div><span className="text-sm text-gray-600">Dommage:</span><span className={`ml-2 font-semibold ${aiResult.has_damage ? 'text-red-600' : 'text-green-600'}`}>{aiResult.has_damage ? 'Oui' : 'Non'}</span></div>
                  <div><span className="text-sm text-gray-600">Sévérité:</span><span className={`ml-2 px-2 py-0.5 rounded-full text-sm font-medium ${getSeverityLabel(aiResult.overall_severity).color}`}>{getSeverityLabel(aiResult.overall_severity).label}</span></div>
                  <div><span className="text-sm text-gray-600">Photos:</span><span className="ml-2 font-semibold">{aiResult.photos_analyzed}</span></div>
                </div>
                {aiResult.analyses?.length > 0 && (
                  <div className="space-y-2">{aiResult.analyses.map((a: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityLabel(a.severity).color}`}>{getSeverityLabel(a.severity).label}</span>
                      {a.damageDescription && <p className="text-sm text-gray-700 mt-1">{a.damageDescription}</p>}
                    </div>
                  ))}</div>
                )}
              </div>
            ) : <p className="text-sm text-gray-500">{isResolved ? 'Aucune analyse IA effectuée.' : 'Cliquez sur "Lancer l\'analyse IA" pour analyser les photos.'}</p>}
          </div>

          {/* Payment info + navigate to finances */}
          {paymentInfo && (
            <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">💰 Paiement & Garantie</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <p className="text-xs text-gray-500">Montant total</p>
                  <p className="text-lg font-bold text-gray-900">{paymentInfo.total_amount?.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                  <p className="text-xs text-gray-500">Garantie</p>
                  <p className="text-lg font-bold text-emerald-700">{(paymentInfo.guarantee_amount || 0).toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                  <p className="text-xs text-gray-500">Statut garantie</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getGuaranteeStatusLabel(paymentInfo.guarantee_status).color}`}>{getGuaranteeStatusLabel(paymentInfo.guarantee_status).label}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200 text-center">
                  <p className="text-xs text-gray-500">Restitué</p>
                  <p className="text-lg font-bold text-purple-700">{(paymentInfo.guarantee_released_amount || 0).toLocaleString('fr-FR')} €</p>
                </div>
              </div>
              {paymentInfo.guarantee_notes && (
                <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{paymentInfo.guarantee_notes}</p>
                </div>
              )}
              <button onClick={() => onNavigateToFinances?.(paymentInfo.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold">
                <ExternalLink className="w-5 h-5" />Voir dans Gestion Financière<ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Responsibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Responsabilité</label>
            <select value={selectedResponsibility} onChange={(e) => !isResolved && setSelectedResponsibility(e.target.value)} disabled={isResolved}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isResolved ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'focus:ring-2 focus:ring-blue-500'}`}>
              <option value="under_review">À analyser</option>
              <option value="mover">Déménageur responsable</option>
              <option value="client">Client responsable</option>
              <option value="disputed">Contesté</option>
            </select>
          </div>

          {/* Resolution notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes de résolution</label>
            <textarea value={resolutionNotes} onChange={(e) => !isResolved && setResolutionNotes(e.target.value)} readOnly={isResolved} rows={4}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isResolved ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'focus:ring-2 focus:ring-blue-500'}`}
              placeholder="Expliquez votre décision..." />
          </div>

          {/* Action buttons - ONLY if not resolved */}
          {!isResolved && (
            <div className="flex gap-3">
              <button onClick={() => handleUpdateReport('under_review')} disabled={updating} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50">Marquer en révision</button>
              <button onClick={() => handleUpdateReport('resolved')} disabled={updating} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50">Résoudre</button>
              <button onClick={() => handleUpdateReport('rejected')} disabled={updating} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50">Rejeter</button>
            </div>
          )}

          {isResolved && paymentInfo && (
            <button onClick={() => onNavigateToFinances?.(paymentInfo.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
              <ExternalLink className="w-5 h-5" />Gérer la décision financière (Escrow / Garantie)
            </button>
          )}
        </div>

        {viewPhotoUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setViewPhotoUrl(null)}>
            <img src={viewPhotoUrl} alt="Photo agrandie" className="max-w-full max-h-screen object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  // ================= REPORTS LIST VIEW =================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Déclarations de sinistre</h2>
        <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" /><span className="font-semibold text-sm">{reports.filter(r => r.status === 'pending').length} en attente</span></div>
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg"><AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">Aucune déclaration de sinistre</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trajet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsabilité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(report.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{report.quote_requests?.client_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.quote_requests?.from_city} → {report.quote_requests?.to_city}</td>
                    <td className="px-6 py-4">{getResponsibilityBadge(report.responsibility)}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => setSelectedReport(report)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {report.status === 'resolved' || report.status === 'rejected' ? 'Consulter' : 'Examiner'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{report.quote_requests?.client_name}</span>
                  <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-sm text-gray-600">{report.quote_requests?.from_city} → {report.quote_requests?.to_city}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {getResponsibilityBadge(report.responsibility)}
                  {getStatusBadge(report.status)}
                </div>
                <button onClick={() => setSelectedReport(report)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-sm mt-1">
                  <Eye className="w-4 h-4" /> {report.status === 'resolved' || report.status === 'rejected' ? 'Consulter' : 'Examiner'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
