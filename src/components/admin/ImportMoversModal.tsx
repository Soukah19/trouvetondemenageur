import { useState, useMemo } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Search, ChevronDown, ChevronUp, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import * as XLSX from 'xlsx';

interface ImportMoversModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedMover {
  company_name: string;
  siret: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  postal_code: string;
  city: string;
  department: string;
  region: string;
  activity: string;
  manager_firstname: string;
  manager_lastname: string;
  has_phone: boolean;
  raw_data: Record<string, any>;
}

interface ValidationResult {
  valid: ParsedMover[];
  rejected: Array<{ row: Record<string, any>; reasons: string[] }>;
}

interface ImportResult {
  success: number;
  duplicates: number;
  errors: string[];
}

function parseDirigeants(dirigeants: string | undefined): { firstname: string; lastname: string } {
  if (!dirigeants || dirigeants.trim() === '') return { firstname: '', lastname: '' };
  let mainPerson = dirigeants;
  const people = dirigeants.split(/,(?=[A-Z])/);
  const priority = people.find(p => /gérant|president|président|directeur général/i.test(p));
  if (priority) mainPerson = priority.trim();
  else mainPerson = people[0].trim();
  mainPerson = mainPerson.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const parts = mainPerson.split(/\s+/);
  if (parts.length === 0) return { firstname: '', lastname: '' };
  if (parts.length === 1) return { firstname: '', lastname: parts[0] };
  const lastNameParts: string[] = [];
  const firstNameParts: string[] = [];
  let foundFirstName = false;
  for (const part of parts) {
    if (!foundFirstName && part === part.toUpperCase() && /^[A-ZÀ-ÖØ-Ý'-]+$/i.test(part)) {
      lastNameParts.push(part);
    } else { foundFirstName = true; firstNameParts.push(part); }
  }
  if (firstNameParts.length === 0 && lastNameParts.length > 1) {
    const first = lastNameParts.shift()!;
    return { firstname: lastNameParts.join(' '), lastname: first };
  }
  return { firstname: firstNameParts.join(' ') || '', lastname: lastNameParts.join(' ') || parts[0] };
}

function mapActivity(activity: string | undefined): string {
  if (!activity) return '';
  const lower = activity.toLowerCase();
  if (lower.includes('déménagement') || lower.includes('demenagement')) return 'Déménagement';
  if (lower.includes('transport')) return 'Transport';
  if (lower.includes('messagerie') || lower.includes('fret')) return 'Transport';
  return activity;
}

function normalizePhone(value: string): string {
  if (!value) return '';
  // Remove spaces, dots, dashes
  let cleaned = value.replace(/[\s.\-]/g, '');
  // If it's a French number missing the leading 0 (e.g. "612345678" → "0612345678")
  if (/^\d{9}$/.test(cleaned) && ['1','2','3','4','5','6','7','9'].includes(cleaned[0])) {
    cleaned = '0' + cleaned;
  }
  // If Excel converted to scientific notation or float (e.g. "33612345678" or "+33612345678")
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
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', codepage: 65001, raw: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false }) as Record<string, any>[]);
      } catch (error) { reject(error); }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture'));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeSiret(raw: string): string {
  if (!raw) return '';
  // Handle scientific notation from Excel (e.g. 1.23457E+13 → "12345700000000")
  const num = Number(raw);
  if (!isNaN(num) && raw.toLowerCase().includes('e')) {
    return num.toFixed(0);
  }
  return raw;
}

function validateAndParse(rows: Record<string, any>[]): ValidationResult {
  const valid: ParsedMover[] = [];
  const rejected: Array<{ row: Record<string, any>; reasons: string[] }> = [];
  const seenEmails = new Set<string>();

  for (const row of rows) {
    const reasons: string[] = [];
    // Case-insensitive, accent-insensitive column getter
    const g = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') return (row[k] || '').toString().trim();
      }
      // Fallback: try case-insensitive match against all row keys
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const kLower = k.toLowerCase().replace(/[_\s]/g, '');
        for (const rk of rowKeys) {
          const rkLower = rk.toLowerCase().replace(/[_\s]/g, '');
          if (rkLower === kLower && row[rk] !== undefined && row[rk] !== '') {
            return (row[rk] || '').toString().trim();
          }
        }
      }
      return '';
    };

    const rawEmail = g(['EMAIL', 'email', 'Email', 'E-mail', 'e-mail', 'ADRESSE_EMAIL', 'adresse_email']);
    const email = rawEmail.toLowerCase();
    const companyName = g(['RAISON_SOCIALE', 'raison_sociale', 'Raison sociale', 'Raison_sociale', 'RAISON SOCIALE', 'Entreprise', 'entreprise', 'ENTREPRISE', 'Société', 'societe', 'SOCIETE', 'company_name']);
    const rawSiret = g(['SIRET', 'siret', 'Siret', 'N_SIRET', 'n_siret', 'Numéro SIRET']);
    const siret = normalizeSiret(rawSiret);
    const phone = normalizePhone(g(['TELEPHONE', 'telephone', 'Téléphone', 'Tel', 'tel', 'TEL', 'Phone', 'phone', 'PHONE']));
    const mobile = normalizePhone(g(['MOBILE', 'mobile', 'Mobile', 'Portable', 'portable', 'PORTABLE', 'GSM', 'gsm']));
    const address = g(['ADRESSE', 'adresse', 'Adresse', 'ADDRESS', 'address']);
    const postalCode = g(['CODE_POSTAL', 'code_postal', 'Code postal', 'Code_postal', 'CP', 'cp']);
    const city = g(['VILLE', 'ville', 'Ville', 'City', 'city', 'CITY']);
    const department = g(['NOM_DEPARTEMENT', 'nom_departement', 'Département', 'departement', 'DEPARTEMENT']);
    const activity = g(['ACTIVITE', 'activite', 'Activité', 'ACTIVITE']);
    const dirigeants = g(['DIRIGEANTS', 'dirigeants', 'Dirigeant', 'dirigeant', 'DIRIGEANT', 'Gérant', 'gerant', 'GERANT']);

    // Required: RAISON_SOCIALE + TELEPHONE (email and siret are optional now)
    if (!companyName) reasons.push('RAISON_SOCIALE manquante');
    if (!phone && !mobile) reasons.push('TELEPHONE manquant');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reasons.push('EMAIL invalide');
    if (email && seenEmails.has(email)) reasons.push('EMAIL en doublon dans le fichier');

    if (reasons.length > 0) { rejected.push({ row, reasons }); continue; }

    if (email) seenEmails.add(email);
    const { firstname, lastname } = parseDirigeants(dirigeants);
    const hasPhone = !!(phone || mobile);

    valid.push({
      company_name: companyName, siret, email, phone, mobile, address,
      postal_code: postalCode, city, department,
      region: g(['NOM_REGION', 'nom_region']),
      activity: mapActivity(activity),
      manager_firstname: firstname, manager_lastname: lastname,
      has_phone: hasPhone,
      raw_data: row
    });
  }
  return { valid, rejected };
}

function exportRejectedToExcel(rejected: Array<{ row: Record<string, any>; reasons: string[] }>) {
  const exportData = rejected.map(r => ({ ...r.row, RAISON_REJET: r.reasons.join(' | ') }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Rejetés');
  XLSX.writeFile(wb, `movers_rejetes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export default function ImportMoversModal({ onClose, onImportComplete }: ImportMoversModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredValid = useMemo(() => {
    if (!validationResult || !searchTerm) return validationResult?.valid || [];
    const lower = searchTerm.toLowerCase();
    return validationResult.valid.filter(m =>
      m.company_name.toLowerCase().includes(lower) || m.email.toLowerCase().includes(lower) ||
      m.city.toLowerCase().includes(lower) || m.manager_lastname.toLowerCase().includes(lower)
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
      const result = validateAndParse(rows);
      setValidationResult(result);
      const withPhone = result.valid.filter(m => m.has_phone).length;
      const withoutPhone = result.valid.filter(m => !m.has_phone).length;
      showToast(
        `${result.valid.length} valides (${withPhone} avec tél, ${withoutPhone} sans tél)${result.rejected.length > 0 ? `, ${result.rejected.length} rejetés` : ''}`,
        result.rejected.length > 0 ? 'warning' : 'success'
      );
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setParsing(false); }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;
    setImporting(true);
    const errors: string[] = [];
    let successCount = 0, duplicateCount = 0;
    const batchId = `import_${Date.now()}`;
    try {
      // Verify admin permissions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast('Vous devez être connecté', 'error'); setImporting(false); return; }
      const { data: adminCheck } = await supabase.from('admins').select('id').eq('user_id', user.id).maybeSingle();
      if (!adminCheck) { showToast('Permissions insuffisantes', 'error'); setImporting(false); return; }

      // Check ALL existing emails: prospects + movers + auth users (case-insensitive)
      // Only check duplicates for prospects that have an email
      const emails = validationResult.valid.map(m => m.email).filter(e => e);
      let existingEmails = new Set<string>();
      if (emails.length > 0) {
        const { data: ep } = await supabase.from('mover_prospects').select('email').in('email', emails);
        const { data: em } = await supabase.from('movers').select('email').in('email', emails);
        let authEmailsData: any[] = [];
        try {
          const { data: authEmails } = await supabase.rpc('check_existing_auth_emails', { email_list: emails });
          authEmailsData = authEmails || [];
        } catch { /* rpc may not exist */ }
        existingEmails = new Set([
          ...(ep || []).map(p => p.email.toLowerCase()),
          ...(em || []).map(m => m.email.toLowerCase()),
          ...authEmailsData.map((r: { email: string }) => r.email.toLowerCase()),
        ]);
      }
      const toInsert = validationResult.valid.filter(m => { if (m.email && existingEmails.has(m.email)) { duplicateCount++; return false; } return true; });

      if (toInsert.length === 0) {
        setImportResult({ success: 0, duplicates: duplicateCount, errors: [] });
        if (duplicateCount > 0) showToast(`Tous les ${duplicateCount} prospect(s) existent déjà`, 'warning');
        setImporting(false);
        return;
      }

      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50).map(m => ({
          company_name: m.company_name, siret: m.siret, email: m.email, phone: m.phone, mobile: m.mobile,
          address: m.address, postal_code: m.postal_code, city: m.city, department: m.department,
          region: m.region, activity: m.activity, manager_firstname: m.manager_firstname,
          manager_lastname: m.manager_lastname, import_batch_id: batchId, raw_data: m.raw_data,
          call_status: 'not_called', invitation_status: 'not_invited', has_phone: m.has_phone,
        }));
        const { data: inserted, error } = await supabase.from('mover_prospects').insert(batch).select();
        if (error) errors.push(`Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
        else if (!inserted || inserted.length === 0) errors.push(`Batch ${Math.floor(i / 50) + 1}: RLS — vérifiez vos permissions admin`);
        else successCount += inserted.length;
      }
      setImportResult({ success: successCount, duplicates: duplicateCount, errors });
      if (successCount > 0) {
        showToast(`${successCount} prospect(s) importé(s)${duplicateCount > 0 ? `, ${duplicateCount} doublon(s)` : ''}`, 'success');
        onImportComplete();
      } else if (errors.length > 0) {
        showToast('Aucun prospect importé — voir erreurs', 'error');
      }
    } catch (error: any) { showToast(`Erreur: ${error.message}`, 'error'); } finally { setImporting(false); }
  };

  const requiredCols = ['RAISON_SOCIALE', 'TELEPHONE'];
  const optionalCols = ['TELEPHONE', 'MOBILE', 'DIRIGEANTS', 'ADRESSE', 'CODE_POSTAL', 'VILLE', 'NOM_DEPARTEMENT', 'ACTIVITE', 'NOM_REGION'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600" /> Importer des déménageurs (prospects)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Format du fichier Excel</h4>
            <div className="mb-2">
              <p className="text-xs font-medium text-red-600 mb-1">Colonnes obligatoires :</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {requiredCols.map(col => (<span key={col} className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold">{col} *</span>))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 mb-1">Colonnes optionnelles :</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {optionalCols.map(col => (<span key={col} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">{col}</span>))}
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">Les prospects sans téléphone seront automatiquement classés dans l'onglet "Sans téléphone" pour envoi d'emails de découverte. Le déménageur invité pourra compléter les informations manquantes lors de son inscription.</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload-movers" />
            <label htmlFor="file-upload-movers" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">Choisir un fichier</label>
            <p className="text-sm text-gray-500 mt-1">Excel (.xlsx, .xls) ou CSV</p>
            {file && <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300"><FileSpreadsheet className="w-4 h-4" />{file.name}</div>}
            {parsing && <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600"><div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div> Analyse...</div>}
          </div>

          {validationResult && !importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-2xl font-bold text-green-700 dark:text-green-300">{validationResult.valid.length}</span></div><p className="text-sm text-green-600 mt-1">Prêts à importer</p></div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center"><span className="text-lg font-bold text-blue-700">{validationResult.valid.filter(m => m.has_phone).length}</span><p className="text-xs text-blue-600">Avec téléphone</p></div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center"><span className="text-lg font-bold text-orange-700">{validationResult.valid.filter(m => !m.has_phone).length}</span><p className="text-xs text-orange-600">Sans téléphone</p></div>
              </div>
              {validationResult.valid.length > 0 && (<div><button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-sm font-medium text-blue-600">{showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}<Users className="w-4 h-4" /> Aperçu ({validationResult.valid.length})</button>
                {showPreview && (<div className="mt-3 space-y-3"><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                  <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"><table className="w-full text-xs"><thead className="bg-gray-50 dark:bg-gray-700 sticky top-0"><tr>{['Entreprise','Email','Gérant','Ville','Tél','SIRET'].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-700">{filteredValid.slice(0,100).map((m,i)=><tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{m.company_name}</td><td className="px-3 py-2 text-gray-600 dark:text-gray-300">{m.email}</td><td className="px-3 py-2 text-gray-600 dark:text-gray-300">{`${m.manager_firstname} ${m.manager_lastname}`.trim()||'—'}</td><td className="px-3 py-2 text-gray-600 dark:text-gray-300">{m.city||'—'}</td><td className={`px-3 py-2 ${m.has_phone ? 'text-gray-600 dark:text-gray-300' : 'text-orange-500 italic'}`}>{m.phone||m.mobile||'Aucun'}</td><td className="px-3 py-2 text-gray-500 font-mono">{m.siret}</td></tr>)}</tbody></table>{filteredValid.length>100&&<p className="text-center text-xs text-gray-500 py-2">... et {filteredValid.length-100} de plus</p>}</div></div>)}</div>)}
              {validationResult.rejected.length > 0 && (<div><button onClick={() => setShowRejected(!showRejected)} className="flex items-center gap-2 text-sm font-medium text-red-600">{showRejected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}<AlertTriangle className="w-4 h-4" /> Rejetés ({validationResult.rejected.length})</button>
                {showRejected && (<div className="mt-3 space-y-3"><div className="max-h-48 overflow-auto border border-red-200 rounded-lg"><table className="w-full text-xs"><thead className="bg-red-50 sticky top-0"><tr>{['#','Email','Raison sociale','Raison du rejet'].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-red-700">{h}</th>)}</tr></thead><tbody className="divide-y divide-red-100">{validationResult.rejected.map((r,i)=><tr key={i}><td className="px-3 py-2 text-gray-500">{i+1}</td><td className="px-3 py-2 text-gray-700">{r.row.EMAIL||'—'}</td><td className="px-3 py-2 text-gray-700">{r.row.RAISON_SOCIALE||'—'}</td><td className="px-3 py-2 text-red-600 font-medium">{r.reasons.join(', ')}</td></tr>)}</tbody></table></div>
                  <button onClick={() => exportRejectedToExcel(validationResult.rejected)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"><Download className="w-4 h-4" /> Télécharger les rejetés (.xlsx)</button></div>)}</div>)}
            </div>
          )}

          {importResult && (<div className="space-y-3">
            {importResult.success > 0 && <div className="bg-green-50 border border-green-200 rounded-lg p-4"><div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /><div><p className="font-semibold text-green-900">{importResult.success} prospect(s) importé(s)</p>{importResult.duplicates > 0 && <p className="text-sm text-green-700 mt-1">{importResult.duplicates} doublon(s) ignoré(s)</p>}<p className="text-sm text-green-600 mt-2">→ Les prospects avec téléphone sont dans "À appeler". Les prospects sans téléphone sont dans "Sans téléphone" pour envoi d'emails.</p></div></div></div>}
            {importResult.success === 0 && importResult.duplicates > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" /><div><p className="font-semibold text-yellow-900">Aucun nouveau prospect</p><p className="text-sm text-yellow-700 mt-1">{importResult.duplicates} doublon(s) — tous existent déjà.</p></div></div></div>}
            {importResult.errors.length > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /><div><p className="font-semibold text-red-900 mb-2">Erreurs</p>{importResult.errors.map((e,i)=><p key={i} className="text-sm text-red-800">• {e}</p>)}</div></div></div>}
          </div>)}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg" disabled={importing}>{importResult ? 'Fermer' : 'Annuler'}</button>
            {validationResult && !importResult && validationResult.valid.length > 0 && (
              <button onClick={handleImport} disabled={importing} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {importing ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Import en cours...</> : <><Upload className="w-4 h-4" /> Importer {validationResult.valid.length} prospect(s)</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
