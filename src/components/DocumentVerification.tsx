import { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

type DocumentType = 'id_card' | 'passport' | 'insurance' | 'business_license' | 'driver_license';

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  id_card: 'Carte d\'identité',
  passport: 'Passeport',
  insurance: 'Attestation d\'assurance',
  business_license: 'Kbis / Licence commerciale',
  driver_license: 'Permis de conduire',
};

export function DocumentVerification() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<DocumentType>('id_card');
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast('Veuillez sélectionner une image ou un PDF', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Le fichier ne doit pas dépasser 10 MB', 'error');
      return;
    }

    setUploadedFile(file);
    setVerificationResult(null);
  };

  const handleUploadAndVerify = async () => {
    if (!uploadedFile || !user) return;

    setUploading(true);
    setVerifying(true);

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}/${selectedType}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('moving-photos')
        .upload(fileName, uploadedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('moving-photos')
        .getPublicUrl(uploadData.path);

      const documentUrl = urlData.publicUrl;

      setUploading(false);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-document`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentUrl,
          documentType: selectedType,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la vérification');
      }

      setVerificationResult(result);

      if (result.verification.verification_status === 'verified') {
        showToast('Document vérifié avec succès', 'success');
      } else {
        showToast('Document rejeté', 'error');
      }

      if (result.fraudAlerts && result.fraudAlerts.length > 0) {
        showToast('Alerte de fraude détectée', 'error');
      }
    } catch (error) {
      console.error('Error uploading/verifying document:', error);
      showToast('Erreur lors du téléchargement ou de la vérification', 'error');
    } finally {
      setUploading(false);
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vérification de Documents</h2>
          <p className="text-sm text-gray-600">Téléchargez vos documents pour vérification automatique</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Type de document
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading || verifying}
        >
          {Object.entries(DOCUMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Sélectionner un fichier
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="document-upload"
            disabled={uploading || verifying}
          />
          <label
            htmlFor="document-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              Cliquez pour sélectionner un fichier
            </p>
            <p className="text-xs text-gray-500">
              Image ou PDF (max 10 MB)
            </p>
          </label>
        </div>

        {uploadedFile && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-xs text-gray-600">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleUploadAndVerify}
        disabled={!uploadedFile || uploading || verifying}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading || verifying ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            {uploading ? 'Téléchargement...' : 'Vérification...'}
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Télécharger et Vérifier
          </>
        )}
      </button>

      {verificationResult && (
        <div className="mt-6">
          <div
            className={`p-4 rounded-lg border-2 ${
              verificationResult.verification.verification_status === 'verified'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {verificationResult.verification.verification_status === 'verified' ? (
                <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {verificationResult.verification.verification_status === 'verified'
                    ? 'Document vérifié'
                    : 'Document rejeté'}
                </h3>

                {verificationResult.ocrResult.extractedData && (
                  <div className="text-sm text-gray-700 space-y-1 mb-3">
                    {Object.entries(verificationResult.ocrResult.extractedData).map(
                      ([key, value]) => (
                        <p key={key}>
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      )
                    )}
                  </div>
                )}

                {verificationResult.ocrResult.confidence && (
                  <p className="text-sm text-gray-600 mb-2">
                    Confiance: {(verificationResult.ocrResult.confidence * 100).toFixed(1)}%
                  </p>
                )}

                {verificationResult.ocrResult.warnings &&
                  verificationResult.ocrResult.warnings.length > 0 && (
                    <div className="text-sm text-red-700">
                      <strong>Avertissements:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {verificationResult.ocrResult.warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {verificationResult.fraudAlerts && verificationResult.fraudAlerts.length > 0 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Alertes de fraude détectées
                    </p>
                    {verificationResult.fraudAlerts.map((alert: any, i: number) => (
                      <p key={i} className="text-xs text-red-800">
                        {alert.details.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Tous les documents sont vérifiés automatiquement par OCR et
          intelligence artificielle. Les documents suspects sont signalés pour vérification manuelle.
        </p>
      </div>
    </div>
  );
}
