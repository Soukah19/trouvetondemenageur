import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Camera, Package, Truck, Home as HomeIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PhotoUpload from '../components/PhotoUpload';
import PhotoGallery from '../components/PhotoGallery';

interface MovingStatus {
  id: string;
  status: string;
  started_at: string | null;
  loaded_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
}

interface QuoteRequest {
  id: string;
  from_city: string;
  to_city: string;
  moving_date: string;
  payment_status: string;
  accepted_quote_id: string | null;
}

const statusSteps = [
  { key: 'confirmed', label: 'Confirmé', icon: CheckCircle },
  { key: 'before_photos_uploaded', label: 'Photos avant départ', icon: Camera },
  { key: 'in_transit', label: 'En transit', icon: Truck },
  { key: 'loading_photos_uploaded', label: 'Photos chargement', icon: Package },
  { key: 'arrived', label: 'Arrivé', icon: HomeIcon },
  { key: 'unloading_photos_uploaded', label: 'Photos déchargement', icon: Camera },
  { key: 'completed', label: 'Terminé', icon: CheckCircle }
];

export default function MovingTracking() {
  const navigate = useNavigate();
  const { quoteRequestId } = useParams<{ quoteRequestId: string }>();
  const { user } = useAuth();
  const [movingStatus, setMovingStatus] = useState<MovingStatus | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'mover' | null>(null);

  useEffect(() => {
    if (quoteRequestId) {
      fetchData();
    }
  }, [quoteRequestId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: qrData, error: qrError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteRequestId)
        .single();

      if (qrError) throw qrError;
      setQuoteRequest(qrData);

      if (qrData.client_user_id === user?.id) {
        setUserRole('client');
      } else {
        const { data: moverData } = await supabase
          .from('movers')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (moverData) {
          setUserRole('mover');
        }
      }

      const { data: statusData, error: statusError } = await supabase
        .from('moving_status')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .maybeSingle();

      if (statusError) throw statusError;

      if (statusData) {
        setMovingStatus(statusData);
      } else if (qrData.payment_status === 'deposit_paid' || qrData.payment_status === 'fully_paid') {
        const { data: newStatus } = await supabase
          .from('moving_status')
          .insert({
            quote_request_id: quoteRequestId,
            status: 'confirmed'
          })
          .select()
          .single();

        if (newStatus) {
          setMovingStatus(newStatus);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'in_transit') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'loading_photos_uploaded') {
        updateData.loaded_at = new Date().toISOString();
      } else if (newStatus === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('moving_status')
        .update(updateData)
        .eq('quote_request_id', quoteRequestId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const getStepStatus = (stepKey: string): 'completed' | 'current' | 'pending' => {
    if (!movingStatus) return 'pending';

    const currentIndex = statusSteps.findIndex(s => s.key === movingStatus.status);
    const stepIndex = statusSteps.findIndex(s => s.key === stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const canUploadBeforePhotos = userRole === 'client' && movingStatus?.status === 'confirmed';
  const canUploadLoadingPhotos = userRole === 'mover' && movingStatus?.status === 'in_transit';
  const canUploadUnloadingPhotos = userRole === 'client' && movingStatus?.status === 'arrived';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!quoteRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Demande de devis introuvable</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Check if payment is done
  if (quoteRequest.payment_status !== 'deposit_paid' && quoteRequest.payment_status !== 'fully_paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Paiement requis</h2>
          <p className="text-gray-600 mb-4">
            Le suivi de votre déménagement sera disponible après le paiement de l'acompte.
          </p>
          {quoteRequest.accepted_quote_id && (
            <button
              onClick={() => navigate(`/client/payment/${quoteRequest.accepted_quote_id}`)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
            >
              Effectuer le paiement
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="mt-4 block mx-auto text-blue-600 hover:underline"
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

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Suivi de votre déménagement
          </h1>
          <p className="text-gray-600 mb-6">
            {quoteRequest.from_city} → {quoteRequest.to_city} • {new Date(quoteRequest.moving_date).toLocaleDateString('fr-FR')}
          </p>

          <div className="relative">
            {statusSteps.map((step, index) => {
              const status = getStepStatus(step.key);
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center mb-8 last:mb-0">
                  {index > 0 && (
                    <div
                      className={`absolute left-6 h-8 w-0.5 -mt-8 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}

                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="ml-4 flex-1">
                    <h3
                      className={`font-semibold ${
                        status === 'current' ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {step.label}
                    </h3>
                    {status === 'completed' && (
                      <p className="text-sm text-gray-500">Terminé</p>
                    )}
                    {status === 'current' && (
                      <p className="text-sm text-blue-600 font-medium">En cours</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {canUploadBeforePhotos && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Photos avant le départ
              </h2>
              <p className="text-gray-600">
                Prenez des photos de vos biens et de votre logement avant le départ. Ces photos serviront de référence en cas de litige.
              </p>
            </div>

            <PhotoUpload
              quoteRequestId={quoteRequestId}
              photoType="before_departure"
            />

            <button
              onClick={() => updateStatus('before_photos_uploaded')}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Confirmer et passer à l'étape suivante
            </button>
          </div>
        )}

        {userRole === 'mover' && movingStatus?.status === 'before_photos_uploaded' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <button
              onClick={() => updateStatus('in_transit')}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Démarrer le déménagement
            </button>
          </div>
        )}

        {canUploadLoadingPhotos && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Photos au chargement
              </h2>
              <p className="text-gray-600">
                Prenez des photos lors du chargement des biens dans le camion.
              </p>
            </div>

            <PhotoUpload
              quoteRequestId={quoteRequestId}
              photoType="loading"
            />

            <button
              onClick={() => updateStatus('loading_photos_uploaded')}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Confirmer le chargement
            </button>
          </div>
        )}

        {userRole === 'mover' && movingStatus?.status === 'loading_photos_uploaded' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <button
              onClick={() => updateStatus('arrived')}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Confirmer l'arrivée
            </button>
          </div>
        )}

        {canUploadUnloadingPhotos && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Photos au déchargement
              </h2>
              <p className="text-gray-600">
                Prenez des photos de vos biens une fois déchargés. Vérifiez que tout est en bon état.
              </p>
            </div>

            <PhotoUpload
              quoteRequestId={quoteRequestId}
              photoType="unloading"
            />

            <button
              onClick={() => updateStatus('unloading_photos_uploaded')}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Confirmer le déchargement
            </button>
          </div>
        )}

        {userRole === 'client' && movingStatus?.status === 'unloading_photos_uploaded' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Finaliser le déménagement
              </h2>
              <p className="text-gray-600 mb-4">
                Avez-vous constaté des dommages sur vos biens ?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => alert('Vous serez redirigé vers la page de déclaration de sinistre')}
                className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition font-semibold"
              >
                Déclarer un sinistre
              </button>

              <button
                onClick={() => updateStatus('completed')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Tout est en ordre, terminer
              </button>
            </div>
          </div>
        )}

        {movingStatus && movingStatus.status !== 'confirmed' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Toutes les photos
            </h2>
            <PhotoGallery quoteRequestId={quoteRequestId} />
          </div>
        )}
      </div>
    </div>
  );
}
