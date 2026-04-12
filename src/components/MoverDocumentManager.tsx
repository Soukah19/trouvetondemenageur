import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Upload, AlertTriangle, CheckCircle, Calendar, RefreshCw, X, Camera, Trash2, Download, Plus, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

const MAX_FILES_PER_TYPE = 5;

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  verification_status: string;
  rejection_reason?: string;
  expiration_date?: string;
  uploaded_at: string;
  source_table?: 'mover_documents' | 'verification_documents';
}

interface GroupedDocument {
  document_type: string;
  documents: Document[];
  verification_status: string;
  latest_upload: string;
  expiration_date?: string;
}

interface MoverDocumentManagerProps {
  moverId: string;
}

export function MoverDocumentManager({ moverId }: MoverDocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groupedDocuments, setGroupedDocuments] = useState<GroupedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringDocuments, setExpiringDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [viewingGroup, setViewingGroup] = useState<GroupedDocument | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const documentTypes = [
    { value: 'id_card', label: "Carte d'identité" },
    { value: 'kbis', label: 'KBIS' },
    { value: 'insurance', label: 'Assurance professionnelle' },
    { value: 'vehicle_registration', label: 'Carte grise' },
    { value: 'driver_license', label: 'Licence de transport' },
    { value: 'technical_control', label: 'Contrôle technique' },
    { value: 'urssaf', label: 'Attestation URSSAF' },
    { value: 'bank_details', label: 'RIB / Relevé bancaire' },
  ];

  useEffect(() => {
    if (moverId) {
      loadDocuments();
    }
  }, [moverId]);

  const loadDocuments = async () => {
    if (!moverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        { data: moverDocsData, error: moverDocsError },
        { data: verificationDocsData, error: verDocsError }
      ] = await Promise.all([
        supabase
          .from('mover_documents')
          .select('*')
          .eq('mover_id', moverId)
          .order('uploaded_at', { ascending: false }),
        supabase
          .from('verification_documents')
          .select('*')
          .eq('mover_id', moverId)
          .order('uploaded_at', { ascending: false }),
      ]);

      if (moverDocsError) console.error('Error loading mover_documents:', moverDocsError);
      if (verDocsError) console.error('Error loading verification_documents:', verDocsError);

      const allDocs: Document[] = [];

      if (moverDocsData) {
        for (const doc of moverDocsData) {
          allDocs.push({
            id: doc.id,
            document_type: doc.document_type,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
            rejection_reason: doc.rejection_reason,
            expiration_date: doc.expiration_date,
            uploaded_at: doc.uploaded_at || doc.created_at,
            source_table: 'mover_documents',
          });
        }
      }

      if (verificationDocsData) {
        for (const doc of verificationDocsData) {
          let normalizedType = doc.document_type;
          if (normalizedType === 'id_card' || normalizedType === 'passport') {
            const url = (doc.document_url || '').toLowerCase();
            normalizedType = url.includes('verso') ? 'identity_verso' : 'identity_recto';
          }
          if (normalizedType === 'transport_license') {
            normalizedType = 'license';
          }

          allDocs.push({
            id: doc.id,
            document_type: normalizedType,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
            rejection_reason: doc.rejection_reason,
            expiration_date: doc.expiration_date,
            uploaded_at: doc.uploaded_at || doc.created_at,
            source_table: 'verification_documents',
          });
        }
      }

      setDocuments(allDocs);
      checkExpiringDocuments(allDocs);
      groupDocumentsByType(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      showToast('Erreur lors du chargement des documents', 'error');
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

  const checkExpiringDocuments = (docs: Document[]) => {
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const expiring = docs.filter(doc => {
      if (!doc.expiration_date) return false;
      const expirationDate = new Date(doc.expiration_date);
      return expirationDate <= oneMonthFromNow && expirationDate >= today;
    });

    setExpiringDocuments(expiring);
  };

  const handleUploadFile = async (file: File, docType: string) => {
    // Check max files
    const existingCount = documents.filter(d => d.document_type === docType).length;
    if (existingCount >= MAX_FILES_PER_TYPE) {
      showToast(`Maximum ${MAX_FILES_PER_TYPE} fichiers par type de document`, 'error');
      return;
    }

    setUploadingFile(true);
    try {
      const mimeMap: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' };
      const fileExt = mimeMap[file.type] || file.name.split('.').pop() || 'bin';
      const fileName = `${moverId}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('mover_documents')
        .insert({
          mover_id: moverId,
          document_type: docType,
          document_name: getDocumentTypeLabel(docType),
          document_url: fileName,
          verification_status: 'pending',
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      showToast('Document téléchargé avec succès', 'success');

      // Reload and refresh state
      setSignedUrls({});
      await loadDocuments();

      // If we're viewing a group, refresh it
      if (viewingGroup && viewingGroup.document_type === docType) {
        const updatedDocs = [...documents.filter(d => d.document_type === docType)];
        // Will be refreshed by loadDocuments, but we trigger re-render of modal
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showToast(error?.message || 'Erreur lors du téléchargement', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    setDeletingDocId(docId);
    try {
      const doc = documents.find(d => d.id === docId);
      let deleted = false;

      // Try the known source table first
      if (doc?.source_table === 'mover_documents') {
        const { error } = await supabase.from('mover_documents').delete().eq('id', docId);
        if (!error) deleted = true;
      } else if (doc?.source_table === 'verification_documents') {
        const { error } = await supabase.from('verification_documents').delete().eq('id', docId);
        if (!error) deleted = true;
      }

      // If source unknown or failed, try both
      if (!deleted) {
        const { data: moverData, error: moverErr } = await supabase
          .from('mover_documents')
          .delete()
          .eq('id', docId)
          .select();

        if (!moverErr && moverData && moverData.length > 0) {
          deleted = true;
        } else {
          const { error: verErr } = await supabase
            .from('verification_documents')
            .delete()
            .eq('id', docId);

          if (!verErr) deleted = true;
          else throw verErr;
        }
      }

      showToast('Document supprimé avec succès', 'success');
      setSignedUrls({});
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setDeletingDocId(null);
    }
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (url: string) => {
    return url.toLowerCase().endsWith('.pdf');
  };

  const getFullDocumentUrl = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    const buckets = ['identity-documents', 'truck-documents', 'moving-photos'];
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(url, 3600);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    }
    return '';
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const getStatusBadge = (status: string, rejectionReason?: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Approuvé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
            <RefreshCw className="w-3 h-3" />
            En attente
          </span>
        );
      case 'rejected':
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
              <AlertTriangle className="w-3 h-3" />
              Rejeté
            </span>
            {rejectionReason && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                Raison : {rejectionReason}
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const openViewModal = async (group: GroupedDocument) => {
    setViewingGroup(group);
    setSignedUrls({});

    // Pre-load signed URLs
    const urls: Record<string, string> = {};
    await Promise.all(
      group.documents.map(async (doc) => {
        const url = await getFullDocumentUrl(doc.document_url);
        if (url) urls[doc.id] = url;
      })
    );
    setSignedUrls(prev => ({ ...prev, ...urls }));
  };

  const handleDownloadDoc = async (doc: Document) => {
    try {
      let url = signedUrls[doc.id];
      if (!url) {
        url = await getFullDocumentUrl(doc.document_url);
      }
      if (url) {
        window.open(url, '_blank');
      } else {
        showToast('Impossible de télécharger le document', 'error');
      }
    } catch (error) {
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  // Get docs for the currently selected type in upload modal
  const getDocsForSelectedType = () => {
    return documents.filter(d => d.document_type === selectedDocType);
  };

  // Get fresh viewing docs (in case loadDocuments was called while modal is open)
  const getViewingDocs = () => {
    if (!viewingGroup) return [];
    return documents.filter(d => d.document_type === viewingGroup.document_type);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Mes Documents
        </h3>
        <button
          onClick={() => {
            setSelectedDocType('');
            setShowUploadModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Upload className="h-4 w-4" />
          Mettre à jour un document
        </button>
      </div>

      {/* Expiring warnings */}
      {expiringDocuments.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-2">
                Documents à renouveler prochainement
              </h4>
              <div className="space-y-2">
                {expiringDocuments.map(doc => {
                  const daysLeft = getDaysUntilExpiration(doc.expiration_date!);
                  return (
                    <div key={doc.id} className="flex items-center justify-between text-sm">
                      <span className="text-orange-800">{getDocumentTypeLabel(doc.document_type)}</span>
                      <span className="text-orange-900 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-3">
        {groupedDocuments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun document téléchargé</p>
            <p className="text-gray-400 text-sm mt-1">Cliquez sur "Mettre à jour" pour ajouter vos documents</p>
          </div>
        ) : (
          groupedDocuments.map(group => (
            <div
              key={group.document_type}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <h4 className="font-medium text-gray-900">
                    {getDocumentTypeLabel(group.document_type)}
                  </h4>
                  {getStatusBadge(group.verification_status)}
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {group.documents.length} fichier{group.documents.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
                  <span>
                    Dernier ajout : {new Date(group.latest_upload).toLocaleDateString('fr-FR')}
                  </span>
                  {group.expiration_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expire le {new Date(group.expiration_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openViewModal(group)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
              >
                <Eye className="w-4 h-4" />
                Voir
              </button>
            </div>
          ))
        )}
      </div>

      {/* ============ VIEW MODAL ============ */}
      {viewingGroup && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setViewingGroup(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {getDocumentTypeLabel(viewingGroup.document_type)}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {getViewingDocs().length} fichier{getViewingDocs().length !== 1 ? 's' : ''} • Max {MAX_FILES_PER_TYPE} fichiers
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Upload more button */}
                {getViewingDocs().length < MAX_FILES_PER_TYPE && (
                  <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Ajouter un fichier
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleUploadFile(file, viewingGroup.document_type);
                          // Refresh the modal data
                          const freshGroup = groupedDocuments.find(g => g.document_type === viewingGroup.document_type);
                          if (freshGroup) {
                            await openViewModal(freshGroup);
                          }
                        }
                        e.target.value = '';
                      }}
                      disabled={uploadingFile}
                    />
                  </label>
                )}
                <button
                  onClick={() => setViewingGroup(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* File list */}
            <div className="overflow-y-auto flex-1 p-6">
              {uploadingFile && (
                <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">Téléchargement en cours...</span>
                </div>
              )}

              <div className="space-y-4">
                {getViewingDocs().map((doc, index) => (
                  <div key={doc.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition">
                    {/* File header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {isImageFile(doc.document_url) ? 'Image' : isPdfFile(doc.document_url) ? 'PDF' : 'Fichier'}
                            {' '} — {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {getStatusBadge(doc.verification_status, doc.rejection_reason)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          title="Télécharger"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Télécharger
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deletingDocId === doc.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deletingDocId === doc.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Supprimer
                        </button>
                      </div>
                    </div>
                    {/* File preview */}
                    <div className="p-4">
                      {signedUrls[doc.id] ? (
                        isImageFile(doc.document_url) ? (
                          <img
                            src={signedUrls[doc.id]}
                            alt={`Fichier ${index + 1}`}
                            className="w-full h-auto max-h-64 object-contain rounded-lg bg-gray-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const errorMsg = document.createElement('div');
                                errorMsg.className = 'text-center text-red-500 py-6 text-sm';
                                errorMsg.textContent = 'Erreur de chargement de l\'image';
                                parent.appendChild(errorMsg);
                              }
                            }}
                          />
                        ) : isPdfFile(doc.document_url) ? (
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <iframe
                              src={signedUrls[doc.id]}
                              className="w-full h-72 rounded-lg"
                              title={`Document ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => window.open(signedUrls[doc.id], '_blank')}
                              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-3 border-t border-gray-200 w-full text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir dans un nouvel onglet
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => window.open(signedUrls[doc.id], '_blank')}
                            className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-8 w-full"
                          >
                            <FileText className="w-8 h-8" />
                            <span>Voir le document</span>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                          Chargement...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {getViewingDocs().length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun fichier dans ce type de document</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <p className="text-xs text-gray-400">
                {getViewingDocs().length}/{MAX_FILES_PER_TYPE} fichiers utilisés
              </p>
              <button
                onClick={() => setViewingGroup(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============ UPLOAD / UPDATE MODAL ============ */}
      {showUploadModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => { setShowUploadModal(false); setSelectedDocType(''); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mettre à jour un document</h3>
                <p className="text-sm text-gray-500 mt-0.5">Sélectionnez un type puis gérez vos fichiers</p>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setSelectedDocType(''); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de document
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => {
                    setSelectedDocType(e.target.value);
                    setSignedUrls({});
                    // Load signed URLs for existing docs of this type
                    if (e.target.value) {
                      const docsOfType = documents.filter(d => d.document_type === e.target.value);
                      docsOfType.forEach(async (doc) => {
                        const url = await getFullDocumentUrl(doc.document_url);
                        if (url) setSignedUrls(prev => ({ ...prev, [doc.id]: url }));
                      });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
                >
                  <option value="">Sélectionnez un type</option>
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Files for selected type */}
              {selectedDocType && (
                <>
                  {/* Existing files list */}
                  {getDocsForSelectedType().length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Fichiers existants ({getDocsForSelectedType().length}/{MAX_FILES_PER_TYPE})
                      </h4>
                      <div className="space-y-2">
                        {getDocsForSelectedType().map((doc, index) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {isImageFile(doc.document_url) ? '📷 Image' : isPdfFile(doc.document_url) ? '📄 PDF' : '📎 Fichier'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              {getStatusBadge(doc.verification_status, doc.rejection_reason)}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <button
                                onClick={() => handleDownloadDoc(doc)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deletingDocId === doc.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deletingDocId === doc.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload area */}
                  {getDocsForSelectedType().length < MAX_FILES_PER_TYPE ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Ajouter un fichier
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer group">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition">
                            <Upload className="w-6 h-6 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Télécharger</span>
                          <span className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUploadFile(file, selectedDocType);
                              }
                              e.target.value = '';
                            }}
                            disabled={uploadingFile}
                          />
                        </label>

                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer group">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-200 transition">
                            <Camera className="w-6 h-6 text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Prendre une photo</span>
                          <span className="text-xs text-gray-400 mt-1">Utiliser la caméra</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUploadFile(file, selectedDocType);
                              }
                              e.target.value = '';
                            }}
                            disabled={uploadingFile}
                          />
                        </label>
                      </div>

                      {uploadingFile && (
                        <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-blue-700">Téléchargement en cours...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        Nombre maximum de fichiers atteint ({MAX_FILES_PER_TYPE}/{MAX_FILES_PER_TYPE}). Supprimez un fichier existant pour en ajouter un nouveau.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => { setShowUploadModal(false); setSelectedDocType(''); }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
