import { useState, useEffect } from 'react';
import { X, Download, Edit2, Save, Truck, Mail, Phone, Calendar, MapPin, FileText, CheckCircle, Award, Package, Euro, Eye, Check, XCircle, AlertTriangle, RefreshCw, Upload, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface MoverDetailModalProps {
  moverId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface MoverInfo {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  siret: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  verification_status: string;
  is_active: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  created_at: string;
  description?: string;
  average_rating?: number;
  total_reviews?: number;
  total_missions?: number;
  total_revenue?: number;
}

interface ActivityZone {
  department: string;
  zone_name: string;
}

interface Truck {
  id: string;
  registration_number: string;
  capacity_m3: number;
  registration_card_url?: string;
  is_verified: boolean;
  brand?: string;
  model?: string;
}

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  signed_url?: string;
  verification_status: string;
  expiration_date?: string;
  uploaded_at: string;
}

interface GroupedDocument {
  document_type: string;
  documents: Document[];
  verification_status: string;
  latest_upload: string;
  expiration_date?: string;
}

export default function MoverDetailModal({ moverId, onClose, onUpdate }: MoverDetailModalProps) {
  const [moverInfo, setMoverInfo] = useState<MoverInfo | null>(null);
  const [activityZones, setActivityZones] = useState<ActivityZone[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [groupedDocuments, setGroupedDocuments] = useState<GroupedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingDocuments, setViewingDocuments] = useState<Document[] | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [newZone, setNewZone] = useState({ department: '', zone_name: '' });
  const [newTruck, setNewTruck] = useState({ brand: '', model: '', capacity: '', registration: '' });

  const [editedData, setEditedData] = useState({
    company_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    description: '',
  });

  useEffect(() => {
    loadMoverData();
  }, [moverId]);

  const getFullDocumentUrl = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    // Try multiple buckets using the Supabase client (no edge function / no CORS issues)
    const buckets = ['identity-documents', 'truck-documents', 'moving-photos'];
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(url, 3600);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    }
    console.error('Document introuvable dans aucun bucket:', url);
    return '';
  };

  const isImageFile = (url: string) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.endsWith(ext));
  };

  const isPdfFile = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf');
  };

  const loadMoverData = async () => {
    setLoading(true);
    try {
      const { data: mover } = await supabase
        .from('movers')
        .select('*')
        .eq('user_id', moverId)
        .single();

      if (!mover) {
        showToast('Déménageur introuvable', 'error');
        onClose();
        return;
      }

      const { data: userEmail } = await supabase.rpc('get_user_email', {
        user_id_param: moverId
      });

      const [
        { data: trucksData },
        { data: quotes },
        { data: reviews },
        { data: moverDocsData },
        { data: verificationDocsData },
      ] = await Promise.all([
        supabase
          .from('trucks')
          .select('*')
          .eq('mover_id', mover.id),
        supabase
          .from('quotes')
          .select('id, status, price')
          .eq('mover_id', mover.id),
        supabase
          .from('reviews')
          .select('rating')
          .eq('mover_id', mover.id),
        supabase
          .from('mover_documents')
          .select('*')
          .eq('mover_id', mover.id)
          .order('uploaded_at', { ascending: false }),
        supabase
          .from('verification_documents')
          .select('*')
          .eq('mover_id', mover.id)
          .order('uploaded_at', { ascending: false }),
      ]);

      // Merge documents from both tables
      const allDocuments: Document[] = [];
      if (moverDocsData) {
        for (const doc of moverDocsData) {
          allDocuments.push({
            id: doc.id,
            document_type: doc.document_type,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
            uploaded_at: doc.uploaded_at,
          });
        }
      }
      if (verificationDocsData) {
        for (const doc of verificationDocsData) {
          // Normalize verification_documents types
          let normalizedType = doc.document_type;
          if (normalizedType === 'id_card' || normalizedType === 'passport') {
            const url = (doc.document_url || '').toLowerCase();
            normalizedType = url.includes('verso') ? 'identity_verso' : 'identity_recto';
          }
          if (normalizedType === 'transport_license') normalizedType = 'license';
          allDocuments.push({
            id: doc.id,
            document_type: normalizedType,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
            expiration_date: doc.expiration_date,
            uploaded_at: doc.uploaded_at || doc.created_at,
          });
        }
      }
      const documents = allDocuments;

      // Extract activity zones from movers coverage_area field
      const zonesFromMover: ActivityZone[] = (mover.coverage_area || []).map((area: string) => ({
        department: area.substring(0, 2) || area,
        zone_name: area,
      }));

      const completedQuotes = quotes?.filter(q => q.status === 'accepted') || [];
      const totalRevenue = completedQuotes.reduce((sum, q) => sum + (q.price || 0), 0);
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      const moverData: MoverInfo = {
        ...mover,
        email: userEmail || '',
        average_rating: avgRating,
        total_reviews: reviews?.length || 0,
        total_missions: completedQuotes.length,
        total_revenue: totalRevenue,
      };

      setMoverInfo(moverData);
      setActivityZones(zonesFromMover);
      setTrucks(trucksData || []);

      // Créer les signed URLs pour tous les documents
      console.log('Nombre de documents trouvés:', documents?.length || 0);
      if (documents && documents.length > 0) {
        console.log('Documents à traiter:', documents.map(d => ({ type: d.document_type, url: d.document_url })));

        const documentsWithSignedUrls = await Promise.all(
          documents.map(async (doc: Document) => {
            console.log('Traitement document:', doc.document_type, doc.document_url);
            const signedUrl = await getFullDocumentUrl(doc.document_url);
            console.log('Signed URL obtenue:', signedUrl ? 'OUI' : 'NON');
            return { ...doc, signed_url: signedUrl };
          })
        );

        console.log('Documents avec signed URLs:', documentsWithSignedUrls.filter(d => d.signed_url).length);
        groupDocumentsByType(documentsWithSignedUrls);
      } else {
        console.log('Aucun document trouvé pour ce déménageur');
        groupDocumentsByType([]);
      }

      setEditedData({
        company_name: mover.company_name || '',
        phone: mover.phone || '',
        address: mover.address || '',
        city: mover.city || '',
        postal_code: mover.postal_code || '',
        description: mover.description || '',
      });
    } catch (error) {
      console.error('Error loading mover data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const groupDocumentsByType = (docs: Document[]) => {
    const grouped = docs.reduce((acc, doc) => {
      const existing = acc.find(g => g.document_type === doc.document_type);
      if (existing) {
        existing.documents.push(doc);
        if (new Date(doc.uploaded_at) > new Date(existing.latest_upload)) {
          existing.latest_upload = doc.uploaded_at;
          existing.verification_status = doc.verification_status;
          existing.expiration_date = doc.expiration_date;
        }
      } else {
        acc.push({
          document_type: doc.document_type,
          documents: [doc],
          verification_status: doc.verification_status,
          latest_upload: doc.uploaded_at,
          expiration_date: doc.expiration_date,
        });
      }
      return acc;
    }, [] as GroupedDocument[]);

    setGroupedDocuments(grouped);
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      kbis: 'KBIS',
      insurance: 'Assurance RC PRO',
      license: 'Licence de transport',
      identity_recto: 'Pièce d\'identité (Recto)',
      identity_verso: 'Pièce d\'identité (Verso)',
      id_card: 'Carte d\'identité',
      vehicle_registration: 'Carte grise',
      driver_license: 'Permis de conduire',
      technical_control: 'Contrôle technique',
      transport_license: 'Licence de transport',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const handleUpdateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      // Try to update in mover_documents first
      const { error: moverDocError, data: moverDocData } = await supabase
        .from('mover_documents')
        .update({ verification_status: newStatus })
        .eq('id', documentId)
        .select();

      // If not found in mover_documents or no rows updated, try verification_documents
      if (moverDocError || !moverDocData || moverDocData.length === 0) {
        const { error: verDocError } = await supabase
          .from('verification_documents')
          .update({ verification_status: newStatus })
          .eq('id', documentId);

        if (verDocError) {
          console.error('Error updating verification_documents:', verDocError);
          throw verDocError;
        }
      }

      showToast('Statut du document mis à jour', 'success');
      loadMoverData();
    } catch (error) {
      console.error('Error updating document status:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleAdminDocumentReplace = async (file: File, docId: string) => {
    try {
      const doc = groupedDocuments
        .flatMap(g => g.documents)
        .find(d => d.id === docId);

      if (!doc) {
        showToast('Document introuvable', 'error');
        return;
      }

      if (!moverInfo) {
        showToast('Déménageur introuvable', 'error');
        return;
      }

      const mimeMap: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' };
      const fileExt = mimeMap[file.type] || file.name.split('.').pop() || 'bin';
      const fileName = `${moverInfo.id}/${doc.document_type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Try to update in mover_documents first
      const { error: moverDocError, data: moverDocData } = await supabase
        .from('mover_documents')
        .update({
          document_url: fileName,
          verification_status: 'pending',
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', docId)
        .select();

      // If not found in mover_documents or no rows updated, try verification_documents
      if (moverDocError || !moverDocData || moverDocData.length === 0) {
        const { error: verDocError } = await supabase
          .from('verification_documents')
          .update({
            document_url: fileName,
            verification_status: 'pending',
            uploaded_at: new Date().toISOString(),
          })
          .eq('id', docId);

        if (verDocError) {
          console.error('Error updating verification_documents:', verDocError);
          throw verDocError;
        }
      }

      showToast('Document remplacé avec succès', 'success');
      setReplacingDocId(null);
      loadMoverData();
    } catch (error) {
      console.error('Error replacing document:', error);
      showToast('Erreur lors du remplacement', 'error');
    }
  };

  const handleAddActivityZone = async () => {
    if (!newZone.department || !newZone.zone_name) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (!moverInfo) return;

    try {
      // Get current coverage_area from mover
      const { data: currentMover } = await supabase
        .from('movers')
        .select('coverage_area')
        .eq('id', moverInfo.id)
        .single();

      const currentAreas = currentMover?.coverage_area || [];
      const newArea = `${newZone.department} - ${newZone.zone_name}`;
      
      const { error } = await supabase
        .from('movers')
        .update({
          coverage_area: [...currentAreas, newArea],
        })
        .eq('id', moverInfo.id);

      if (error) throw error;

      showToast('Zone d\'activité ajoutée', 'success');
      setShowAddZoneModal(false);
      setNewZone({ department: '', zone_name: '' });
      loadMoverData();
    } catch (error) {
      console.error('Error adding zone:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

  const handleAddTruck = async () => {
    if (!newTruck.registration || !newTruck.capacity) {
      showToast('Veuillez remplir l\'immatriculation et la capacité', 'error');
      return;
    }

    if (!moverInfo) return;

    try {
      const { error } = await supabase
        .from('trucks')
        .insert({
          mover_id: moverInfo.id,
          registration_number: newTruck.registration,
          capacity_m3: parseFloat(newTruck.capacity),
          registration_card_url: null,
        });

      if (error) throw error;

      showToast('Véhicule ajouté', 'success');
      setShowAddTruckModal(false);
      setNewTruck({ brand: '', model: '', capacity: '', registration: '' });
      loadMoverData();
    } catch (error) {
      console.error('Error adding truck:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
            <CheckCircle className="w-3 h-3" />
            Vérifié
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
            <AlertTriangle className="w-3 h-3" />
            En attente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
            <XCircle className="w-3 h-3" />
            Rejeté
          </span>
        );
      default:
        return null;
    }
  };

  const handleSave = async () => {
    if (!moverInfo) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update(editedData)
        .eq('user_id', moverId);

      if (error) throw error;

      showToast('Informations mises à jour avec succès', 'success');
      setEditing(false);
      onUpdate();
      loadMoverData();
    } catch (error) {
      console.error('Error updating mover:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moverInfo) return;

    if (!window.confirm('ATTENTION : Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT ce déménageur ?\n\nCette action est IRRÉVERSIBLE et supprimera :\n- Le profil déménageur\n- Le compte utilisateur\n- Tous les documents\n- Toutes les données associées')) {
      return;
    }

    setSaving(true);
    try {
      const { error: moverDeleteError } = await supabase
        .from('movers')
        .delete()
        .eq('id', moverInfo.id);

      if (moverDeleteError) throw moverDeleteError;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-auth-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: moverInfo.user_id })
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du compte utilisateur');
      }

      showToast('Déménageur supprimé définitivement', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting mover:', error);
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!moverInfo) return;

    const data = {
      'Informations Déménageur': {
        'ID': moverInfo.id,
        'User ID': moverInfo.user_id,
        'Email': moverInfo.email,
        'Entreprise': moverInfo.company_name,
        'SIRET': moverInfo.siret,
        'Téléphone': moverInfo.phone,
        'Adresse': `${moverInfo.address}, ${moverInfo.postal_code} ${moverInfo.city}`,
        'Date d\'inscription': new Date(moverInfo.created_at).toLocaleDateString('fr-FR'),
        'Statut de vérification': moverInfo.verification_status,
        'Compte actif': moverInfo.is_active ? 'Oui' : 'Non',
        'Suspendu': moverInfo.is_suspended ? 'Oui' : 'Non',
        'Banni': moverInfo.is_banned ? 'Oui' : 'Non',
      },
      'Statistiques': {
        'Note moyenne': moverInfo.average_rating?.toFixed(1) || 'N/A',
        'Nombre d\'avis': moverInfo.total_reviews || 0,
        'Missions complétées': moverInfo.total_missions || 0,
        'Revenu total': `${moverInfo.total_revenue?.toFixed(2) || 0} €`,
      },
      'Zones d\'activité': activityZones.map(z => `${z.department} - ${z.zone_name}`),
      'Véhicules': trucks.map(t => ({
        'Immatriculation': t.registration_number,
        'Capacité': `${t.capacity_m3} m³`,
      })),
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demenageur_${moverInfo.company_name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Fiche déménageur exportée avec succès', 'success');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!moverInfo) {
    return null;
  }

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Vérifié';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Fiche Déménageur Complète
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              title="Supprimer définitivement ce déménageur"
            >
              <XCircle className="w-4 h-4" />
              Supprimer
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Informations d'Entreprise
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVerificationColor(moverInfo.verification_status)}`}>
                  {getVerificationLabel(moverInfo.verification_status)}
                </span>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nom de l'entreprise</p>
                  {editing ? (
                    <input
                      type="text"
                      value={editedData.company_name}
                      onChange={(e) => setEditedData({ ...editedData, company_name: e.target.value })}
                      className="mt-1 w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{moverInfo.company_name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SIRET</p>
                  <p className="text-gray-900 dark:text-white font-medium">{moverInfo.siret}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium">{moverInfo.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                  {editing ? (
                    <input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      className="mt-1 w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{moverInfo.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                  {editing ? (
                    <input
                      type="text"
                      value={editedData.address}
                      onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                      className="mt-1 w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{moverInfo.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ville</p>
                  {editing ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editedData.postal_code}
                        onChange={(e) => setEditedData({ ...editedData, postal_code: e.target.value })}
                        className="w-24 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="75001"
                      />
                      <input
                        type="text"
                        value={editedData.city}
                        onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                        className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="Paris"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {moverInfo.postal_code} {moverInfo.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date d'inscription</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(moverInfo.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {(editing || moverInfo.description) && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                {editing ? (
                  <textarea
                    value={editedData.description}
                    onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Description de l'entreprise..."
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{moverInfo.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => scrollToSection('section-reviews')}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md hover:border-yellow-500 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {moverInfo.average_rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => scrollToSection('section-reviews')}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avis</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {moverInfo.total_reviews || 0}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => scrollToSection('section-missions')}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md hover:border-green-500 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Missions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {moverInfo.total_missions || 0}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => scrollToSection('section-finances')}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md hover:border-purple-500 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <Euro className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenu total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {moverInfo.total_revenue?.toFixed(0) || 0}€
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div id="section-zones">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Zones d'Activité ({activityZones.length})
              </h3>
              <button
                onClick={() => setShowAddZoneModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            {activityZones.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune zone d'activité définie</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {activityZones.map((zone, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{zone.department}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{zone.zone_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="section-trucks">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Véhicules ({trucks.length})
              </h3>
              <button
                onClick={() => setShowAddTruckModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            {trucks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun véhicule enregistré</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trucks.map((truck) => (
                  <div
                    key={truck.id}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Truck className="w-6 h-6 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {truck.registration_number}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Capacité: {truck.capacity_m3} m³
                        </p>
                        {truck.registration_card_url && (
                          <button
                            onClick={() => {
                              if (truck.registration_card_url) {
                                getFullDocumentUrl(truck.registration_card_url).then(url => {
                                  if (url) window.open(url, '_blank');
                                });
                              }
                            }}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                          >
                            <Download className="w-3 h-3" />
                            Carte grise
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="section-documents">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              Documents ({groupedDocuments.length})
            </h3>
            {groupedDocuments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun document téléchargé</p>
            ) : (
              <div className="space-y-3">
                {groupedDocuments.map((group) => (
                  <div
                    key={group.document_type}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getDocumentTypeLabel(group.document_type)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Téléchargé le {new Date(group.latest_upload).toLocaleDateString('fr-FR')}
                            {group.documents.length > 1 && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {group.documents.length} pages
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(group.verification_status)}
                        <button
                          onClick={() => setViewingDocuments(group.documents)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir les documents"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="section-missions">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Missions
            </h3>
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {moverInfo.total_missions || 0} missions complétées
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                L'historique détaillé des missions sera bientôt disponible ici
              </p>
            </div>
          </div>

          <div id="section-finances">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Euro className="w-5 h-5 text-purple-500" />
              Revenus et Finances
            </h3>
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Revenu total: {moverInfo.total_revenue?.toFixed(0) || 0}€
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Le détail des transactions et paiements sera bientôt disponible ici
              </p>
            </div>
          </div>

          <div id="section-reviews">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-500" />
              Avis et évaluations
            </h3>
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {moverInfo.total_reviews || 0} avis - Note moyenne: {moverInfo.average_rating?.toFixed(1) || '0.0'}/5
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Les avis détaillés seront bientôt disponibles ici
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewingDocuments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {getDocumentTypeLabel(viewingDocuments[0].document_type)}
                {viewingDocuments.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({viewingDocuments.length} pages)
                  </span>
                )}
              </h3>
              <button
                onClick={() => setViewingDocuments(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewingDocuments.map((doc, index) => (
                <div key={doc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page {index + 1}
                      </span>
                      {getStatusBadge(doc.verification_status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateDocumentStatus(doc.id, 'approved')}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Valider
                        </button>
                        <button
                          onClick={() => handleUpdateDocumentStatus(doc.id, 'rejected')}
                          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          Rejeter
                        </button>
                        <button
                          onClick={() => handleUpdateDocumentStatus(doc.id, 'pending')}
                          className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          En attente
                        </button>
                      </div>
                      <button
                        onClick={() => setReplacingDocId(doc.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Remplacer le document
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {!doc.signed_url ? (
                      <div className="text-center py-8">
                        <div className="text-red-600 font-medium mb-2">
                          Erreur de chargement
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Impossible de générer l'URL du document
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          URL: {doc.document_url}
                        </div>
                      </div>
                    ) : isImageFile(doc.document_url) ? (
                      <div>
                        <img
                          src={doc.signed_url}
                          alt={`Page ${index + 1}`}
                          className="w-full h-auto rounded"
                          onError={(e) => {
                            console.error('Erreur chargement image:', doc.document_url);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const errorMsg = document.createElement('div');
                              errorMsg.className = 'text-center text-red-600 py-8';
                              errorMsg.innerHTML = `
                                <div class="font-medium mb-2">Erreur de chargement de l'image</div>
                                <div class="text-sm text-gray-600">Vérifiez les permissions du bucket storage</div>
                                <div class="text-xs text-gray-500 mt-2">${doc.document_url}</div>
                              `;
                              parent.appendChild(errorMsg);
                            }
                          }}
                        />
                      </div>
                    ) : isPdfFile(doc.document_url) ? (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center space-y-4">
                        <FileText className="w-16 h-16 text-red-600" />
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white mb-1">Document PDF</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cliquez sur le bouton ci-dessous pour visualiser
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            console.log('Ouverture PDF:', doc.signed_url);
                            window.open(doc.signed_url, '_blank');
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <FileText className="w-5 h-5" />
                          Ouvrir le PDF
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Ouverture document:', doc.signed_url);
                          window.open(doc.signed_url, '_blank');
                        }}
                        className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-8 w-full"
                      >
                        <FileText className="w-8 h-8" />
                        <span>Voir le document</span>
                      </button>
                    )}
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Téléchargé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      {doc.expiration_date && (
                        <span className="block mt-1">
                          Expire le {new Date(doc.expiration_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingDocuments(null)}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {replacingDocId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setReplacingDocId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Remplacer le document
              </h3>
              <button
                onClick={() => setReplacingDocId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Téléchargez un nouveau fichier (PDF, JPG ou PNG) pour remplacer ce document.
            </p>

            <label className="block">
              <div className="flex items-center justify-center w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cliquez pour télécharger un fichier
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, JPG, JPEG ou PNG
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAdminDocumentReplace(file, replacingDocId);
                    }
                  }}
                />
              </div>
            </label>

            <div className="mt-6">
              <button
                onClick={() => setReplacingDocId(null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddZoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowAddZoneModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Ajouter une zone d'activité
              </h3>
              <button
                onClick={() => setShowAddZoneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Département
                </label>
                <input
                  type="text"
                  value={newZone.department}
                  onChange={(e) => setNewZone({ ...newZone, department: e.target.value })}
                  placeholder="Ex: 75, 92, 93..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la zone
                </label>
                <input
                  type="text"
                  value={newZone.zone_name}
                  onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                  placeholder="Ex: Paris, Hauts-de-Seine..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddZoneModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAddActivityZone}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTruckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowAddTruckModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Ajouter un véhicule
              </h3>
              <button
                onClick={() => setShowAddTruckModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marque
                </label>
                <input
                  type="text"
                  value={newTruck.brand}
                  onChange={(e) => setNewTruck({ ...newTruck, brand: e.target.value })}
                  placeholder="Ex: Renault, Peugeot..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modèle
                </label>
                <input
                  type="text"
                  value={newTruck.model}
                  onChange={(e) => setNewTruck({ ...newTruck, model: e.target.value })}
                  placeholder="Ex: Master, Boxer..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacité (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newTruck.capacity}
                  onChange={(e) => setNewTruck({ ...newTruck, capacity: e.target.value })}
                  placeholder="Ex: 20"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Immatriculation
                </label>
                <input
                  type="text"
                  value={newTruck.registration}
                  onChange={(e) => setNewTruck({ ...newTruck, registration: e.target.value.toUpperCase() })}
                  placeholder="Ex: AB-123-CD"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddTruckModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTruck}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
