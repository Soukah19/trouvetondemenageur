import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, Eye, X, AlertTriangle, CheckCircle, Loader2, ArrowLeft, Image as ImageIcon, Clock, FileWarning } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClientLayout } from '../components/ClientLayout';
import { showToast } from '../utils/toast';

interface MovingPhoto {
  id: string;
  storage_path: string;
  photo_type: 'before' | 'loading' | 'after' | 'damage';
  uploaded_by: string;
  created_at: string;
  metadata: any;
}

export default function ClientPhotosPage() {
  const { quoteRequestId } = useParams<{ quoteRequestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [initialPhotos, setInitialPhotos] = useState<string[]>([]);
  const [clientPhotos, setClientPhotos] = useState<MovingPhoto[]>([]);
  const [moverPhotos, setMoverPhotos] = useState<MovingPhoto[]>([]);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
  const [missionInfo, setMissionInfo] = useState<any>(null);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    if (quoteRequestId && user) {
      fetchData();
    }
  }, [quoteRequestId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch mission info
      const { data: requestData, error: requestError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteRequestId)
        .single();

      if (requestError) throw requestError;
      setMissionInfo(requestData);
      
      // Check if mission is completed via quote_requests status OR payment mission_completion_status
      let isMissionDone = requestData.status === 'completed';
      
      if (!isMissionDone) {
        // Also check payments table for mission completion
        const { data: paymentData } = await supabase
          .from('payments')
          .select('mission_completion_status')
          .eq('quote_request_id', quoteRequestId)
          .maybeSingle();
        
        if (paymentData && ['completed_pending_review', 'approved', 'rejected'].includes(paymentData.mission_completion_status)) {
          isMissionDone = true;
        }
      }
      
      setMissionCompleted(isMissionDone);

      // Load initial furniture photos from quote request
      if (requestData.furniture_photos && Array.isArray(requestData.furniture_photos)) {
        setInitialPhotos(requestData.furniture_photos);
      } else {
        setInitialPhotos([]);
      }

      // Fetch photos from moving_photos table
      const { data: photosData, error: photosError } = await supabase
        .from('moving_photos')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('created_at', { ascending: true });

      if (photosError) throw photosError;

      // Separate client and mover photos
      const clientUploaded = photosData?.filter(p => p.uploaded_by === user?.id) || [];
      const moverUploaded = photosData?.filter(p => p.uploaded_by !== user?.id) || [];

      setClientPhotos(clientUploaded);
      setMoverPhotos(moverUploaded);

      // Check if damage report already exists
      const { data: reportData } = await supabase
        .from('damage_reports')
        .select('id')
        .eq('quote_request_id', quoteRequestId)
        .eq('reported_by', user?.id)
        .maybeSingle();

      if (reportData) {
        setReportSubmitted(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (storagePath: string): string => {
    const { data } = supabase.storage
      .from('moving-photos')
      .getPublicUrl(storagePath);
    return data?.publicUrl || '';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, photoType: 'after' | 'damage') => {
    const files = event.target.files;
    if (!files || files.length === 0 || !quoteRequestId) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${quoteRequestId}/client_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('moving-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create photo record (no AI analysis on client side)
        const { error: photoError } = await supabase
          .from('moving_photos')
          .insert({
            quote_request_id: quoteRequestId,
            uploaded_by: user?.id,
            photo_type: photoType,
            storage_path: fileName,
            metadata: {
              uploaded_at: new Date().toISOString(),
              file_size: file.size,
              file_type: file.type,
              uploaded_by_type: 'client'
            }
          });

        if (photoError) throw photoError;
      }

      showToast('Photos uploadées avec succès', 'success');
      await fetchData();
      
      // After uploading damage photos, show the report form
      if (photoType === 'damage') {
        setShowDamageReport(true);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      showToast('Erreur lors de l\'upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const submitDamageReport = async () => {
    if (!damageDescription.trim() || !quoteRequestId) return;

    try {
      // Get all client damage photo IDs for this request
      const damagePhotoIds = clientPhotos
        .filter(p => p.photo_type === 'damage')
        .map(p => p.id);

      const { error } = await supabase
        .from('damage_reports')
        .insert({
          quote_request_id: quoteRequestId,
          reported_by: user?.id,
          description: damageDescription.trim(),
          status: 'pending',
          responsibility: 'under_review',
          ai_analysis: { 
            status: 'pending_admin_review',
            client_description: damageDescription.trim(),
            photo_count: damagePhotoIds.length,
            submitted_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      showToast('Rapport de dommage envoyé avec succès. L\'administrateur va analyser vos photos.', 'success');
      setReportSubmitted(true);
      setShowDamageReport(false);
      setDamageDescription('');
    } catch (error) {
      console.error('Error submitting damage report:', error);
      showToast('Erreur lors de l\'envoi du rapport', 'error');
    }
  };

  const noReportNeeded = async () => {
    try {
      // Update payment guarantee status to release to mover
      if (quoteRequestId) {
        const { error } = await supabase
          .from('payments')
          .update({
            guarantee_status: 'released_to_mover',
            guarantee_released_amount: 0, // Will be set by actual amount in DB
            guarantee_decision_at: new Date().toISOString(),
            guarantee_notes: 'Client a confirmé : aucun dommage constaté'
          })
          .eq('quote_request_id', quoteRequestId);

        if (error) {
          console.warn('Could not update guarantee status:', error);
        }
      }
      showToast('Merci ! Aucun dommage à signaler. La garantie sera restituée au déménageur.', 'success');
      navigate('/client/dashboard');
    } catch (error) {
      console.error('Error updating guarantee:', error);
      showToast('Merci ! Aucun dommage à signaler.', 'success');
      navigate('/client/dashboard');
    }
  };

  if (loading) {
    return (
      <ClientLayout title="Photos du déménagement">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout 
      title="Photos du déménagement"
      subtitle={missionInfo ? `${missionInfo.from_city} → ${missionInfo.to_city}` : ''}
    >
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* SECTION 1: Initial Client Photos (from quote request creation) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Photos initiales du client</h2>
              <p className="text-sm text-gray-500">Photos uploadées lors de la création de la demande de devis</p>
            </div>
            {initialPhotos.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {initialPhotos.length} photo{initialPhotos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {initialPhotos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune photo initiale uploadée par le client</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {initialPhotos.map((photoUrl, idx) => (
                <div key={`initial-${idx}`} className="relative group">
                  <div className="relative rounded-lg overflow-hidden border-2 border-purple-200">
                    <img
                      src={photoUrl}
                      alt={`Photo initiale ${idx + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                      Avant
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setViewPhotoUrl(photoUrl)}
                        className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Mover Photos (during/after mission) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Photos du déménageur</h2>
              <p className="text-sm text-gray-500">Photos prises par le déménageur pendant la mission</p>
            </div>
            {moverPhotos.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {moverPhotos.length} photo{moverPhotos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {moverPhotos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune photo uploadée par le déménageur</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {moverPhotos.map((photo) => {
                const photoUrl = getPhotoUrl(photo.storage_path);
                const hasDamage = photo.metadata?.ai_analysis?.has_damage;

                return (
                  <div key={photo.id} className="relative group">
                    <div className={`relative rounded-lg overflow-hidden border-2 ${
                      hasDamage ? 'border-red-500' : 'border-blue-200'
                    }`}>
                      <img
                        src={photoUrl}
                        alt="Photo déménagement"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                        Déménageur
                      </div>
                      {hasDamage && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Dommage
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setViewPhotoUrl(photoUrl)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Client Damage Report Photos + Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <FileWarning className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Photos de constat / rapport de dommage</h2>
              <p className="text-sm text-gray-500">
                {missionCompleted 
                  ? 'Uploadez des photos si vous constatez des dommages après le déménagement'
                  : 'Cette section sera disponible une fois la mission terminée'
                }
              </p>
            </div>
            {clientPhotos.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                {clientPhotos.length} photo{clientPhotos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Show existing client-uploaded damage/after photos */}
          {clientPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {clientPhotos.map((photo) => {
                const photoUrl = getPhotoUrl(photo.storage_path);
                const hasDamage = photo.metadata?.ai_analysis?.has_damage;

                return (
                  <div key={photo.id} className="relative group">
                    <div className={`relative rounded-lg overflow-hidden border-2 ${
                      hasDamage ? 'border-red-500' : 'border-orange-200'
                    }`}>
                      <img
                        src={photoUrl}
                        alt="Photo de constat"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                        Constat
                      </div>
                      {hasDamage && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Dommage
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setViewPhotoUrl(photoUrl)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload & Report Controls */}
          {missionCompleted && !reportSubmitted && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-4">
              <p className="text-gray-600 mb-4 text-sm">
                Votre déménagement est terminé. Si vous constatez des dommages sur vos affaires, 
                uploadez des photos et décrivez les dégâts. L'administrateur analysera votre rapport.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <label className="flex-1">
                  <div className={`
                    flex items-center justify-center gap-2 px-6 py-4 
                    bg-orange-600 text-white rounded-xl cursor-pointer
                    hover:bg-orange-700 transition font-semibold
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Uploader des photos de dommages
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={(e) => handleFileSelect(e, 'damage')}
                    disabled={uploading}
                  />
                </label>

                <button
                  onClick={noReportNeeded}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aucun dommage à signaler
                </button>
              </div>

              {/* Damage description form (shown after uploading damage photos) */}
              {showDamageReport && clientPhotos.filter(p => p.photo_type === 'damage').length > 0 && (
                <div className="bg-white rounded-lg border border-orange-300 p-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Décrivez les dommages constatés</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Décrivez précisément les dégâts constatés sur vos meubles ou objets. 
                    L'administrateur examinera vos photos et votre description.
                  </p>
                  <textarea
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Ex: Table rayée sur le côté droit, carton de vaisselle avec plusieurs assiettes cassées..."
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => {
                        setShowDamageReport(false);
                        setDamageDescription('');
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={submitDamageReport}
                      disabled={!damageDescription.trim()}
                      className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Envoyer le rapport de dommage
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!missionCompleted && clientPhotos.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">La mission n'est pas encore terminée</p>
              <p className="text-gray-400 text-sm mt-1">Vous pourrez uploader des photos de constat après la fin du déménagement</p>
            </div>
          )}
        </div>

        {/* Report Already Submitted */}
        {reportSubmitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Rapport envoyé</h3>
                <p className="text-green-700 text-sm">Votre rapport de dommage a été transmis et sera examiné.</p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Viewer Modal */}
        {viewPhotoUrl && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setViewPhotoUrl(null)}
          >
            <div className="relative max-w-5xl max-h-screen">
              <button
                onClick={() => setViewPhotoUrl(null)}
                className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={viewPhotoUrl}
                alt="Photo agrandie"
                className="max-w-full max-h-screen object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
