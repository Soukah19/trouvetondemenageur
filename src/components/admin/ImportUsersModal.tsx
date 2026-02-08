import { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Brain, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import * as XLSX from 'xlsx';

interface ImportUsersModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
  aiAnalysis?: {
    confidence: number;
    suggestions: string[];
  };
}

export default function ImportUsersModal({ onClose, onImportComplete }: ImportUsersModalProps) {
  const [userType, setUserType] = useState<'client' | 'mover'>('client');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [aiAnalyzedData, setAiAnalyzedData] = useState<any[] | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        showToast('Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV', 'error');
        return;
      }
      setFile(selectedFile);
      setResult(null);
      setAiAnalyzedData(null);

      // Analyse automatique par IA
      await analyzeFileWithAI(selectedFile);
    }
  };

  const analyzeFileWithAI = async (file: File) => {
    setAnalyzing(true);
    try {
      const data = await parseExcelFile(file);

      if (data.length === 0) {
        showToast('Le fichier est vide', 'error');
        return;
      }

      showToast('Analyse IA en cours...', 'info');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-import-file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rows: data,
            userType: userType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse IA');
      }

      const aiResult = await response.json();

      if (aiResult.success && aiResult.mappedData) {
        setAiAnalyzedData(aiResult.mappedData);
        showToast(
          `IA: ${aiResult.mappedData.length} lignes analysées avec ${aiResult.confidence}% de confiance`,
          'success'
        );
      }
    } catch (error: any) {
      console.error('Erreur analyse IA:', error);
      showToast('Analyse IA indisponible, import manuel possible', 'warning');
    } finally {
      setAnalyzing(false);
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsBinaryString(file);
    });
  };

  const createClientAccount = async (clientData: any) => {
    const email = clientData.email || clientData.Email || clientData.EMAIL;
    const name = clientData.nom || clientData.name || clientData.Nom || clientData.Name || '';
    const phone = clientData.telephone || clientData.phone || clientData.Telephone || clientData.Phone || '';

    if (!email) {
      throw new Error('Email manquant');
    }

    const password = Math.random().toString(36).slice(-12) + 'A1!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    if (name || phone) {
      const today = new Date();
      const movingDate = new Date(today);
      movingDate.setMonth(today.getMonth() + 1);

      await supabase.from('quote_requests').insert({
        client_user_id: authData.user.id,
        client_name: name,
        client_email: email,
        client_phone: phone,
        from_address: 'Adresse à compléter',
        from_city: 'Ville',
        from_postal_code: '00000',
        to_address: 'Adresse à compléter',
        to_city: 'Ville',
        to_postal_code: '00000',
        moving_date: movingDate.toISOString().split('T')[0],
        status: 'new',
      });
    }

    return authData.user.id;
  };

  const createMoverAccount = async (moverData: any) => {
    const email = moverData.email || moverData.Email || moverData.EMAIL;
    const companyName = moverData.entreprise || moverData.company_name || moverData.Entreprise || moverData['Nom Entreprise'] || '';
    const siret = moverData.siret || moverData.SIRET || moverData.Siret || '';
    const phone = moverData.telephone || moverData.phone || moverData.Telephone || moverData.Phone || '';
    const managerFirstname = moverData.prenom || moverData.firstname || moverData.Prenom || moverData['Prénom'] || '';
    const managerLastname = moverData.nom || moverData.lastname || moverData.Nom || moverData['Nom'] || '';
    const address = moverData.adresse || moverData.address || moverData.Adresse || '';
    const city = moverData.ville || moverData.city || moverData.Ville || '';
    const postalCode = moverData.code_postal || moverData.postal_code || moverData['Code Postal'] || '';

    if (!email) {
      throw new Error('Email manquant');
    }

    if (!companyName) {
      throw new Error('Nom d\'entreprise manquant');
    }

    const password = Math.random().toString(36).slice(-12) + 'A1!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    await supabase.from('movers').insert({
      user_id: authData.user.id,
      company_name: companyName,
      siret: siret || `IMPORT-${Date.now()}`,
      manager_firstname: managerFirstname,
      manager_lastname: managerLastname,
      email,
      phone: phone || '',
      address: address || '',
      city: city || '',
      postal_code: postalCode || '',
      verification_status: 'pending',
      is_active: false,
    });

    return authData.user.id;
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Veuillez sélectionner un fichier', 'error');
      return;
    }

    setImporting(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      // Utiliser les données analysées par l'IA si disponibles, sinon parse manuel
      const data = aiAnalyzedData || await parseExcelFile(file);

      if (data.length === 0) {
        throw new Error('Le fichier est vide');
      }

      showToast(`Import de ${data.length} lignes en cours...`, 'info');

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          if (userType === 'client') {
            await createClientAccount(row);
          } else {
            await createMoverAccount(row);
          }
          successCount++;
        } catch (error: any) {
          const email = row.email || row.Email || row.EMAIL || `Ligne ${i + 1}`;
          errors.push(`${email}: ${error.message}`);
        }
      }

      setResult({
        success: successCount,
        errors,
        aiAnalysis: aiAnalyzedData ? {
          confidence: 95,
          suggestions: []
        } : undefined
      });

      if (successCount > 0) {
        const message = aiAnalyzedData
          ? `${successCount} compte(s) importé(s) avec succès (analysé par IA)`
          : `${successCount} compte(s) importé(s) avec succès`;
        showToast(message, 'success');
        onImportComplete();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showToast(`Erreur d'import: ${error.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const getTemplateInstructions = () => {
    if (userType === 'client') {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Format attendu pour les clients:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>email</strong>: Adresse email (obligatoire)</li>
            <li>• <strong>nom</strong>: Nom complet (optionnel)</li>
            <li>• <strong>telephone</strong>: Numéro de téléphone (optionnel)</li>
          </ul>
        </div>
      );
    } else {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Format attendu pour les déménageurs:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>email</strong>: Adresse email (obligatoire)</li>
            <li>• <strong>entreprise</strong>: Nom de l'entreprise (obligatoire)</li>
            <li>• <strong>siret</strong>: Numéro SIRET (optionnel)</li>
            <li>• <strong>prenom</strong>: Prénom du gérant (optionnel)</li>
            <li>• <strong>nom</strong>: Nom du gérant (optionnel)</li>
            <li>• <strong>telephone</strong>: Numéro de téléphone (optionnel)</li>
            <li>• <strong>adresse</strong>: Adresse complète (optionnel)</li>
            <li>• <strong>ville</strong>: Ville (optionnel)</li>
            <li>• <strong>code_postal</strong>: Code postal (optionnel)</li>
          </ul>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Importer des contacts
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type d'utilisateurs à importer
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUserType('client')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  userType === 'client'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Clients</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contacts clients qualifiés
                  </div>
                </div>
              </button>
              <button
                onClick={() => setUserType('mover')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  userType === 'mover'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Déménageurs</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Professionnels du déménagement
                  </div>
                </div>
              </button>
            </div>
          </div>

          {getTemplateInstructions()}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fichier à importer
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Choisir un fichier
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Excel (.xlsx, .xls) ou CSV
              </p>
              {file && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                  {analyzing && (
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span>Analyse IA en cours...</span>
                    </div>
                  )}
                  {aiAnalyzedData && !analyzing && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg py-2 px-3">
                      <Sparkles className="w-4 h-4" />
                      <span>{aiAnalyzedData.length} lignes analysées par IA</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="space-y-3">
              {result.success > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        {result.success} compte(s) importé(s) avec succès
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        {result.errors.length} erreur(s) d'import
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-800 dark:text-red-200">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={importing}
            >
              Fermer
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
