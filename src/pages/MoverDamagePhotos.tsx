import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, CheckCircle, Upload, Loader2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { MoverLayout } from '../components/MoverLayout';

interface Moving {
  id: string;
  quote_request_id: string;
  from_city: string;
  to_city: string;
  moving_date: string;
  client_name: string;
  status: string;
}

interface DamagePhoto {
  id: string;
  storage_path: string;
  photo_type: string;
  created_at: string;
  metadata: any;
  ai_analysis?: {
    has_damage: boolean;
    confidence: number;
    damage_description: string;
  };
}

interface DamageReport {
  id: string;
  description: string;
  status: string;
  responsibility: string;
  created_at: string;
  ai_analysis: any;
}

export default function MoverDamagePhotos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movings, setMovings] = useState<Moving[]>([]);
  const [selectedMoving, setSelectedMoving] = useState<Moving | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photos, setPhotos] = useState<DamagePhoto[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [selectedPhotoForReport, setSelectedPhotoForReport] = useState<string | null>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMovings();
  }, [user]);

  useEffect(() => {
    if (selectedMoving) {
      fetchPhotosAndReports();
    }
  }, [selectedMoving]);

  const fetchMovings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: moverData } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!moverData) {
        setLoading(false);
        return;
      }

      const { data: quotesData } = await supabase
        .from('quotes')
        .select('quote_request_id')
        .eq('mover_id', moverData.id)
        .eq('status', 'accepted');

      if (!quotesData || quotesData.length === 0) {
        setMovings([]);
        setLoading(false);
        return;
      }

      const quoteRequestIds = quotesData.map(q => q.quote_request_id);

      const { data: quoteRequestsData } = await supabase
        .from('quote_requests_with_privacy')
        .select(`
          id,
          from_city,
          to_city,
          moving_date,
          client_name,
          is_data_masked
        `)
        .in('id', quoteRequestIds)
        .eq('status', 'accepted')
        .order('moving_date', { ascending: false })
        .limit(20);

      if (!quoteRequestsData) {
        setMovings([]);
        setLoading(false);
        return;
      }

      const quoteRequestIdsForStatus = quoteRequestsData.map(qr => qr.id);

      const { data: statusData } = await supabase
        .from('moving_status')
        .select('*')
        .in('quote_request_id', quoteRequestIdsForStatus);

      const movingsWithStatus = quoteRequestsData.map(qr => {
        const status = statusData?.find(s => s.quote_request_id === qr.id);

        return {
          id: qr.id,
          quote_request_id: qr.id,
          from_city: qr.from_city,
          to_city: qr.to_city,
          moving_date: qr.moving_date,
          client_name: qr.client_name,
          status: status?.status || 'confirmed',
        };
      });

      setMovings(movingsWithStatus);
    } catch (error) {
      console.error('Error fetching movings:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotosAndReports = async () => {
    if (!selectedMoving) return;

    try {
      const { data: photosData, error: photosError } = await supabase
        .from('moving_photos')
        .select('*')
        .eq('quote_request_id', selectedMoving.quote_request_id)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;
      setPhotos(photosData || []);

      const { data: reportsData, error: reportsError } = await supabase
        .from('damage_reports')
        .select('*')
        .eq('quote_request_id', selectedMoving.quote_request_id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setDamageReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching photos and reports:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedMoving) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedMoving.quote_request_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('moving-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: photoData, error: photoError } = await supabase
          .from('moving_photos')
          .insert({
            quote_request_id: selectedMoving.quote_request_id,
            uploaded_by: user?.id,
            photo_type: 'loading',
            storage_path: fileName,
            metadata: {
              uploaded_at: new Date().toISOString(),
              file_size: file.size,
              file_type: file.type
            }
          })
          .select()
          .single();

        if (photoError) throw photoError;

        if (photoData) {
          await analyzePhotoForDamage(photoData.id, fileName);
        }
      }

      showToast('Photos uploadées avec succès', 'success');
      await fetchPhotosAndReports();
    } catch (error) {
      console.error('Error uploading photos:', error);
      showToast('Erreur lors de l\'upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const analyzePhotoForDamage = async (photoId: string, storagePath: string) => {
    setAnalyzing(true);

    try {
      const { data: { publicUrl } } = supabase.storage
        .from('moving-photos')
        .getPublicUrl(storagePath);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-damage-photo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photo_id: photoId,
            photo_url: publicUrl
          })
        }
      );

      if (!response.ok) {
        console.error('AI analysis failed:', await response.text());
        return;
      }

      const result = await response.json();

      if (result.has_damage) {
        showToast(
          `Dommage détecté ! Confiance: ${Math.round(result.confidence * 100)}%`,
          'error'
        );

        await notifyClientOfDamage(photoId, result);
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const notifyClientOfDamage = async (photoId: string, analysis: any) => {
    if (!selectedMoving) return;

    try {
      const { data: quoteRequest } = await supabase
        .from('quote_requests')
        .select('client_user_id')
        .eq('id', selectedMoving.quote_request_id)
        .single();

      if (!quoteRequest) return;

      await supabase.from('notifications').insert({
        user_id: quoteRequest.client_user_id,
        title: 'Dommage détecté avant chargement',
        message: `Le déménageur a trouvé un dommage : ${analysis.damage_description}. Photo disponible pour consultation.`,
        type: 'damage_alert',
        related_id: photoId,
        is_read: false
      });
    } catch (error) {
      console.error('Error notifying client:', error);
    }
  };

  const handleCreateDamageReport = async () => {
    if (!reportDescription.trim() || !selectedPhotoForReport || !selectedMoving) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('damage_reports')
        .insert({
          quote_request_id: selectedMoving.quote_request_id,
          reported_by: user?.id,
          before_photo_id: selectedPhotoForReport,
          description: reportDescription,
          status: 'pending',
          responsibility: 'under_review'
        });

      if (error) throw error;

      showToast('Rapport de dommage créé', 'success');
      setShowReportModal(false);
      setReportDescription('');
      setSelectedPhotoForReport(null);
      await fetchPhotosAndReports();
    } catch (error) {
      console.error('Error creating damage report:', error);
      showToast('Erreur lors de la création du rapport', 'error');
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('moving-photos')
      .getPublicUrl(storagePath);
    return publicUrl;
  };

  if (loading) {
    return (
      <MoverLayout activeSection="damage-photos" title="Photos et dommages">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </MoverLayout>
    );
  }

  if (!selectedMoving) {
    return (
      <MoverLayout activeSection="damage-photos" title="Photos et dommages">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez un déménagement</h2>
            <p className="text-gray-600 mb-6">
              Choisissez le déménagement pour lequel vous souhaitez gérer les photos et les dommages.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {movings.map((moving) => (
                <button
                  key={moving.id}
                  onClick={() => setSelectedMoving(moving)}
                  className="text-left bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-md hover:border-blue-400 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{moving.client_name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {moving.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {moving.from_city} → {moving.to_city}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(moving.moving_date).toLocaleDateString('fr-FR')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout activeSection="damage-photos" title="Photos et dommages">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMoving(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Changer de déménagement
            </button>
            <div className="h-5 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedMoving.client_name}</h1>
              <p className="text-xs text-gray-600">
                {selectedMoving.from_city} → {selectedMoving.to_city}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ajouter des photos</h2>
            {analyzing && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Analyse IA en cours...</span>
              </div>
            )}
          </div>

          <p className="text-gray-600 mb-4">
            Prenez des photos de chaque bien lors du <strong>chargement</strong> dans le camion. L'IA analysera automatiquement chaque photo pour détecter d'éventuels dommages préexistants.
          </p>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm text-gray-600">Upload en cours...</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB chacune)</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        {photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Photos uploadées ({photos.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => {
                const hasDamage = photo.metadata?.ai_analysis?.has_damage;
                const photoUrl = getPhotoUrl(photo.storage_path);

                return (
                  <div key={photo.id} className="relative group">
                    <div className={`relative rounded-lg overflow-hidden border-2 ${
                      hasDamage ? 'border-red-500' : 'border-gray-200'
                    }`}>
                      <img
                        src={photoUrl}
                        alt="Photo déménagement"
                        className="w-full h-48 object-cover"
                      />
                      {hasDamage && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Dommage détecté
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setViewPhotoUrl(photoUrl)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPhotoForReport(photo.id);
                            setShowReportModal(true);
                          }}
                          className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition"
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {new Date(photo.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {damageReports.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rapports de dommages ({damageReports.length})</h2>
            <div className="space-y-4">
              {damageReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.responsibility === 'mover' ? 'bg-red-100 text-red-800' :
                      report.responsibility === 'client' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.responsibility}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">{report.description}</p>
                  <p className="text-xs text-gray-500">
                    Créé le {new Date(report.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Déclarer un dommage</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportDescription('');
                  setSelectedPhotoForReport(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du dommage
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez le dommage constaté..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription('');
                    setSelectedPhotoForReport(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateDamageReport}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Créer le rapport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </MoverLayout>
  );
}
