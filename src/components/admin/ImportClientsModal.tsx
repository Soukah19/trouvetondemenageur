import { useState, useMemo } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Search, ChevronDown, ChevronUp, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import * as XLSX from 'xlsx';

interface Props { onClose: () => void; onImportComplete: () => void; }

interface ParsedClient {
  email: string; firstname: string; lastname: string; phone: string; has_phone: boolean; raw_data: Record<string, any>;
}

function normalizePhone(value: string): string {
  if (!value) return '';
  let cleaned = value.replace(/[\s.\-]/g, '');
  if (/^\d{9}$/.test(cleaned) && ['1','2','3','4','5','6','7','9'].includes(cleaned[0])) {
    cleaned = '0' + cleaned;
  }
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('33') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array', codepage: 65001, raw: true });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false }) as Record<string, any>[]);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture'));
    reader.readAsArrayBuffer(file);
  });
}

function validateRows(rows: Record<string, any>[]): { valid: ParsedClient[]; rejected: Array<{ row: Record<string, any>; reasons: string[] }> } {
  const valid: ParsedClient[] = [];
  const rejected: Array<{ row: Record<string, any>; reasons: string[] }> = [];
  const seenEmails = new Set<string>();

  for (const row of rows) {
    const g = (keys: string[]) => keys.reduce((v, k) => v || (row[k] || '').toString().trim(), '');
    const rawEmail = g(['email', 'Email', 'EMAIL', 'e-mail', 'E-mail', 'mail', 'Mail']);
    const email = rawEmail.toLowerCase();
    const firstname = g(['prenom', 'Prenom', 'Prénom', 'prénom', 'firstname', 'Firstname', 'first_name', 'PRENOM']);
    const lastname = g(['nom', 'Nom', 'NOM', 'lastname', 'Lastname', 'last_name', 'name', 'Name']);
    const phone = normalizePhone(g(['telephone', 'Telephone', 'Téléphone', 'téléphone', 'phone', 'Phone', 'TELEPHONE', 'tel', 'Tel', 'mobile', 'Mobile', 'MOBILE']));

    const reasons: string[] = [];
    if (!email) reasons.push('Email manquant');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reasons.push('Email invalide');
    else if (seenEmails.has(email)) reasons.push('Email en doublon dans le fichier');

    if (reasons.length > 0) { rejected.push({ row, reasons }); continue; }

    seenEmails.add(email);
    valid.push({ email, firstname, lastname, phone, has_phone: !!phone, raw_data: row });
  }
  return { valid, rejected };
}

function exportRejectedToExcel(rejected: Array<{ row: Record<string, any>; reasons: string[] }>) {
  const exportData = rejected.map(r => ({ ...r.row, RAISON_REJET: r.reasons.join(' | ') }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Rejetés');
  XLSX.writeFile(wb, `clients_rejetes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export default function ImportClientsModal({ onClose, onImportComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: ParsedClient[]; rejected: Array<{ row: Record<string, any>; reasons: string[] }> } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; duplicates: number; errors: string[] } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredValid = useMemo(() => {
    if (!validationResult || !searchTerm) return validationResult?.valid || [];
    const lower = searchTerm.toLowerCase();
    return validationResult.valid.filter(c =>
      c.email.toLowerCase().includes(lower) || c.firstname.toLowerCase().includes(lower) || c.lastname.toLowerCase().includes(lower)
    );
  }, [validationResult, searchTerm]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) { showToast('Format non supporté', 'error'); return; }
    setFile(selectedFile); setImportResult(null); setValidationResult(null); setParsing(true);
    try {
      const rows = await parseExcelFile(selectedFile);
      if (rows.length === 0) { showToast('Fichier vide', 'error'); setParsing(false); return; }
      const result = validateRows(rows);
      setValidationResult(result);
      const withPhone = result.valid.filter(c => c.has_phone).length;
      const withoutPhone = result.valid.filter(c => !c.has_phone).length;
      showToast(`${result.valid.length} valides (${withPhone} avec tél, ${withoutPhone} sans tél)`, result.rejected.length > 0 ? 'warning' : 'success');
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setParsing(false); }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;
    setImporting(true);
    const errors: string[] = [];
    let successCount = 0, duplicateCount = 0;
    const batchId = `client_import_${Date.now()}`;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast('Non connecté', 'error'); setImporting(false); return; }
      const { data: adminCheck } = await supabase.from('admins').select('id').eq('user_id', user.id).maybeSingle();
      if (!adminCheck) { showToast('Permissions insuffisantes', 'error'); setImporting(false); return; }

      // Check existing emails: client_prospects + existing auth users (case-insensitive)
      const emails = validationResult.valid.map(c => c.email); // already lowercase from validateRows
      const { data: existingProspects } = await supabase.from('client_prospects').select('email').in('email', emails);
      const { data: existingUsers } = await supabase.from('quote_requests').select('client_email').in('client_email', emails);
      const { data: authEmails } = await supabase.rpc('check_existing_auth_emails', { email_list: emails });
      const existingEmails = new Set([
        ...(existingProspects || []).map(p => p.email.toLowerCase()),
        ...(existingUsers || []).map(u => u.client_email.toLowerCase()),
        ...(authEmails || []).map((r: { email: string }) => r.email.toLowerCase()),
      ]);
      const toInsert = validationResult.valid.filter(c => { if (existingEmails.has(c.email)) { duplicateCount++; return false; } return true; });

      if (toInsert.length === 0) {
        setImportResult({ success: 0, duplicates: duplicateCount, errors: [] });
        showToast(`Tous les ${duplicateCount} prospect(s) existent déjà`, 'warning');
        setImporting(false); return;
      }

      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50).map(c => ({
          email: c.email, firstname: c.firstname, lastname: c.lastname, phone: c.phone,
          has_phone: c.has_phone, import_batch_id: batchId, raw_data: c.raw_data,
          call_status: 'not_called', invitation_status: 'not_invited',
        }));
        const { data: inserted, error } = await supabase.from('client_prospects').insert(batch).select();
        if (error) errors.push(`Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
        else if (!inserted || inserted.length === 0) errors.push(`Batch ${Math.floor(i / 50) + 1}: RLS`);
        else successCount += inserted.length;
      }
      setImportResult({ success: successCount, duplicates: duplicateCount, errors });
      if (successCount > 0) {
        showToast(`${successCount} client(s) importé(s)${duplicateCount > 0 ? `, ${duplicateCount} doublon(s)` : ''}`, 'success');
        onImportComplete();
      }
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setImporting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Upload className="w-5 h-5 text-purple-600" /> Importer des clients (prospects)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Format du fichier</h4>
            <div className="flex flex-wrap gap-2 text-xs mb-1">
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">email *</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">nom</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">prenom</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">telephone</span>
            </div>
            <p className="text-xs text-purple-600 mt-2">Seul l'email est obligatoire. Les clients sans téléphone seront dans l'onglet "Sans téléphone" pour envoi d'emails de découverte.</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload-clients" />
            <label htmlFor="file-upload-clients" className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium">Choisir un fichier</label>
            <p className="text-sm text-gray-500 mt-1">Excel (.xlsx, .xls) ou CSV</p>
            {file && <div className="mt-3 text-sm text-gray-700"><FileSpreadsheet className="w-4 h-4 inline mr-1" />{file.name}</div>}
            {parsing && <div className="mt-3 text-sm text-purple-600"><div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2"></div>Analyse...</div>}
          </div>

          {validationResult && !importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4"><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-2xl font-bold text-green-700">{validationResult.valid.length}</span></div><p className="text-sm text-green-600 mt-1">Prêts</p></div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center"><span className="text-lg font-bold text-purple-700">{validationResult.valid.filter(c => c.has_phone).length}</span><p className="text-xs text-purple-600">Avec tél</p></div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center"><span className="text-lg font-bold text-orange-700">{validationResult.valid.filter(c => !c.has_phone).length}</span><p className="text-xs text-orange-600">Sans tél</p></div>
              </div>
              {validationResult.valid.length > 0 && (
                <div><button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-sm font-medium text-purple-600">{showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Aperçu ({validationResult.valid.length})</button>
                  {showPreview && (<div className="mt-3"><div className="relative mb-2"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg" /></div>
                    <div className="max-h-48 overflow-auto border border-gray-200 rounded-lg"><table className="w-full text-xs"><thead className="bg-gray-50 sticky top-0"><tr>{['Email','Prénom','Nom','Tél'].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>)}</tr></thead><tbody className="divide-y">{filteredValid.slice(0,80).map((c,i)=><tr key={i} className="hover:bg-gray-50"><td className="px-3 py-2">{c.email}</td><td className="px-3 py-2">{c.firstname||'—'}</td><td className="px-3 py-2">{c.lastname||'—'}</td><td className={`px-3 py-2 ${c.has_phone?'':'text-orange-500 italic'}`}>{c.phone||'Aucun'}</td></tr>)}</tbody></table></div></div>)}
                </div>
              )}
              {validationResult.rejected.length > 0 && (
                <div><button onClick={() => setShowRejected(!showRejected)} className="flex items-center gap-2 text-sm font-medium text-red-600"><AlertTriangle className="w-4 h-4" /> Rejetés ({validationResult.rejected.length})</button>
                  {showRejected && (<div className="mt-3 space-y-3"><div className="max-h-32 overflow-auto border border-red-200 rounded-lg text-xs"><table className="w-full"><tbody>{validationResult.rejected.map((r,i)=><tr key={i} className="border-b border-red-100"><td className="px-3 py-1">{r.row.email||r.row.Email||'—'}</td><td className="px-3 py-1 text-red-600">{r.reasons.join(', ')}</td></tr>)}</tbody></table></div>
                    <button onClick={() => exportRejectedToExcel(validationResult.rejected)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"><Download className="w-4 h-4" /> Télécharger les rejetés (.xlsx)</button></div>)}
                </div>
              )}
            </div>
          )}

          {importResult && (<div className="space-y-3">
            {importResult.success > 0 && <div className="bg-green-50 border border-green-200 rounded-lg p-4"><CheckCircle className="w-5 h-5 text-green-600 inline mr-2" /><strong>{importResult.success}</strong> client(s) importé(s){importResult.duplicates > 0 && `, ${importResult.duplicates} doublon(s)`}</div>}
            {importResult.success === 0 && importResult.duplicates > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><AlertTriangle className="w-5 h-5 text-yellow-600 inline mr-2" />Tous existent déjà ({importResult.duplicates})</div>}
            {importResult.errors.length > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-4">{importResult.errors.map((e,i)=><p key={i} className="text-sm text-red-800">• {e}</p>)}</div>}
          </div>)}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg" disabled={importing}>{importResult ? 'Fermer' : 'Annuler'}</button>
            {validationResult && !importResult && validationResult.valid.length > 0 && (
              <button onClick={handleImport} disabled={importing} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {importing ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Import...</> : <><Upload className="w-4 h-4" /> Importer {validationResult.valid.length}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
