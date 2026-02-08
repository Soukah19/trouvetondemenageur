import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Euro, Info, Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

interface MissionCompletionButtonProps {
  quoteId: string;
  quoteRequestId: string;
}

interface PaymentData {
  id: string;
  mission_completion_status: string;
  total_amount: number;
  mover_price: number;
  deposit_amount: number;
  remaining_amount: number;
  guarantee_amount: number;
  guarantee_status: string;
  release_requested_at?: string;
}

interface MoverPhoto {
  id: string;
  storage_path: string;
  created_at: string;
}

export function MissionCompletionButton({ quoteId, quoteRequestId }: MissionCompletionButtonProps) {
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [moverPhotos, setMoverPhotos] = useState<MoverPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [quoteId, quoteRequestId]);

  const loadData = async () => {
    try {
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('id, mission_completion_status, total_amount, mover_price, deposit_amount, remaining_amount, guarantee_amount, guarantee_status, release_requested_at')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (payError) throw payError;
      setPayment(payData);

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: photosData } = await supabase
          .from('moving_photos')
          .select('id, storage_path, created_at')
          .eq('quote_request_id', quoteRequestId)
          .eq('uploaded_by', userData.user.id)
          .order('created_at', { ascending: false });
        setMoverPhotos(photosData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Non authentifié');

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${quoteRequestId}/mover_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('moving-photos')
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { error: photoError } = await supabase
          .from('moving_photos')
          .insert({
            quote_request_id: quoteRequestId,
            uploaded_by: userData.user.id,
            photo_type: 'after',
            storage_path: fileName,
            metadata: {
              uploaded_at: new Date().toISOString(),
              file_size: file.size,
              file_type: file.type,
              uploaded_by_type: 'mover'
            }
          });
        if (photoError) throw photoError;
      }

      showToast('Photos uploadées avec succès', 'success');
      await loadData();
    } catch (error) {
      console.error('Error uploading photos:', error);
      showToast("Erreur lors de l'upload", 'error');
    } finally {
      setUploading(false);
    }
  };

  const getPhotoUrl = (storagePath: string): string => {
    const { data } = supabase.storage.from('moving-photos').getPublicUrl(storagePath);
    return data?.publicUrl || '';
  };

  const handleConfirmMission = async () => {
    if (!payment) return;

    setProcessing(true);
    try {
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          mission_completion_status: 'completed_pending_review',
          mission_completion_date: now,
          release_requested_at: now,
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      await supabase
        .from('quote_requests')
        .update({ status: 'completed' })
        .eq('id', quoteRequestId);

      try {
        await supabase
          .from('moving_status')
          .upsert({ quote_request_id: quoteRequestId, status: 'completed', completed_at: now }, { onConflict: 'quote_request_id' });
      } catch (e) { /* non-fatal */ }

      setPayment(prev => prev ? { ...prev, mission_completion_status: 'completed_pending_review', release_requested_at: now } : null);
      setShowSuccessModal(true);
      setTimeout(() => loadData(), 1000);
    } catch (error) {
      console.error('Error completing mission:', error);
      showToast('Erreur lors de la confirmation. Veuillez réessayer.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900 mb-1">Paiement en attente</div>
            <div className="text-sm text-amber-700">
              Le système de fin de mission sera disponible une fois le paiement de l'acompte effectué par le client.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const guaranteeAmount = payment.guarantee_amount || payment.deposit_amount || 0;
  const moverPrice = payment.mover_price || 0;
  const directPayment = payment.remaining_amount || 0;

  // === SUCCESS MODAL after confirming mission ===
  if (showSuccessModal) {
    return (
      <div className="space-y-3">
        <div className="border-2 rounded-xl p-5 bg-green-50 border-green-300">
          <div className="text-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-green-900">Mission terminée avec succès !</h3>
            <p className="text-sm text-green-700 mt-1">
              Le client dispose de <strong>48h</strong> pour signaler d'éventuels dommages.
            </p>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">📸 Uploadez des photos des meubles livrés</p>
                <p className="text-sm text-gray-600">
                  Pour une meilleure sécurité, prenez des photos de l'état des meubles après la livraison.
                  En cas de litige, ces photos serviront de preuve.
                </p>
              </div>
            </div>
          </div>

          {moverPhotos.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Vos photos ({moverPhotos.length}) :</p>
              <div className="grid grid-cols-4 gap-2">
                {moverPhotos.map((photo) => (
                  <div key={photo.id} className="rounded-lg overflow-hidden border border-green-200 cursor-pointer" onClick={() => setViewPhotoUrl(getPhotoUrl(photo.storage_path))}>
                    <img src={getPhotoUrl(photo.storage_path)} alt="Photo après" className="w-full h-16 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition mb-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin text-blue-600" /><span className="text-sm text-gray-600">Upload en cours...</span></>
            ) : (
              <><Upload className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium text-blue-700">Ajouter des photos après livraison</span></>
            )}
            <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg" multiple onChange={handleFileUpload} disabled={uploading} />
          </label>

          <button
            onClick={() => { setShowSuccessModal(false); showToast('Fin de mission confirmée.', 'success'); }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            {moverPhotos.length > 0 ? 'Terminé' : 'Continuer sans photos'}
          </button>
        </div>

        {viewPhotoUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setViewPhotoUrl(null)}>
            <div className="relative max-w-4xl">
              <button onClick={() => setViewPhotoUrl(null)} className="absolute top-2 right-2 bg-white text-gray-900 p-2 rounded-full z-10"><X className="w-5 h-5" /></button>
              <img src={viewPhotoUrl} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // === COMPLETED PENDING REVIEW ===
  if (payment.mission_completion_status === 'completed_pending_review') {
    return (
      <div className="space-y-3">
        <div className="border-2 rounded-xl p-4 bg-yellow-50 border-yellow-300 text-yellow-900">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">En attente de validation</div>
              <div className="text-sm">
                La mission a été déclarée terminée. Le client a 48h pour signaler un dommage.
                Votre garantie de {guaranteeAmount.toLocaleString('fr-FR')}€ sera libérée après vérification.
              </div>
            </div>
          </div>
        </div>

        {moverPhotos.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Vos photos ({moverPhotos.length}) :</p>
            <div className="grid grid-cols-4 gap-2">
              {moverPhotos.map((photo) => (
                <div key={photo.id} className="rounded-lg overflow-hidden border border-gray-200 cursor-pointer" onClick={() => setViewPhotoUrl(getPhotoUrl(photo.storage_path))}>
                  <img src={getPhotoUrl(photo.storage_path)} alt="" className="w-full h-16 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-sm ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-gray-600">Upload...</span></>
          ) : (
            <><Upload className="w-4 h-4 text-blue-600" /><span className="text-blue-700 font-medium">Ajouter des photos</span></>
          )}
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg" multiple onChange={handleFileUpload} disabled={uploading} />
        </label>

        {viewPhotoUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setViewPhotoUrl(null)}>
            <div className="relative">
              <button onClick={() => setViewPhotoUrl(null)} className="absolute top-2 right-2 bg-white text-gray-900 p-2 rounded-full z-10"><X className="w-5 h-5" /></button>
              <img src={viewPhotoUrl} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // === APPROVED STATE ===
  if (payment.mission_completion_status === 'approved' || payment.guarantee_status === 'released_to_mover') {
    return (
      <div className="border-2 rounded-xl p-4 bg-emerald-50 border-emerald-300">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-emerald-900">Mission terminée ✅</div>
            <div className="text-sm text-emerald-700">La garantie a été traitée par l'administrateur.</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Votre prix total</span>
            <span className="font-semibold">{moverPrice.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Reçu du client</span>
            <span className="font-medium text-green-700">+{directPayment.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Garantie libérée ✅</span>
            <span className="font-medium text-green-700">+{guaranteeAmount.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span className="text-slate-900">Total reçu</span>
            <span className="text-emerald-700">{moverPrice.toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      </div>
    );
  }

  // === IN PROGRESS STATE ===
  return (
    <div className="space-y-3">
      <div className="border-2 rounded-xl p-4 bg-blue-50 border-blue-200 text-blue-900">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Mission en cours</div>
            <div className="text-sm">
              Une fois la livraison terminée et le solde de {directPayment.toLocaleString('fr-FR')}€ reçu du client, confirmez la fin de mission.
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowPaymentInfo(!showPaymentInfo)}
        className="w-full px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-2 text-sm border border-slate-200"
      >
        <Info className="w-4 h-4" />
        Comment ça marche ?
      </button>

      {showPaymentInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">Processus de fin de mission</h4>
          <ol className="space-y-2 text-blue-800">
            <li className="flex gap-2"><span className="font-bold">1.</span><span>Le client vous remet le solde de <strong>{directPayment.toLocaleString('fr-FR')} €</strong> à la livraison</span></li>
            <li className="flex gap-2"><span className="font-bold">2.</span><span>Vous confirmez la fin de mission</span></li>
            <li className="flex gap-2"><span className="font-bold">3.</span><span>Uploadez des <strong>photos de l'état des meubles</strong> après livraison</span></li>
            <li className="flex gap-2"><span className="font-bold">4.</span><span>Le client a <strong>48h</strong> pour signaler un dommage</span></li>
            <li className="flex gap-2"><span className="font-bold">5.</span><span>L'admin vérifie et vous verse la garantie de <strong>{guaranteeAmount.toLocaleString('fr-FR')} €</strong></span></li>
          </ol>
        </div>
      )}

      <button
        onClick={handleConfirmMission}
        disabled={processing}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Traitement en cours...</>
        ) : (
          <><CheckCircle className="w-5 h-5" />Fin de mission — Livraison terminée</>
        )}
      </button>
    </div>
  );
}
