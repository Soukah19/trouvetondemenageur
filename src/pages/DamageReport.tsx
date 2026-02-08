import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Photo {
  id: string;
  storage_path: string;
  photo_type: string;
  created_at: string;
}

export default function DamageReport() {
  const navigate = useNavigate();
  const { quoteRequestId } = useParams<{ quoteRequestId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<Photo[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<Photo[]>([]);
  const [selectedBeforePhoto, setSelectedBeforePhoto] = useState<string>('');
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState<string>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (quoteRequestId) {
      fetchPhotos();
    }
  }, [quoteRequestId]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('moving_photos')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setBeforePhotos(data.filter(p => p.photo_type === 'before_departure'));
        setAfterPhotos(data.filter(p => p.photo_type === 'unloading'));
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('moving-photos')
      .getPublicUrl(storagePath);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Veuillez décrire le dommage constaté');
      return;
    }

    if (!selectedBeforePhoto || !selectedAfterPhoto) {
      alert('Veuillez sélectionner une photo avant et une photo après');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('damage_reports')
        .insert({
          quote_request_id: quoteRequestId,
          reported_by: user?.id,
          before_photo_id: selectedBeforePhoto,
          after_photo_id: selectedAfterPhoto,
          description: description,
          status: 'pending',
          responsibility: 'under_review'
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting damage report:', error);
      alert('Erreur lors de la soumission de la déclaration');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Déclaration envoyée
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Votre déclaration de sinistre a été transmise à notre équipe. Nous analyserons les photos et vous contacterons sous 48 heures.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Déclaration de sinistre
              </h1>
              <p className="text-gray-600">
                Comparez les photos avant/après pour identifier les dommages
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Photo avant le départ
              </h3>
              {beforePhotos.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Aucune photo disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {beforePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedBeforePhoto(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-4 transition ${
                        selectedBeforePhoto === photo.id
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt="Photo avant"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Photo après le déchargement
              </h3>
              {afterPhotos.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Aucune photo disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {afterPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedAfterPhoto(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-4 transition ${
                        selectedAfterPhoto === photo.id
                          ? 'border-orange-600 ring-2 ring-orange-200'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt="Photo après"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedBeforePhoto && selectedAfterPhoto && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comparaison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Avant</p>
                    <img
                      src={getPhotoUrl(beforePhotos.find(p => p.id === selectedBeforePhoto)?.storage_path || '')}
                      alt="Avant"
                      className="w-full rounded-lg border-2 border-blue-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Après</p>
                    <img
                      src={getPhotoUrl(afterPhotos.find(p => p.id === selectedAfterPhoto)?.storage_path || '')}
                      alt="Après"
                      className="w-full rounded-lg border-2 border-orange-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du dommage *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez précisément le dommage constaté (objet, nature du dommage, circonstances...)"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Analyse IA
              </h4>
              <p className="text-sm text-blue-800">
                Notre système d'intelligence artificielle analysera les photos pour déterminer la responsabilité du dommage. Un administrateur validera ensuite cette analyse.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBeforePhoto || !selectedAfterPhoto || !description.trim()}
              className="w-full bg-orange-600 text-white py-4 rounded-lg hover:bg-orange-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <span>Envoyer la déclaration</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
