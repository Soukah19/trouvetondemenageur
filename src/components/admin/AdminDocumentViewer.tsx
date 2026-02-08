import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, CheckCircle, AlertTriangle, XCircle, Download, Eye, Calendar, Loader2 } from 'lucide-react';
import { showToast } from '../../utils/toast';

interface Document {
  type: string;
  label: string;
  url: string | null;
  expirationDate: string | null;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
}

interface AdminDocumentViewerProps {
  moverId: string;
  onClose: () => void;
}

const AdminDocumentViewer: React.FC<AdminDocumentViewerProps> = ({ moverId, onClose }) => {
  const [mover, setMover] = useState<any>(null);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [verificationReport, setVerificationReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [runningVerification, setRunningVerification] = useState(false);

  useEffect(() => {
    loadMoverData();
  }, [moverId]);

  const loadMoverData = async () => {
    try {
      setLoading(true);

      const { data: moverData, error: moverError } = await supabase
        .from('movers')
        .select('*')
        .eq('id', moverId)
        .single();

      if (moverError) throw moverError;
      setMover(moverData);

      const { data: trucksData } = await supabase
        .from('trucks')
        .select('*')
        .eq('mover_id', moverId);

      setTrucks(trucksData || []);

      const { data: reportData } = await supabase
        .from('verification_reports')
        .select('*')
        .eq('mover_id', moverId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setVerificationReport(reportData);
    } catch (error: any) {
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveVerification = async () => {
    try {
      setRunningVerification(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Session expirée', 'error');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comprehensive-mover-verification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ moverId }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showToast('Vérification IA terminée', 'success');
        setVerificationReport(result.report);
        await loadMoverData();
      } else {
        showToast('Erreur lors de la vérification IA', 'error');
      }
    } catch (error: any) {
      showToast('Erreur lors de la vérification', 'error');
    } finally {
      setRunningVerification(false);
    }
  };

  const getDocumentStatus = (url: string | null, expirationDate: string | null): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (!url) return 'missing';
    if (!expirationDate) return 'valid';

    const daysUntilExpiration = Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration < 30) return 'expiring';
    return 'valid';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'expiring':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      valid: 'bg-green-100 text-green-800',
      expiring: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      missing: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      valid: 'Valide',
      expiring: 'Expire bientôt',
      expired: 'Expiré',
      missing: 'Manquant',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const viewDocument = async (url: string) => {
    if (!url) return;

    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        setViewingDocument(url);
        return;
      }

      const buckets = ['identity-documents', 'truck-documents', 'moving-photos'];
      for (const bucket of buckets) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(url, 3600);
        if (!error && data?.signedUrl) {
          setViewingDocument(data.signedUrl);
          return;
        }
      }
      showToast('Document introuvable dans le stockage', 'error');
    } catch (error) {
      console.error('Error creating signed URL:', error);
      showToast('Erreur lors de l\'ouverture du document', 'error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!mover) return null;

  const documents: Document[] = [
    {
      type: 'kbis',
      label: 'KBIS',
      url: mover.kbis_document_url,
      expirationDate: mover.kbis_expiration_date,
      status: getDocumentStatus(mover.kbis_document_url, mover.kbis_expiration_date),
    },
    {
      type: 'insurance',
      label: 'Assurance RC PRO',
      url: mover.insurance_document_url,
      expirationDate: mover.insurance_expiration_date,
      status: getDocumentStatus(mover.insurance_document_url, mover.insurance_expiration_date),
    },
    {
      type: 'identity',
      label: 'Pièce d\'identité',
      url: mover.identity_document_url,
      expirationDate: mover.identity_expiration_date,
      status: getDocumentStatus(mover.identity_document_url, mover.identity_expiration_date),
    },
    {
      type: 'transport_license',
      label: 'Licence de transport',
      url: mover.transport_license_url,
      expirationDate: mover.transport_license_expiration_date,
      status: getDocumentStatus(mover.transport_license_url, mover.transport_license_expiration_date),
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{mover.company_name}</h2>
              <p className="text-sm text-gray-600">{mover.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {verificationReport && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">Dernier rapport IA</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    verificationReport.status === 'verified' ? 'bg-green-100 text-green-800' :
                    verificationReport.status === 'needs_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {verificationReport.score}/100
                  </span>
                </div>

                {verificationReport.report_data?.alerts?.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {verificationReport.report_data.alerts.map((alert: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <button
                onClick={runComprehensiveVerification}
                disabled={runningVerification}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {runningVerification ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Lancer la vérification IA
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.type} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.label}</h4>
                        {doc.expirationDate && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Expire le {new Date(doc.expirationDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  {doc.url ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDocument(doc.url!)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>
                      <a
                        href={doc.url}
                        download
                        className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 flex items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Document non fourni</p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Véhicules ({trucks.length})</h3>
              <div className="space-y-3">
                {trucks.map((truck) => (
                  <div key={truck.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{truck.license_plate}</h4>
                        <p className="text-sm text-gray-600">{truck.truck_type} - {truck.volume_m3}m³</p>
                      </div>
                      {truck.registration_document_url && (
                        <button
                          onClick={() => viewDocument(truck.registration_document_url)}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Carte grise
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations saisies</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Nom du gérant</p>
                  <p className="font-medium">{mover.manager_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-gray-600">SIRET</p>
                  <p className="font-medium">{mover.siret || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Adresse</p>
                  <p className="font-medium">{mover.address || 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Téléphone</p>
                  <p className="font-medium">{mover.phone || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Aperçu du document</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={viewingDocument}
                alt="Document"
                className="max-w-full h-auto mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDocumentViewer;
