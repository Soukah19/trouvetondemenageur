import jsPDF from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// =============================================================================
// Import the fixed "Document Client" PDF as a static asset.
//
// Step 1: Place DOCUMENT_FINAL_SITE.pdf in your src/assets/ folder
// Step 2: This import gives you the URL to the file (Vite/CRA both support this)
//
// For Vite:   works out of the box with ?url suffix if needed
// For CRA:    works out of the box for files in src/
// =============================================================================
// import CLIENT_DOC_PDF from '@/assets/DOCUMENT_FINAL_SITE.pdf';

// =============================================================================
// If the above import doesn't work with your bundler, try one of these:
//
// Vite alternative:
  import CLIENT_DOC_PDF from '../assets/DOCUMENT_FINAL_SITE.pdf?url';
//
// Or place it in public/ and use:
//   const CLIENT_DOC_PDF = '/DOCUMENT_FINAL_SITE.pdf';
//
// TypeScript declaration (add to src/vite-env.d.ts or a global .d.ts):
//   declare module '*.pdf' {
//     const src: string;
//     export default src;
//   }
// =============================================================================

interface ContractPDFData {
  contractId?: string;
  contractNumber?: string;
  createdAt: string;
  status: string;
  contractType?: 'client' | 'mover';
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  moverCompanyName: string;
  moverSiret?: string;
  moverManagerName?: string;
  moverEmail?: string;
  moverPhone?: string;
  moverAddress?: string;
  moverCompanyEmail?: string;
  moverCompanyPhone?: string;
  moverCity?: string;
  moverPostalCode?: string;
  moverDescription?: string;
  moverServices?: string[];
  moverCoverageArea?: string[];
  movingDate: string;
  fromAddress?: string;
  fromCity: string;
  fromPostalCode?: string;
  fromFloor?: number;
  fromElevator?: boolean;
  toAddress?: string;
  toCity: string;
  toPostalCode?: string;
  toFloor?: number;
  toElevator?: boolean;
  homeSize?: string;
  homeType?: string;
  volumeM3?: number;
  distanceKm?: number;
  services?: string[];
  totalAmount: number;
  moverPrice?: number;
  depositAmount: number;
  remainingAmount: number;
  guaranteeAmount?: number;
  furnitureInventory?: Array<{
    name: string;
    quantity: number;
    volume_unitaire?: number;
    volume_total?: number;
  }>;
  additionalInfo?: string;
}

// ── Colors ──
const COLORS = {
  primary: [76, 175, 80] as [number, number, number],
  primaryDark: [56, 142, 60] as [number, number, number],
  headerBg: [76, 175, 80] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  mediumGray: [200, 200, 200] as [number, number, number],
  darkText: [33, 33, 33] as [number, number, number],
  lightText: [117, 117, 117] as [number, number, number],
  tableBorder: [224, 224, 224] as [number, number, number],
};

// ── Helpers ──
function formatDate(dateStr: string): string {
  try {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr || 'N/A'; }
}

function formatDateLong(dateStr: string): string {
  try {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr || 'N/A'; }
}

function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function safe(value: any, fallback: string = 'Non renseigné'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return fallback;
  const str = String(value);
  if (str === 'null' || str === 'undefined') return fallback;
  return str;
}

function safeNumber(value: any, fallback: string = 'N/A'): string {
  if (value === null || value === undefined || isNaN(Number(value))) return fallback;
  return String(value);
}

function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Returns contract PDF as base64 string (for email attachments)
export async function getContractPDFBase64(data: ContractPDFData): Promise<string> {
  if (data.contractType === 'mover') {
    return getMoverPDFBase64(data);
  } else {
    return await getClientDocumentPDFBase64(data);
  }
}

async function getClientDocumentPDFBase64(data: ContractPDFData): Promise<string> {
  const contractNumber = data.contractNumber || `TTD-${(data.contractId || Date.now().toString(36)).substring(0, 8).toUpperCase()}`;
  const response = await fetch(CLIENT_DOC_PDF);
  const basePdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(basePdfBytes);
  const recapBytes = buildRecapPages(data, contractNumber);
  const recapPdf = await PDFDocument.load(recapBytes);
  const copiedPages = await pdfDoc.copyPages(recapPdf, recapPdf.getPageIndices());
  copiedPages.forEach((page) => pdfDoc.addPage(page));
  const totalPages = pdfDoc.getPageCount();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width } = page.getSize();
    page.drawText(`${i + 1}/${totalPages}`, { x: width - 50, y: 12, size: 7, font: helvetica, color: rgb(0.46, 0.46, 0.46) });
  }
  const finalBytes = await pdfDoc.save();
  return uint8ToBase64(finalBytes);
}

function getMoverPDFBase64(data: ContractPDFData): string {
  // We generate the mover PDF to a data URI and extract base64
  // This piggybacks on jsPDF's output method
  const result = generateMoverPDFToDoc(data);
  return result.output('datauristring').split(',')[1];
}

// =============================================================================
// MAIN EXPORT — async because client path merges PDFs
// =============================================================================
export async function generateContractPDF(data: ContractPDFData): Promise<void> {
  if (data.contractType === 'mover') {
    generateMoverPDF(data);
  } else {
    await generateClientDocumentPDF(data);
  }
}

// =============================================================================
// CLIENT DOCUMENT PDF
// = Your fixed DOCUMENT_FINAL_SITE.pdf (imported as static asset, untouched)
// + "Données Récapitulatives" page(s) appended with contract-specific data
// =============================================================================
async function generateClientDocumentPDF(data: ContractPDFData): Promise<void> {
  const contractNumber =
    data.contractNumber || `TTD-${(data.contractId || Date.now().toString(36)).substring(0, 8).toUpperCase()}`;

  // 1. Fetch the imported static PDF asset
  const response = await fetch(CLIENT_DOC_PDF);
  const basePdfBytes = await response.arrayBuffer();

  // 2. Load it into pdf-lib
  const pdfDoc = await PDFDocument.load(basePdfBytes);

  // 3. Build the dynamic recap page(s) with jsPDF
  const recapBytes = buildRecapPages(data, contractNumber);

  // 4. Copy recap pages into the base document
  const recapPdf = await PDFDocument.load(recapBytes);
  const copiedPages = await pdfDoc.copyPages(recapPdf, recapPdf.getPageIndices());
  copiedPages.forEach((page) => pdfDoc.addPage(page));

  // 5. Add unified page numbers across the entire merged document
  const totalPages = pdfDoc.getPageCount();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width } = page.getSize();
    page.drawText(`${i + 1}/${totalPages}`, {
      x: width - 50,
      y: 12,
      size: 7,
      font: helvetica,
      color: rgb(0.46, 0.46, 0.46),
    });
  }

  // 6. Save & trigger download
  const finalBytes = await pdfDoc.save();
  downloadPdf(finalBytes, `Document_Client_${contractNumber}.pdf`);
}

// =============================================================================
// Build "DONNÉES RÉCAPITULATIVES" page(s) → returns ArrayBuffer
// =============================================================================
function buildRecapPages(data: ContractPDFData, contractNumber: string): ArrayBuffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;
  const colMid = margin + contentWidth / 2;

  // ────────── HEADER ──────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('DONNÉES RÉCAPITULATIVES', pageWidth / 2, y + 8, { align: 'center' });
  y += 16;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightText);
  doc.text(`Contrat N° ${contractNumber}  —  Créé le ${formatDate(data.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(`Date du déménagement : ${formatDateLong(data.movingDate)}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ────────── INFORMATIONS CLIENT ──────────
  y = drawSectionHeader(doc, 'INFORMATIONS CLIENT', margin, y, contentWidth);
  y += 2;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.darkText);
  doc.text(`Nom : ${safe(data.clientName, 'N/A')}`, margin + 4, y + 6);
  doc.text(`Téléphone : ${safe(data.clientPhone)}`, margin + 4, y + 12);
  doc.text(`Email : ${safe(data.clientEmail)}`, colMid + 4, y + 6);
  doc.text(`Date déménagement : ${formatDate(data.movingDate)}`, colMid + 4, y + 12);
  doc.line(colMid, y, colMid, y + 22);
  y += 28;

  // ────────── INFORMATIONS DU DÉMÉNAGEUR ──────────
  y = drawSectionHeader(doc, 'INFORMATIONS DU DÉMÉNAGEUR', margin, y, contentWidth);
  y += 2;
  const moverBoxH = 28;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.rect(margin, y, contentWidth, moverBoxH);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(`Société : ${safe(data.moverCompanyName, 'N/A')}`, margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`SIRET : ${safe(data.moverSiret)}`, margin + 4, y + 12);
  doc.text(`Adresse : ${safe(data.moverAddress)}`, margin + 4, y + 18);
  const cityLine = [safe(data.moverPostalCode, ''), safe(data.moverCity, '')].filter(Boolean).join(' ').trim();
  if (cityLine) doc.text(cityLine, margin + 4, y + 24);
  doc.text(`Responsable : ${safe(data.moverManagerName)}`, colMid + 4, y + 6);
  doc.text(`Tél. : ${safe(data.moverPhone)}`, colMid + 4, y + 12);
  doc.text(`Email : ${safe(data.moverCompanyEmail || data.moverEmail)}`, colMid + 4, y + 18);
  doc.line(colMid, y, colMid, y + moverBoxH);
  y += moverBoxH + 6;

  // ────────── CONFIGURATION DES LIEUX ──────────
  y = drawSectionHeader(doc, 'CONFIGURATION DES LIEUX', margin, y, contentWidth);
  y += 2;

  if (data.distanceKm && !isNaN(Number(data.distanceKm))) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkText);
    doc.text(`DISTANCE ESTIMÉE : ${Math.round(Number(data.distanceKm)).toLocaleString('fr-FR')} km`, margin + 4, y + 5);
    y += 8;
  }

  const halfW = (contentWidth - 4) / 2;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.rect(margin, y, halfW, 36);
  doc.rect(margin + halfW + 4, y, halfW, 36);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('LIEU DE DÉPART :', margin + 4, y + 6);
  doc.text("LIEU D'ARRIVÉE :", margin + halfW + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.darkText);

  let lY = y + 11;
  doc.text(`Ville : ${safe(data.fromCity, 'N/A')}`, margin + 4, lY);
  doc.text(`Code postal : ${safe(data.fromPostalCode, 'N/A')}`, margin + 4, lY + 5);
  const fAddr = doc.splitTextToSize(`Adresse : ${safe(data.fromAddress, 'N/A')}`, halfW - 8);
  doc.text(fAddr[0] || '', margin + 4, lY + 10);
  doc.text(`Étage : ${data.fromFloor != null ? data.fromFloor : 'RDC'}`, margin + 4, lY + 15);
  doc.text(`Ascenseur : ${data.fromElevator === true ? 'Oui' : data.fromElevator === false ? 'Non' : 'N/A'}`, margin + 4, lY + 20);

  const rX = margin + halfW + 8;
  doc.text(`Ville : ${safe(data.toCity, 'N/A')}`, rX, y + 11);
  doc.text(`Code postal : ${safe(data.toPostalCode, 'N/A')}`, rX, y + 16);
  const tAddr = doc.splitTextToSize(`Adresse : ${safe(data.toAddress, 'N/A')}`, halfW - 8);
  doc.text(tAddr[0] || '', rX, y + 21);
  doc.text(`Étage : ${data.toFloor != null ? data.toFloor : 'RDC'}`, rX, y + 26);
  doc.text(`Ascenseur : ${data.toElevator === true ? 'Oui' : data.toElevator === false ? 'Non' : 'N/A'}`, rX, y + 31);
  y += 42;

  // ────────── RÉSUMÉ ──────────
  y = drawSectionHeader(doc, 'RÉSUMÉ', margin, y, contentWidth);
  y += 2;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.rect(margin, y, contentWidth, 14);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText);
  const tw = contentWidth / 3;
  doc.text(`Volume total : ${safeNumber(data.volumeM3)} m³`, margin + 4, y + 6);
  doc.text(`Type : ${safe(data.homeSize, 'N/A')}${data.homeType ? ` - ${data.homeType}` : ''}`, margin + tw + 4, y + 6);
  const svcs = (data.services || []).filter((s) => s && s !== 'null' && s !== 'undefined');
  doc.text(`Services : ${svcs.length}`, margin + tw * 2 + 4, y + 6);
  if (svcs.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.lightText);
    doc.text(svcs.join(', '), margin + 4, y + 11);
  }
  y += 20;

  // ────────── INFORMATIONS COMPLÉMENTAIRES ──────────
  if (data.additionalInfo && data.additionalInfo.trim() && data.additionalInfo !== 'null' && data.additionalInfo !== 'undefined') {
    if (y > 250) { doc.addPage(); y = 15; }
    y = drawSectionHeader(doc, 'INFORMATIONS COMPLÉMENTAIRES / PIÈCES', margin, y, contentWidth);
    y += 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.darkText);
    const infoLines = doc.splitTextToSize(data.additionalInfo, contentWidth - 8);
    const infoH = Math.max(infoLines.length * 4.5 + 6, 14);
    doc.setDrawColor(...COLORS.mediumGray);
    doc.rect(margin, y, contentWidth, infoH);
    doc.text(infoLines, margin + 4, y + 6);
    y += infoH + 6;
  }

  // ────────── INVENTAIRE ──────────
  if (data.furnitureInventory && data.furnitureInventory.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    y = drawSectionHeader(doc, 'INVENTAIRE', margin, y, contentWidth);
    y += 2;
    const cols = [
      { label: 'ARTICLE', x: margin, w: contentWidth * 0.45 },
      { label: 'QTÉ', x: margin + contentWidth * 0.45, w: contentWidth * 0.12 },
      { label: 'VOL.U', x: margin + contentWidth * 0.57, w: contentWidth * 0.15 },
      { label: 'VOL.T', x: margin + contentWidth * 0.72, w: contentWidth * 0.15 },
    ];

    const drawTableHeader = () => {
      doc.setFillColor(...COLORS.headerBg);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.headerText);
      cols.forEach((c) => doc.text(c.label, c.x + 3, y + 5));
      y += 7;
    };

    drawTableHeader();
    doc.setFont('helvetica', 'normal');

    data.furnitureInventory.forEach((item, idx) => {
      if (y > 275) { doc.addPage(); y = 15; drawTableHeader(); doc.setFont('helvetica', 'normal'); }
      if (idx % 2 === 0) { doc.setFillColor(...COLORS.lightGray); doc.rect(margin, y, contentWidth, 7, 'F'); }
      doc.setDrawColor(...COLORS.tableBorder);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.darkText);
      doc.text(safe(item.name, 'N/A'), cols[0].x + 3, y + 5);
      doc.text(String(item.quantity || 0), cols[1].x + 3, y + 5);
      doc.text(item.volume_unitaire != null && !isNaN(item.volume_unitaire) ? item.volume_unitaire.toFixed(2) : '—', cols[2].x + 3, y + 5);
      doc.text(item.volume_total != null && !isNaN(item.volume_total) ? item.volume_total.toFixed(2) : '—', cols[3].x + 3, y + 5);
      y += 7;
    });

    doc.setFillColor(...COLORS.headerBg);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.headerText);
    doc.setFontSize(8);
    doc.text('TOTAL', margin + 3, y + 5);
    const totV = data.furnitureInventory.reduce((s, i) => s + (i.volume_total || 0), 0);
    const totQ = data.furnitureInventory.reduce((s, i) => s + (i.quantity || 0), 0);
    doc.text(`${totQ} obj`, cols[1].x + 3, y + 5);
    doc.text(`${totV.toFixed(2)} m³`, cols[3].x + 3, y + 5);
    y += 12;
  }

  // ────────── INFORMATIONS FINANCIÈRES ──────────
  if (y > 220) { doc.addPage(); y = 15; }

  y = drawSectionHeader(doc, 'INFORMATIONS FINANCIÈRES', margin, y, contentWidth);
  y += 2;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 32);
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, 3, 32, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.darkText);
  doc.text('Montant total TTC :', margin + 8, y + 8);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(formatCurrency(data.totalAmount), margin + 75, y + 8);

  doc.setTextColor(...COLORS.darkText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Commission plateforme :', margin + 8, y + 16);
  doc.text(formatCurrency(data.depositAmount), margin + 75, y + 16);
  doc.text('À régler au déménageur le jour J :', margin + 8, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.remainingAmount), margin + 75, y + 22);

  y += 38;

  // ────────── FOOTER ──────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, 285, pageWidth - margin, 285);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightText);
    doc.text('Données récapitulatives — TrouveTonDéménageur.fr', pageWidth / 2, 289, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

// =============================================================================
// MOVER PDF — "Lettre de mission" (100% unchanged from original)
// =============================================================================
function generateMoverPDF(data: ContractPDFData): void {
  const doc = generateMoverPDFToDoc(data);
  const contractNumber = data.contractNumber || `TTD-${(data.contractId || Date.now().toString(36)).substring(0, 8).toUpperCase()}`;
  doc.save(`Contrat_${contractNumber}.pdf`);
}

function generateMoverPDFToDoc(data: ContractPDFData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  const contractNumber = data.contractNumber || `TTD-${(data.contractId || Date.now().toString(36)).substring(0, 8).toUpperCase()}`;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('Lettre de mission', pageWidth / 2, y + 8, { align: 'center' });
  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightText);
  doc.text(`Contrat N° ${contractNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Date de création: ${formatDate(data.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const colMid = margin + contentWidth / 2;

  y = drawSectionHeader(doc, 'INFORMATIONS CLIENT', margin, y, contentWidth);
  y += 2;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.darkText);
  doc.text(`Nom: ${safe(data.clientName, 'N/A')}`, margin + 4, y + 6);
  doc.text(`Date déménagement: ${formatDate(data.movingDate)}`, margin + 4, y + 12);
  doc.text(`Téléphone: ${safe(data.clientPhone)}`, colMid + 4, y + 6);
  doc.text(`Email: ${safe(data.clientEmail)}`, colMid + 4, y + 12);
  doc.setDrawColor(...COLORS.mediumGray);
  doc.line(colMid, y, colMid, y + 22);
  y += 28;

  y = drawSectionHeader(doc, 'INFORMATIONS DU DÉMÉNAGEUR', margin, y, contentWidth);
  y += 2;
  const moverBoxHeight = 28;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.rect(margin, y, contentWidth, moverBoxHeight);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(`Société: ${safe(data.moverCompanyName, 'N/A')}`, margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`SIRET: ${safe(data.moverSiret)}`, margin + 4, y + 12);
  doc.text(`Adresse: ${safe(data.moverAddress)}`, margin + 4, y + 18);
  const cityLine = [safe(data.moverPostalCode, ''), safe(data.moverCity, '')].filter(Boolean).join(' ').trim();
  if (cityLine) doc.text(cityLine, margin + 4, y + 24);
  doc.text(`Responsable: ${safe(data.moverManagerName)}`, colMid + 4, y + 6);
  doc.text(`Tél.: ${safe(data.moverPhone)}`, colMid + 4, y + 12);
  doc.text(`Email: ${safe(data.moverCompanyEmail || data.moverEmail)}`, colMid + 4, y + 18);
  doc.line(colMid, y, colMid, y + moverBoxHeight);
  y += moverBoxHeight + 6;

  const moverSvcs = (data.moverServices || []).filter(s => s && s !== 'null');
  if (moverSvcs.length > 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(...COLORS.lightText);
    const sLines = doc.splitTextToSize(`Services proposés: ${moverSvcs.join(', ')}`, contentWidth - 8);
    doc.text(sLines, margin + 4, y);
    y += sLines.length * 3.5 + 4;
  }

  const coverageAreas = (data.moverCoverageArea || []).filter(s => s && s !== 'null');
  if (coverageAreas.length > 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(...COLORS.lightText);
    const cLines = doc.splitTextToSize(`Zones couvertes: ${coverageAreas.join(', ')}`, contentWidth - 8);
    doc.text(cLines, margin + 4, y);
    y += cLines.length * 3.5 + 4;
  }

  y = drawSectionHeader(doc, 'CONFIGURATION DES LIEUX', margin, y, contentWidth);
  y += 2;
  if (data.distanceKm && !isNaN(Number(data.distanceKm))) {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.darkText);
    doc.text(`DISTANCE ESTIMÉE: ${Math.round(Number(data.distanceKm)).toLocaleString('fr-FR')} km`, margin + 4, y + 5);
    y += 8;
  }
  const halfWidth = (contentWidth - 4) / 2;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.rect(margin, y, halfWidth, 36);
  doc.rect(margin + halfWidth + 4, y, halfWidth, 36);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primaryDark);
  doc.text('LIEU DE DÉPART:', margin + 4, y + 6);
  doc.text("LIEU D'ARRIVÉE:", margin + halfWidth + 8, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...COLORS.darkText);

  let leftY = y + 11;
  doc.text(`Ville: ${safe(data.fromCity, 'N/A')}`, margin + 4, leftY);
  doc.text(`Code postal: ${safe(data.fromPostalCode, 'N/A')}`, margin + 4, leftY + 5);
  const fromAddr = doc.splitTextToSize(`Adresse: ${safe(data.fromAddress, 'N/A')}`, halfWidth - 8);
  doc.text(fromAddr[0] || '', margin + 4, leftY + 10);
  doc.text(`Étage: ${data.fromFloor != null ? data.fromFloor : 'RDC'}`, margin + 4, leftY + 15);
  doc.text(`Ascenseur: ${data.fromElevator === true ? 'Oui' : data.fromElevator === false ? 'Non' : 'N/A'}`, margin + 4, leftY + 20);

  const rightX = margin + halfWidth + 8;
  doc.text(`Ville: ${safe(data.toCity, 'N/A')}`, rightX, y + 11);
  doc.text(`Code postal: ${safe(data.toPostalCode, 'N/A')}`, rightX, y + 16);
  const toAddr = doc.splitTextToSize(`Adresse: ${safe(data.toAddress, 'N/A')}`, halfWidth - 8);
  doc.text(toAddr[0] || '', rightX, y + 21);
  doc.text(`Étage: ${data.toFloor != null ? data.toFloor : 'RDC'}`, rightX, y + 26);
  doc.text(`Ascenseur: ${data.toElevator === true ? 'Oui' : data.toElevator === false ? 'Non' : 'N/A'}`, rightX, y + 31);
  y += 42;

  y = drawSectionHeader(doc, 'RÉSUMÉ', margin, y, contentWidth);
  y += 2;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.rect(margin, y, contentWidth, 14);
  doc.setFontSize(9); doc.setTextColor(...COLORS.darkText);
  const thirdWidth = contentWidth / 3;
  doc.text(`Volume total: ${safeNumber(data.volumeM3)} m³`, margin + 4, y + 6);
  doc.text(`Type: ${safe(data.homeSize, 'N/A')}${data.homeType ? ` - ${data.homeType}` : ''}`, margin + thirdWidth + 4, y + 6);
  const cleanServices = (data.services || []).filter(s => s && s !== 'null' && s !== 'undefined');
  doc.text(`Services: ${cleanServices.length}`, margin + thirdWidth * 2 + 4, y + 6);
  if (cleanServices.length > 0) {
    doc.setFontSize(8); doc.setTextColor(...COLORS.lightText);
    doc.text(cleanServices.join(', '), margin + 4, y + 11);
  }
  y += 20;

  if (data.additionalInfo && data.additionalInfo.trim() && data.additionalInfo !== 'null' && data.additionalInfo !== 'undefined') {
    if (y > 250) { doc.addPage(); y = 15; }
    y = drawSectionHeader(doc, 'INFORMATIONS COMPLÉMENTAIRES / PIÈCES', margin, y, contentWidth);
    y += 2;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkText);
    const infoLines = doc.splitTextToSize(data.additionalInfo, contentWidth - 8);
    doc.setDrawColor(...COLORS.mediumGray);
    const infoHeight = Math.max(infoLines.length * 4.5 + 6, 14);
    doc.rect(margin, y, contentWidth, infoHeight);
    doc.text(infoLines, margin + 4, y + 6);
    y += infoHeight + 6;
  }

  if (data.furnitureInventory && data.furnitureInventory.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    y = drawSectionHeader(doc, 'INVENTAIRE', margin, y, contentWidth);
    y += 2;
    const cols = [
      { label: 'ARTICLE', x: margin, width: contentWidth * 0.45 },
      { label: 'QTÉ', x: margin + contentWidth * 0.45, width: contentWidth * 0.12 },
      { label: 'VOL.U', x: margin + contentWidth * 0.57, width: contentWidth * 0.15 },
      { label: 'VOL.T', x: margin + contentWidth * 0.72, width: contentWidth * 0.15 },
    ];
    doc.setFillColor(...COLORS.headerBg);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.headerText);
    cols.forEach(col => doc.text(col.label, col.x + 3, y + 5));
    y += 7;
    doc.setFont('helvetica', 'normal');
    data.furnitureInventory.forEach((item, idx) => {
      if (y > 275) {
        doc.addPage(); y = 15;
        doc.setFillColor(...COLORS.headerBg);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.headerText);
        cols.forEach(col => doc.text(col.label, col.x + 3, y + 5));
        y += 7; doc.setFont('helvetica', 'normal');
      }
      if (idx % 2 === 0) { doc.setFillColor(...COLORS.lightGray); doc.rect(margin, y, contentWidth, 7, 'F'); }
      doc.setDrawColor(...COLORS.tableBorder); doc.setLineWidth(0.1);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);
      doc.setFontSize(8); doc.setTextColor(...COLORS.darkText);
      doc.text(safe(item.name, 'N/A'), cols[0].x + 3, y + 5);
      doc.text(String(item.quantity || 0), cols[1].x + 3, y + 5);
      doc.text(item.volume_unitaire != null && !isNaN(item.volume_unitaire) ? item.volume_unitaire.toFixed(2) : '—', cols[2].x + 3, y + 5);
      doc.text(item.volume_total != null && !isNaN(item.volume_total) ? item.volume_total.toFixed(2) : '—', cols[3].x + 3, y + 5);
      y += 7;
    });
    doc.setFillColor(...COLORS.headerBg);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.headerText); doc.setFontSize(8);
    doc.text('TOTAL', margin + 3, y + 5);
    const totalVol = data.furnitureInventory.reduce((sum, item) => sum + (item.volume_total || 0), 0);
    const totalQty = data.furnitureInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    doc.text(`${totalQty} obj`, cols[1].x + 3, y + 5);
    doc.text(`${totalVol.toFixed(2)} m³`, cols[3].x + 3, y + 5);
    y += 12;
  }

  if (y > 220) { doc.addPage(); y = 15; }

  y = drawSectionHeader(doc, 'INFORMATIONS FINANCIÈRES', margin, y, contentWidth);
  y += 2;
  doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 32);
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, 3, 32, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.darkText);
  const displayAmount = data.moverPrice || Math.round(data.totalAmount / 1.3);
  doc.text('Montant de votre devis proposé:', margin + 8, y + 8);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(formatCurrency(displayAmount), margin + 75, y + 8);
  doc.setTextColor(...COLORS.darkText); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`À recevoir du client le jour J:`, margin + 8, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(displayAmount), margin + 75, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Commission plateforme (payée par le client):`, margin + 8, y + 22);
  const platformComm = Math.round(displayAmount * 1.3) - displayAmount;
  doc.text(formatCurrency(platformComm), margin + 75, y + 22);
  y += 38;

  if (y > 235) { doc.addPage(); y = 15; }
  y = drawSectionHeader(doc, 'CONDITIONS GÉNÉRALES', margin, y, contentWidth);
  y += 4;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkText);
  const conditions = [
    "1. Le présent contrat engage les deux parties dès la confirmation du paiement de la commission plateforme.",
    "2. La commission plateforme est versée via TrouveTonDéménageur pour confirmer la réservation.",
    "3. Le prix du déménageur est à régler directement au déménageur le jour du déménagement (virement ou espèces, selon accord).",
    "4. Le déménageur s'engage à effectuer le transport des biens dans les meilleures conditions de sécurité.",
    "5. Le client dispose de 48 heures après la livraison pour signaler tout dommage ou objet manquant via la plateforme.",
    "6. En cas d'annulation par le client plus de 7 jours avant la date prévue, la commission est remboursée intégralement.",
    "7. En cas d'annulation par le client moins de 7 jours avant la date prévue, des frais d'annulation peuvent s'appliquer.",
    "8. Le déménageur est tenu de respecter la date et les horaires convenus. Tout retard significatif doit être signalé.",
    "9. Les deux parties reconnaissent avoir pris connaissance des conditions générales d'utilisation de TrouveTonDéménageur.",
  ];
  conditions.forEach(condition => {
    if (y > 280) { doc.addPage(); y = 15; }
    const lines = doc.splitTextToSize(condition, contentWidth - 8);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5 + 1.5;
  });
  y += 5;

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.5);
    doc.line(margin, 285, pageWidth - margin, 285);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.lightText);
    doc.text('Ce document est un contrat de déménagement généré par TrouveTonDéménageur.fr', pageWidth / 2, 289, { align: 'center' });
    doc.text(`${i}/${totalPages}`, pageWidth - margin, 289, { align: 'right' });
  }
  return doc;
}

function drawSectionHeader(doc: jsPDF, title: string, x: number, y: number, width: number): number {
  doc.setFillColor(...COLORS.headerBg);
  doc.roundedRect(x, y, width, 8, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.headerText);
  doc.text(title, x + 4, y + 5.5);
  return y + 10;
}

// =============================================================================
// buildContractPDFData — unchanged from original
// =============================================================================
export function buildContractPDFData(contract: any, quoteRequest?: any, quote?: any, mover?: any, payment?: any, contractType: 'client' | 'mover' = 'client'): ContractPDFData {
  const moverProposedPrice = quote?.price || payment?.mover_price || 0;

  if (contract.contract_data) {
    const cd = contract.contract_data;
    return {
      contractId: contract.id,
      contractNumber: contract.contract_number || cd.contract_number,
      createdAt: contract.created_at,
      status: contract.status || 'active',
      contractType,
      clientName: cd.client?.name || quoteRequest?.client_name || '',
      clientEmail: cd.client?.email || quoteRequest?.client_email || '',
      clientPhone: cd.client?.phone || quoteRequest?.client_phone || '',
      moverCompanyName: mover?.company_name || cd.mover?.company_name || '',
      moverSiret: mover?.siret || cd.mover?.siret || '',
      moverManagerName: mover ? `${mover.manager_firstname || ''} ${mover.manager_lastname || ''}`.trim() : (cd.mover?.manager_name || ''),
      moverEmail: mover?.email || cd.mover?.email || '',
      moverPhone: mover?.manager_phone || mover?.phone || cd.mover?.phone || '',
      moverAddress: mover?.address || cd.mover?.address || '',
      moverCity: mover?.city || '',
      moverPostalCode: mover?.postal_code || '',
      moverCompanyEmail: mover?.email || cd.mover?.company_email || cd.mover?.email || '',
      moverCompanyPhone: mover?.phone || cd.mover?.company_phone || cd.mover?.phone || '',
      moverDescription: mover?.description || '',
      moverServices: mover?.services || [],
      moverCoverageArea: mover?.coverage_area || [],
      movingDate: cd.moving_date || quoteRequest?.moving_date || '',
      fromAddress: cd.departure?.address || quoteRequest?.from_address || '',
      fromCity: cd.departure?.city || quoteRequest?.from_city || '',
      fromPostalCode: cd.departure?.postal_code || quoteRequest?.from_postal_code || '',
      fromFloor: cd.departure?.floor ?? quoteRequest?.floor_from,
      fromElevator: cd.departure?.elevator ?? quoteRequest?.elevator_from,
      toAddress: cd.arrival?.address || quoteRequest?.to_address || '',
      toCity: cd.arrival?.city || quoteRequest?.to_city || '',
      toPostalCode: cd.arrival?.postal_code || quoteRequest?.to_postal_code || '',
      toFloor: cd.arrival?.floor ?? quoteRequest?.floor_to,
      toElevator: cd.arrival?.elevator ?? quoteRequest?.elevator_to,
      homeSize: cd.home_size || quoteRequest?.home_size || '',
      homeType: cd.home_type || quoteRequest?.home_type || '',
      volumeM3: cd.volume_m3 ?? quoteRequest?.volume_m3,
      distanceKm: quoteRequest?.distance_km,
      services: cd.services || quoteRequest?.services_needed || [],
      totalAmount: payment?.total_amount || cd.financial?.total_amount || 0,
      moverPrice: moverProposedPrice || cd.financial?.mover_price || Math.round((payment?.total_amount || cd.financial?.total_amount || 0) / 1.3),
      depositAmount: payment?.deposit_amount || cd.financial?.deposit_amount || 0,
      remainingAmount: payment?.remaining_amount || cd.financial?.remaining_amount || 0,
      guaranteeAmount: payment?.guarantee_amount,
      furnitureInventory: quoteRequest?.furniture_inventory,
      additionalInfo: quoteRequest?.additional_info || cd.additional_info || '',
    };
  }

  return {
    contractId: contract.id,
    contractNumber: contract.contract_number,
    createdAt: contract.created_at,
    status: contract.status || 'active',
    contractType,
    clientName: quoteRequest?.client_name || '',
    clientEmail: quoteRequest?.client_email || '',
    clientPhone: quoteRequest?.client_phone || '',
    moverCompanyName: mover?.company_name || '',
    moverSiret: mover?.siret || '',
    moverManagerName: mover ? `${mover.manager_firstname || ''} ${mover.manager_lastname || ''}`.trim() : '',
    moverEmail: mover?.email || '',
    moverPhone: mover?.manager_phone || mover?.phone || '',
    moverAddress: mover?.address || '',
    moverCity: mover?.city || '',
    moverPostalCode: mover?.postal_code || '',
    moverCompanyEmail: mover?.email || '',
    moverCompanyPhone: mover?.phone || '',
    moverDescription: mover?.description || '',
    moverServices: mover?.services || [],
    moverCoverageArea: mover?.coverage_area || [],
    movingDate: quoteRequest?.moving_date || '',
    fromAddress: quoteRequest?.from_address || '',
    fromCity: quoteRequest?.from_city || '',
    fromPostalCode: quoteRequest?.from_postal_code || '',
    fromFloor: quoteRequest?.floor_from,
    fromElevator: quoteRequest?.elevator_from,
    toAddress: quoteRequest?.to_address || '',
    toCity: quoteRequest?.to_city || '',
    toPostalCode: quoteRequest?.to_postal_code || '',
    toFloor: quoteRequest?.floor_to,
    toElevator: quoteRequest?.elevator_to,
    homeSize: quoteRequest?.home_size || '',
    homeType: quoteRequest?.home_type || '',
    volumeM3: quoteRequest?.volume_m3,
    distanceKm: quoteRequest?.distance_km,
    services: quoteRequest?.services_needed,
    totalAmount: payment?.total_amount || quote?.client_display_price || 0,
    moverPrice: moverProposedPrice || Math.round((payment?.total_amount || quote?.client_display_price || 0) / 1.3),
    depositAmount: payment?.deposit_amount || payment?.amount_paid || 0,
    remainingAmount: payment?.remaining_amount || 0,
    guaranteeAmount: payment?.guarantee_amount,
    furnitureInventory: quoteRequest?.furniture_inventory,
    additionalInfo: quoteRequest?.additional_info || '',
  };
}