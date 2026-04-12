import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, FileText, Calendar, Building, User, Phone, Mail, MapPin, Truck, Shield, Download, ExternalLink, Edit, Clock, Landmark } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import { MoverEditModal } from './MoverEditModal';

interface PendingMoverDetailModalProps {
  moverId: string;
  onClose: () => void;
  onStatusUpdate: () => void;
}

interface MoverDetails {
  id: string;
  user_id: string;
  company_name: string;
  siret: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  manager_firstname: string;
  manager_lastname: string;
  manager_phone: string;
  services: string[];
  coverage_area: string[];
  verification_status: string;
  vehicle_ownership?: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  account_holder_name?: string;
  bank_details_verified?: boolean;
  created_at: string;
}

interface MoverDocument {
  id: string;
  document_type: string;
  document_name?: string;
  document_url: string;
  verification_status: string;
  expiration_date?: string;
  verified_at?: string;
  uploaded_at?: string;
}

interface Truck {
  id: string;
  registration_number: string;
  capacity_m3: number;
  registration_card_url?: string;
}

interface AIVerificationResult {
  overallStatus: 'verified' | 'needs_review' | 'rejected';
  checks: Array<{
    type: string;
    passed: boolean;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    details?: any;
  }>;
  alerts: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
  }>;
  expirationWarnings: Array<{
    documentType: string;
    expirationDate: string;
    daysUntilExpiration: number;
  }>;
  score: number;
}

export function PendingMoverDetailModal({ moverId, onClose, onStatusUpdate }: PendingMoverDetailModalProps) {
  const [moverDetails, setMoverDetails] = useState<MoverDetails | null>(null);
  const [documents, setDocuments] = useState<MoverDocument[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [aiVerification, setAiVerification] = useState<AIVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadMoverDetails();
    runAIVerification();
  }, [moverId]);

  const loadMoverDetails = async () => {
    try {
      const { data: mover, error: moverError } = await supabase
        .from('movers')
        .select('*')
        .eq('id', moverId)
        .single();

      if (moverError) throw moverError;
      setMoverDetails(mover);

      // Query documents from BOTH tables (MoverSignupPage uses mover_documents, MoverProfileCompletionPage uses verification_documents)
      const [
        { data: moverDocsData, error: moverDocsError },
        { data: verificationDocsData, error: verDocsError }
      ] = await Promise.all([
        supabase
          .from('mover_documents')
          .select('*')
          .eq('mover_id', moverId),
        supabase
          .from('verification_documents')
          .select('*')
          .eq('mover_id', moverId),
      ]);

      // Merge documents from both tables and normalize document types
      const allDocs: MoverDocument[] = [];
      
      if (!moverDocsError && moverDocsData) {
        for (const doc of moverDocsData) {
          allDocs.push({
            id: doc.id,
            document_type: doc.document_type,
            document_name: doc.document_name,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
            uploaded_at: doc.uploaded_at,
          });
        }
      }
      
      if (!verDocsError && verificationDocsData) {
        for (const doc of verificationDocsData) {
          // Normalize verification_documents types to match what the UI expects
          let normalizedType = doc.document_type;
          if (normalizedType === 'id_card' || normalizedType === 'passport') {
            // Check filename to determine recto/verso
            const url = (doc.document_url || '').toLowerCase();
            if (url.includes('verso')) {
              normalizedType = 'identity_verso';
            } else {
              normalizedType = 'identity_recto';
            }
          }
          if (normalizedType === 'transport_license') {
            normalizedType = 'license';
          }
          allDocs.push({
            id: doc.id,
            document_type: normalizedType,
            document_name: doc.document_name || normalizedType,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
            expiration_date: doc.expiration_date,
            uploaded_at: doc.uploaded_at,
          });
        }
      }

      setDocuments(allDocs);

      const { data: trucksData, error: trucksError } = await supabase
        .from('trucks')
        .select('*')
        .eq('mover_id', moverId);

      if (!trucksError && trucksData) {
        setTrucks(trucksData);
      }
    } catch (error) {
      console.error('Error loading mover details:', error);
      showToast('Erreur lors du chargement des détails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runAIVerification = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-mover-verification', {
        body: { moverId }
      });

      if (error) throw error;
      setAiVerification(data);
    } catch (error) {
      console.error('Error running AI verification:', error);
    }
  };

  const [sendingContract, setSendingContract] = useState(false);

  const handleSendContract = async () => {
    if (!window.confirm(
      'Envoyer le contrat de partenariat via Dropbox Sign ?\n\n' +
      'Le déménageur recevra un email pour signer électroniquement le contrat.'
    )) return;

    setSendingContract(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropboxsign-create-signature`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ moverId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur lors de l\'envoi');

      showToast('📝 Contrat envoyé avec succès via Dropbox Sign !', 'success');
      onStatusUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error sending contract:', error);
      showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      setSendingContract(false);
    }
  };

  const handleApproveDirectly = async () => {
    if (!window.confirm('Approuver DIRECTEMENT sans contrat Dropbox Sign ?\n\nCette action active le compte immédiatement.')) {
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({
          verification_status: 'verified',
          is_active: true,
          last_verification_date: new Date().toISOString()
        })
        .eq('id', moverId);

      if (error) throw error;

      showToast('Déménageur approuvé avec succès', 'success');

      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userType: 'mover',
              userId: moverDetails?.user_id || '',
              companyName: moverDetails?.company_name || '',
              isValidation: true
            })
          }
        );
      } catch (emailError) {
        console.error('Erreur envoi email bienvenue:', emailError);
      }

      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error approving mover:', error);
      showToast('Erreur lors de l\'approbation', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Veuillez indiquer la raison du rejet', 'error');
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({
          verification_status: 'rejected',
          is_active: false
        })
        .eq('id', moverId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: moverDetails?.user_id,
        user_type: 'mover',
        type: 'system',
        title: 'Compte refusé',
        message: `Votre demande d'adhésion a été refusée. Raison: ${rejectionReason}`,
        data: { reason: rejectionReason }
      });

      showToast('Déménageur rejeté', 'success');
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error rejecting mover:', error);
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('ATTENTION : Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT ce déménageur ?\n\nCette action est IRRÉVERSIBLE et supprimera :\n- Le profil déménageur\n- Le compte utilisateur\n- Tous les documents\n- Toutes les données associées')) {
      return;
    }

    setProcessingAction(true);
    try {
      // Let the edge function handle all deletions (movers row + related data + auth user)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-auth-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: moverDetails?.user_id })
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du compte utilisateur');
      }

      showToast('Déménageur supprimé définitivement', 'success');
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting mover:', error);
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const getDocumentStatus = (expirationDate?: string, verificationStatus?: string) => {
    if (verificationStatus === 'pending') {
      return { status: 'pending', label: 'En cours d\'examen', color: 'text-yellow-600' };
    }

    if (!expirationDate) return { status: 'warning', label: 'Date non renseignée', color: 'text-yellow-600' };

    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntil = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: 'expired', label: 'EXPIRÉ', color: 'text-red-600' };
    } else if (daysUntil < 30) {
      return { status: 'expiring', label: `Expire dans ${daysUntil} jours`, color: 'text-orange-600' };
    } else {
      return { status: 'valid', label: `Valide jusqu'au ${new Date(expirationDate).toLocaleDateString()}`, color: 'text-green-600' };
    }
  };

  // Helper: get a signed URL by trying multiple buckets (no edge function needed)
  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const buckets = ['identity-documents', 'truck-documents', 'moving-photos'];
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    }
    return null;
  };

  const viewDocument = async (documentUrl: string) => {
    try {
      const signedUrl = await getSignedUrl(documentUrl);
      if (!signedUrl) {
        showToast('Document introuvable dans le stockage', 'error');
        return;
      }
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      showToast('Erreur lors de la visualisation', 'error');
    }
  };

  const downloadDocument = async (documentUrl: string, documentName?: string) => {
    try {
      const signedUrl = await getSignedUrl(documentUrl);
      if (!signedUrl) {
        showToast('Document introuvable dans le stockage', 'error');
        return;
      }

      // Fetch the file from the signed URL and trigger download
      const fileResponse = await fetch(signedUrl);
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName || documentUrl.split('/').pop() || 'document';
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Document téléchargé', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.document_type === type);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-700">Chargement des détails...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!moverDetails) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 rounded-t-2xl flex justify-between items-start">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">{moverDetails.company_name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span>SIRET: {moverDetails.siret}</span>
              <span>•</span>
              <span>Inscrit le {new Date(moverDetails.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition flex items-center gap-2"
              title="Modifier les documents"
            >
              <Edit className="w-5 h-5" />
              <span className="text-sm">Modifier</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* AI Alerts Section */}
          {aiVerification && (aiVerification.alerts.length > 0 || aiVerification.expirationWarnings.length > 0) && (
            <div className="mb-6 space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Alertes IA
              </h3>

              {aiVerification.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.severity === 'critical' ? (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{alert.type}</p>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}

              {aiVerification.expirationWarnings.map((warning, idx) => (
                <div key={idx} className="p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Document expiré ou proche de l'expiration</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {warning.documentType}: Expire le {new Date(warning.expirationDate).toLocaleDateString()}
                        {warning.daysUntilExpiration < 0 && ' (EXPIRÉ)'}
                        {warning.daysUntilExpiration >= 0 && ` (dans ${warning.daysUntilExpiration} jours)`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Verification Score */}
          {aiVerification && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Score de vérification IA</span>
                <span className={`text-2xl font-bold ${
                  aiVerification.score >= 80 ? 'text-green-600' :
                  aiVerification.score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {aiVerification.score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    aiVerification.score >= 80 ? 'bg-green-600' :
                    aiVerification.score >= 60 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${aiVerification.score}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Statut: <span className="font-semibold">
                  {aiVerification.overallStatus === 'verified' && 'Vérifié'}
                  {aiVerification.overallStatus === 'needs_review' && 'Nécessite une révision'}
                  {aiVerification.overallStatus === 'rejected' && 'Rejeté'}
                </span>
              </p>
            </div>
          )}

          {/* Company Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informations de l'entreprise
              </h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Nom de l'entreprise</span>
                  <p className="font-medium">{moverDetails.company_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">SIRET</span>
                  <p className="font-medium">{moverDetails.siret}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email</span>
                  <p className="font-medium">{moverDetails.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Téléphone</span>
                  <p className="font-medium">{moverDetails.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Adresse</span>
                  <p className="font-medium">
                    {moverDetails.address}<br />
                    {moverDetails.postal_code} {moverDetails.city}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Gérant
              </h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Nom</span>
                  <p className="font-medium">{moverDetails.manager_firstname} {moverDetails.manager_lastname}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Téléphone</span>
                  <p className="font-medium">{moverDetails.manager_phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details (RIB) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Coordonnées bancaires (RIB)
            </h3>
            {moverDetails.iban ? (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  {moverDetails.bank_details_verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Vérifié</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Non vérifié</span>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-600">IBAN</span>
                  <p className="font-medium font-mono text-sm">{moverDetails.iban}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">BIC / SWIFT</span>
                    <p className="font-medium font-mono text-sm">{moverDetails.bic || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Banque</span>
                    <p className="font-medium">{moverDetails.bank_name || '—'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Titulaire du compte</span>
                  <p className="font-medium">{moverDetails.account_holder_name || '—'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Aucune coordonnée bancaire renseignée. Le déménageur ne pourra pas recevoir le remboursement de la garantie.
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents ({documents.length})
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* KBIS */}
              {(() => {
                const kbisDoc = getDocumentsByType('kbis')[0];
                return (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">KBIS</p>
                        
                      </div>
                      {kbisDoc ? (
                        kbisDoc.verification_status === 'pending'
                          ? <Clock className="w-5 h-5 text-yellow-500" />
                          : <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {kbisDoc && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewDocument(kbisDoc.document_url)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visualiser
                        </button>
                        <button
                          onClick={() => downloadDocument(kbisDoc.document_url, kbisDoc.document_name)}
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Insurance */}
              {(() => {
                const insuranceDoc = getDocumentsByType('insurance')[0];
                return (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Assurance RC PRO</p>
                        
                      </div>
                      {insuranceDoc ? (
                        insuranceDoc.verification_status === 'pending'
                          ? <Clock className="w-5 h-5 text-yellow-500" />
                          : <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {insuranceDoc && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewDocument(insuranceDoc.document_url)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visualiser
                        </button>
                        <button
                          onClick={() => downloadDocument(insuranceDoc.document_url, insuranceDoc.document_name)}
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Transport License */}
              {(() => {
                const licenseDoc = getDocumentsByType('license')[0];
                return (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Licence de transport</p>
                        
                      </div>
                      {licenseDoc ? (
                        licenseDoc.verification_status === 'pending'
                          ? <Clock className="w-5 h-5 text-yellow-500" />
                          : <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {licenseDoc && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewDocument(licenseDoc.document_url)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visualiser
                        </button>
                        <button
                          onClick={() => downloadDocument(licenseDoc.document_url, licenseDoc.document_name)}
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Identity Documents */}
              {(() => {
                const identityRecto = getDocumentsByType('identity_recto')[0];
                const identityVerso = getDocumentsByType('identity_verso')[0];
                return (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Pièce d'identité</p>
                        
                      </div>
                      {identityRecto && identityVerso ? (
                        identityRecto.verification_status === 'pending' || identityVerso.verification_status === 'pending'
                          ? <Clock className="w-5 h-5 text-yellow-500" />
                          : <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-2">
                      {identityRecto && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => viewDocument(identityRecto.document_url)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visualiser Recto
                          </button>
                          <button
                            onClick={() => downloadDocument(identityRecto.document_url, identityRecto.document_name)}
                            className="text-sm text-green-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger Recto
                          </button>
                        </div>
                      )}
                      {identityVerso && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => viewDocument(identityVerso.document_url)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visualiser Verso
                          </button>
                          <button
                            onClick={() => downloadDocument(identityVerso.document_url, identityVerso.document_name)}
                            className="text-sm text-green-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger Verso
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Attestation URSSAF */}
              {(() => {
                const urssafDoc = getDocumentsByType('urssaf')[0];
                return (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Attestation URSSAF</p>
                        
                      </div>
                      {urssafDoc ? (
                        urssafDoc.verification_status === 'pending'
                          ? <Clock className="w-5 h-5 text-yellow-500" />
                          : <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {urssafDoc && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewDocument(urssafDoc.document_url)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visualiser
                        </button>
                        <button
                          onClick={() => downloadDocument(urssafDoc.document_url, urssafDoc.document_name)}
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* RIB / Relevé bancaire */}
              {(() => {
                const bankDoc = getDocumentsByType('bank_details')[0];
                return (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">RIB / Relevé bancaire</p>
                        
                      </div>
                      {bankDoc ? (
                        bankDoc.verification_status === 'pending'
                          ? <Clock className="w-5 h-5 text-yellow-500" />
                          : <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    {bankDoc ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewDocument(bankDoc.document_url)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visualiser
                        </button>
                        <button
                          onClick={() => downloadDocument(bankDoc.document_url, bankDoc.document_name)}
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Non fourni</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Véhicules ({trucks.length})
              {moverDetails?.vehicle_ownership === 'rents' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  🔑 Loue des véhicules
                </span>
              )}
            </h3>
            {trucks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {trucks.map((truck) => (
                  <div key={truck.id} className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-medium">{truck.registration_number}</p>
                    <p className="text-sm text-gray-600">Capacité: {truck.capacity_m3} m³</p>
                    {truck.registration_card_url && (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => viewDocument(truck.registration_card_url!)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Voir carte grise
                        </button>
                        <button
                          onClick={() => downloadDocument(truck.registration_card_url!, `carte_grise_${truck.registration_number}`)}
                          className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Aucun véhicule enregistré</p>
              </div>
            )}
          </div>

          {/* Services and Coverage */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Services proposés</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {(moverDetails.services && moverDetails.services.length > 0) ? (
                  <ul className="space-y-2">
                    {moverDetails.services.map((service, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {service}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Aucun service défini</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Zones de couverture</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {(moverDetails.coverage_area && moverDetails.coverage_area.length > 0) ? (
                  <ul className="space-y-2">
                    {moverDetails.coverage_area.map((area, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {area}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Aucune zone définie</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-between border-t pt-6">
            <button
              onClick={handleDelete}
              disabled={processingAction}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold disabled:opacity-50 flex items-center gap-2"
              title="Supprimer définitivement le compte"
            >
              <XCircle className="w-5 h-5" />
              Supprimer définitivement
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectionModal(true)}
                disabled={processingAction || sendingContract}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Rejeter
              </button>
              <button
                onClick={handleSendContract}
                disabled={processingAction || sendingContract}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                {sendingContract ? 'Envoi en cours...' : '📝 Envoyer le contrat Dropbox Sign'}
              </button>
              <button
                onClick={handleApproveDirectly}
                disabled={processingAction || sendingContract}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50 flex items-center gap-2"
                title="Approuver directement sans contrat (cas exceptionnel)"
              >
                <CheckCircle className="w-4 h-4" />
                Approuver sans contrat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Raison du rejet</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border rounded-lg p-3 min-h-[120px] mb-4"
              placeholder="Expliquez pourquoi vous rejetez ce déménageur..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  handleReject();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <MoverEditModal
          moverId={moverId}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => {
            loadMoverDetails();
            runAIVerification();
          }}
        />
      )}
    </div>
  );
}