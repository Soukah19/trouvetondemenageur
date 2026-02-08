import { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertTriangle, Building, User, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import { validateEmail, validatePhone, getEmailValidationMessage, getPhoneValidationMessage } from '../../utils/validation';

interface MoverEditModalProps {
  moverId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface MoverDocument {
  id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  verification_status: string;
}

interface MoverData {
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
}

export function MoverEditModal({ moverId, onClose, onUpdate }: MoverEditModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'manager' | 'documents'>('info');
  const [documents, setDocuments] = useState<MoverDocument[]>([]);
  const [moverData, setMoverData] = useState<MoverData>({
    company_name: '',
    siret: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    manager_firstname: '',
    manager_lastname: '',
    manager_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
    kbis: null,
    insurance: null,
    license: null,
    identity_recto: null,
    identity_verso: null
  });

  useEffect(() => {
    loadMoverData();
    loadDocuments();
  }, [moverId]);

  const loadMoverData = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('company_name, siret, email, phone, address, city, postal_code, manager_firstname, manager_lastname, manager_phone')
        .eq('id', moverId)
        .single();

      if (error) throw error;
      if (data) setMoverData(data);
    } catch (error) {
      console.error('Error loading mover data:', error);
      showToast('Erreur lors du chargement', 'error');
    }
  };

  const loadDocuments = async () => {
    try {
      // Load documents from both tables
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

      if (moverDocsError) console.error('Error loading mover_documents:', moverDocsError);
      if (verDocsError) console.error('Error loading verification_documents:', verDocsError);

      // Merge documents from both tables
      const allDocs: MoverDocument[] = [];
      
      if (moverDocsData) {
        for (const doc of moverDocsData) {
          allDocs.push({
            id: doc.id,
            document_type: doc.document_type,
            document_name: doc.document_name || doc.document_type,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
          });
        }
      }
      
      if (verificationDocsData) {
        for (const doc of verificationDocsData) {
          // Normalize verification_documents types to match what the UI expects
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
            document_name: doc.document_name || normalizedType,
            document_url: doc.document_url,
            verification_status: doc.verification_status || 'pending',
          });
        }
      }

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMoverInfo = async () => {
    if (!validateEmail(moverData.email)) {
      showToast(getEmailValidationMessage(), 'error');
      return;
    }

    if (!validatePhone(moverData.phone)) {
      showToast(getPhoneValidationMessage(), 'error');
      return;
    }

    if (!validatePhone(moverData.manager_phone)) {
      showToast('Téléphone du gérant: ' + getPhoneValidationMessage(), 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('movers')
        .update({
          company_name: moverData.company_name,
          siret: moverData.siret,
          email: moverData.email,
          phone: moverData.phone,
          address: moverData.address,
          city: moverData.city,
          postal_code: moverData.postal_code,
          manager_firstname: moverData.manager_firstname,
          manager_lastname: moverData.manager_lastname,
          manager_phone: moverData.manager_phone
        })
        .eq('id', moverId);

      if (error) throw error;

      showToast('Informations mises à jour avec succès', 'success');
      onUpdate();
    } catch (error: any) {
      console.error('Error saving mover info:', error);
      showToast(`Erreur lors de la sauvegarde: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (documentType: string, file: File | null) => {
    setSelectedFiles(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const handleUploadDocument = async (documentType: string) => {
    const file = selectedFiles[documentType];
    if (!file) {
      showToast('Veuillez sélectionner un fichier', 'error');
      return;
    }

    setUploading(true);
    try {
      const { data: mover } = await supabase
        .from('movers')
        .select('user_id')
        .eq('id', moverId)
        .single();

      if (!mover) throw new Error('Déménageur introuvable');

      const fileName = `${mover.user_id}/${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const existingDoc = documents.find(doc => doc.document_type === documentType);
      const documentName = getDocumentName(documentType);

      if (existingDoc) {
        // Try to update in mover_documents first
        const { error: moverUpdateError, data: moverUpdateData } = await supabase
          .from('mover_documents')
          .update({
            document_url: uploadData.path,
            document_name: documentName,
            verification_status: 'pending'
          })
          .eq('id', existingDoc.id)
          .select();

        // If not found in mover_documents, try verification_documents
        if (moverUpdateError || !moverUpdateData || moverUpdateData.length === 0) {
          const { error: verUpdateError } = await supabase
            .from('verification_documents')
            .update({
              document_url: uploadData.path,
              document_name: documentName,
              verification_status: 'pending'
            })
            .eq('id', existingDoc.id);

          if (verUpdateError) {
            console.error('Error updating verification_documents:', verUpdateError);
            throw verUpdateError;
          }
        }
      } else {
        const { error: insertError } = await supabase
          .from('mover_documents')
          .insert({
            mover_id: moverId,
            document_type: documentType,
            document_name: documentName,
            document_url: uploadData.path,
            verification_status: 'pending'
          });

        if (insertError) throw insertError;
      }

      showToast('Document mis à jour avec succès', 'success');
      setSelectedFiles(prev => ({ ...prev, [documentType]: null }));
      loadDocuments();
      onUpdate();
      // Close the modal after successful update
      setTimeout(() => onClose(), 500);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showToast(`Erreur lors de l'upload: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentName = (type: string): string => {
    const names: Record<string, string> = {
      kbis: 'Extrait KBIS',
      insurance: 'Attestation d\'assurance',
      license: 'Licence de transport',
      identity_recto: 'Pièce d\'identité - Recto',
      identity_verso: 'Pièce d\'identité - Verso'
    };
    return names[type] || type;
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    if (!doc) return { label: 'Aucun document', color: 'text-red-600' };
    if (doc.verification_status === 'approved' || doc.verification_status === 'verified') return { label: 'Approuvé', color: 'text-green-600' };
    if (doc.verification_status === 'rejected') return { label: 'Rejeté', color: 'text-red-600' };
    return { label: 'En attente', color: 'text-yellow-600' };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-700">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Modifier le déménageur</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'info'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="w-5 h-5" />
            Informations de l'entreprise
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'manager'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5" />
            Gérant
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'documents'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Documents
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Onglet Informations de l'entreprise */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={moverData.company_name}
                    onChange={(e) => setMoverData({ ...moverData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET *
                  </label>
                  <input
                    type="text"
                    value={moverData.siret}
                    onChange={(e) => setMoverData({ ...moverData, siret: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    value={moverData.email}
                    onChange={(e) => setMoverData({ ...moverData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={moverData.phone}
                    onChange={(e) => setMoverData({ ...moverData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={moverData.address}
                    onChange={(e) => setMoverData({ ...moverData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={moverData.city}
                    onChange={(e) => setMoverData({ ...moverData, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={moverData.postal_code}
                    onChange={(e) => setMoverData({ ...moverData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveMoverInfo}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          )}

          {/* Onglet Gérant */}
          {activeTab === 'manager' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom du gérant *
                  </label>
                  <input
                    type="text"
                    value={moverData.manager_firstname}
                    onChange={(e) => setMoverData({ ...moverData, manager_firstname: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du gérant *
                  </label>
                  <input
                    type="text"
                    value={moverData.manager_lastname}
                    onChange={(e) => setMoverData({ ...moverData, manager_lastname: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone du gérant *
                  </label>
                  <input
                    type="tel"
                    value={moverData.manager_phone}
                    onChange={(e) => setMoverData({ ...moverData, manager_phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveMoverInfo}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          )}

          {/* Onglet Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Remplacement de documents</p>
                  <p>Après avoir remplacé un document, celui-ci devra être re-vérifié par l'IA et l'équipe administrative.</p>
                </div>
              </div>

              <div className="space-y-6">
            {/* KBIS */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Extrait KBIS
                  </h3>
                  <p className={`text-sm ${getDocumentStatus('kbis').color}`}>
                    {getDocumentStatus('kbis').label}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('kbis', e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles.kbis && (
                  <button
                    onClick={() => handleUploadDocument('kbis')}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Remplacer le KBIS
                  </button>
                )}
              </div>
            </div>

            {/* Assurance */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Attestation d'assurance RC PRO
                  </h3>
                  <p className={`text-sm ${getDocumentStatus('insurance').color}`}>
                    {getDocumentStatus('insurance').label}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('insurance', e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles.insurance && (
                  <button
                    onClick={() => handleUploadDocument('insurance')}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Remplacer l'assurance
                  </button>
                )}
              </div>
            </div>

            {/* Licence de transport */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Licence de transport
                  </h3>
                  <p className={`text-sm ${getDocumentStatus('license').color}`}>
                    {getDocumentStatus('license').label}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('license', e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles.license && (
                  <button
                    onClick={() => handleUploadDocument('license')}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Remplacer la licence
                  </button>
                )}
              </div>
            </div>

            {/* Pièce d'identité - Recto */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Pièce d'identité - Recto
                  </h3>
                  <p className={`text-sm ${getDocumentStatus('identity_recto').color}`}>
                    {getDocumentStatus('identity_recto').label}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('identity_recto', e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles.identity_recto && (
                  <button
                    onClick={() => handleUploadDocument('identity_recto')}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Remplacer le recto
                  </button>
                )}
              </div>
            </div>

            {/* Pièce d'identité - Verso */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Pièce d'identité - Verso
                  </h3>
                  <p className={`text-sm ${getDocumentStatus('identity_verso').color}`}>
                    {getDocumentStatus('identity_verso').label}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('identity_verso', e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles.identity_verso && (
                  <button
                    onClick={() => handleUploadDocument('identity_verso')}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Remplacer le verso
                  </button>
                )}
              </div>
            </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
