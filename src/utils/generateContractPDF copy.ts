import jsPDF from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// =============================================================================
// Import the fixed "Document Client" PDF as a static asset.
// Place DOCUMENT_FINAL_SITE.pdf in src/assets/
//
// TypeScript declaration (add to vite-env.d.ts or a global .d.ts):
//   declare module '*.pdf' {
//     const src: string;
//     export default src;
//   }
// =============================================================================
  import CLIENT_DOC_PDF from '../assets/DOCUMENT_FINAL_SITE.pdf?url';

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

// ── Mover PDF colors (green theme, unchanged) ──
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

// =============================================================================
// MAIN EXPORT
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
// =============================================================================
async function generateClientDocumentPDF(data: ContractPDFData): Promise<void> {
  const contractNumber =
    data.contractNumber || `TTD-${(data.contractId || Date.now().toString(36)).substring(0, 8).toUpperCase()}`;

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
    page.drawText(`${i + 1}/${totalPages}`, {
      x: width - 50,
      y: 12,
      size: 7,
      font: helvetica,
      color: rgb(0.46, 0.46, 0.46),
    });
  }

  const finalBytes = await pdfDoc.save();
  downloadPdf(finalBytes, `Document_Client_${contractNumber}.pdf`);
}

// =============================================================================
// RECAP PAGES — matching the DOCUMENT_FINAL_SITE clean design:
//   • Black text on white background
//   • Bold section titles (no colored bars, no boxes)
//   • Simple bullet points
//   • Clean lines as separators
//   • Same font sizes & spacing as the base document
// =============================================================================
function buildRecapPages(data: ContractPDFData, contractNumber: string): ArrayBuffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  // ────────── PAGE TITLE ──────────
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DONNÉES RÉCAPITULATIVES', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Subtitle with contract info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Contrat N° ${contractNumber} — Créé le ${formatDate(data.createdAt)}`, margin, y);
  y += 6;
  doc.text(`Date du déménagement : ${formatDateLong(data.movingDate)}`, margin, y);
  y += 10;

  // ────────── 1. INFORMATIONS CLIENT ──────────
  y = recapSectionTitle(doc, '1. INFORMATIONS CLIENT', margin, y);

  y = recapLine(doc, `Nom : ${safe(data.clientName, 'N/A')}`, margin, y, contentWidth);
  y = recapLine(doc, `Email : ${safe(data.clientEmail)}`, margin, y, contentWidth);
  y = recapLine(doc, `Téléphone : ${safe(data.clientPhone)}`, margin, y, contentWidth);
  y = recapLine(doc, `Date de déménagement : ${formatDateLong(data.movingDate)}`, margin, y, contentWidth);
  y += 4;

  // ────────── 2. INFORMATIONS DU DÉMÉNAGEUR ──────────
  y = recapSectionTitle(doc, '2. INFORMATIONS DU DÉMÉNAGEUR', margin, y);

  y = recapLine(doc, `Société : ${safe(data.moverCompanyName, 'N/A')}`, margin, y, contentWidth);
  y = recapLine(doc, `SIRET : ${safe(data.moverSiret)}`, margin, y, contentWidth);
  y = recapLine(doc, `Responsable : ${safe(data.moverManagerName)}`, margin, y, contentWidth);
  y = recapLine(doc, `Téléphone : ${safe(data.moverPhone)}`, margin, y, contentWidth);
  y = recapLine(doc, `Email : ${safe(data.moverCompanyEmail || data.moverEmail)}`, margin, y, contentWidth);

  const addrParts = [safe(data.moverAddress, ''), safe(data.moverPostalCode, ''), safe(data.moverCity, '')].filter(Boolean).join(', ');
  if (addrParts) {
    y = recapLine(doc, `Adresse : ${addrParts}`, margin, y, contentWidth);
  }
  y += 4;

  // ────────── 3. CONFIGURATION DES LIEUX ──────────
  y = recapSectionTitle(doc, '3. CONFIGURATION DES LIEUX', margin, y);

  if (data.distanceKm && !isNaN(Number(data.distanceKm))) {
    y = recapLine(doc, `Distance estimée : ${Math.round(Number(data.distanceKm)).toLocaleString('fr-FR')} km`, margin, y, contentWidth);
  }

  // Departure
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Lieu de départ :', margin, y);
  y += 5;

  y = recapBullet(doc, `Ville : ${safe(data.fromCity, 'N/A')}`, margin, y, contentWidth);
  y = recapBullet(doc, `Code postal : ${safe(data.fromPostalCode, 'N/A')}`, margin, y, contentWidth);
  y = recapBullet(doc, `Adresse : ${safe(data.fromAddress, 'N/A')}`, margin, y, contentWidth);
  y = recapBullet(doc, `Étage : ${data.fromFloor != null ? data.fromFloor : 'RDC'}`, margin, y, contentWidth);
  y = recapBullet(doc, `Ascenseur : ${data.fromElevator === true ? 'Oui' : data.fromElevator === false ? 'Non' : 'N/A'}`, margin, y, contentWidth);
  y += 2;

  // Arrival
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text("Lieu d'arrivée :", margin, y);
  y += 5;

  y = recapBullet(doc, `Ville : ${safe(data.toCity, 'N/A')}`, margin, y, contentWidth);
  y = recapBullet(doc, `Code postal : ${safe(data.toPostalCode, 'N/A')}`, margin, y, contentWidth);
  y = recapBullet(doc, `Adresse : ${safe(data.toAddress, 'N/A')}`, margin, y, contentWidth);
  y = recapBullet(doc, `Étage : ${data.toFloor != null ? data.toFloor : 'RDC'}`, margin, y, contentWidth);
  y = recapBullet(doc, `Ascenseur : ${data.toElevator === true ? 'Oui' : data.toElevator === false ? 'Non' : 'N/A'}`, margin, y, contentWidth);
  y += 4;

  // ────────── 4. RÉSUMÉ DU DÉMÉNAGEMENT ──────────
  if (y > 250) { doc.addPage(); y = 25; }
  y = recapSectionTitle(doc, '4. RÉSUMÉ DU DÉMÉNAGEMENT', margin, y);

  y = recapBullet(doc, `Volume total : ${safeNumber(data.volumeM3)} m³`, margin, y, contentWidth);
  y = recapBullet(doc, `Type de logement : ${safe(data.homeSize, 'N/A')}${data.homeType ? ` — ${data.homeType}` : ''}`, margin, y, contentWidth);

  const svcs = (data.services || []).filter((s) => s && s !== 'null' && s !== 'undefined');
  if (svcs.length > 0) {
    y = recapBullet(doc, `Services : ${svcs.join(', ')}`, margin, y, contentWidth);
  } else {
    y = recapBullet(doc, `Services : Aucun`, margin, y, contentWidth);
  }
  y += 4;

  // ────────── 5. INFORMATIONS COMPLÉMENTAIRES ──────────
  if (data.additionalInfo && data.additionalInfo.trim() && data.additionalInfo !== 'null' && data.additionalInfo !== 'undefined') {
    if (y > 240) { doc.addPage(); y = 25; }
    y = recapSectionTitle(doc, '5. INFORMATIONS COMPLÉMENTAIRES', margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const infoLines = doc.splitTextToSize(data.additionalInfo, contentWidth);
    doc.text(infoLines, margin, y);
    y += infoLines.length * 4.8 + 4;
  }

  // ────────── 6. INVENTAIRE ──────────
  if (data.furnitureInventory && data.furnitureInventory.length > 0) {
    if (y > 200) { doc.addPage(); y = 25; }

    const sectionNum = data.additionalInfo && data.additionalInfo.trim() && data.additionalInfo !== 'null' ? '6' : '5';
    y = recapSectionTitle(doc, `${sectionNum}. INVENTAIRE DES BIENS`, margin, y);

    // Table header
    const colArticle = margin;
    const colQty = margin + contentWidth * 0.55;
    const colVolU = margin + contentWidth * 0.70;
    const colVolT = margin + contentWidth * 0.85;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Article', colArticle, y);
    doc.text('Qté', colQty, y);
    doc.text('Vol. unit.', colVolU, y);
    doc.text('Vol. total', colVolT, y);
    y += 2;

    // Underline header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    data.furnitureInventory.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 25;
        // Re-draw header on new page
        doc.setFont('helvetica', 'bold');
        doc.text('Article', colArticle, y);
        doc.text('Qté', colQty, y);
        doc.text('Vol. unit.', colVolU, y);
        doc.text('Vol. total', colVolT, y);
        y += 2;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + contentWidth, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
      }

      doc.setTextColor(0, 0, 0);
      const nameText = doc.splitTextToSize(safe(item.name, 'N/A'), contentWidth * 0.50);
      doc.text(nameText[0] || '', colArticle, y);
      doc.text(String(item.quantity || 0), colQty, y);
      doc.text(item.volume_unitaire != null && !isNaN(item.volume_unitaire) ? `${item.volume_unitaire.toFixed(2)} m³` : '—', colVolU, y);
      doc.text(item.volume_total != null && !isNaN(item.volume_total) ? `${item.volume_total.toFixed(2)} m³` : '—', colVolT, y);
      y += 5;
    });

    // Total row
    y += 1;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    const totQ = data.furnitureInventory.reduce((s, i) => s + (i.quantity || 0), 0);
    const totV = data.furnitureInventory.reduce((s, i) => s + (i.volume_total || 0), 0);
    doc.text('Total', colArticle, y);
    doc.text(`${totQ}`, colQty, y);
    doc.text(`${totV.toFixed(2)} m³`, colVolT, y);
    y += 8;
  }

  // ────────── INFORMATIONS FINANCIÈRES ──────────
  if (y > 220) { doc.addPage(); y = 25; }

  const finSectionNum = (() => {
    let n = 5;
    if (data.additionalInfo && data.additionalInfo.trim() && data.additionalInfo !== 'null') n++;
    if (data.furnitureInventory && data.furnitureInventory.length > 0) n++;
    return n;
  })();

  y = recapSectionTitle(doc, `${finSectionNum}. INFORMATIONS FINANCIÈRES`, margin, y);

  y = recapBullet(doc, `Montant total TTC : ${formatCurrency(data.totalAmount)}`, margin, y, contentWidth);
  y = recapBullet(doc, `Acompte versé (40%) : ${formatCurrency(data.depositAmount)}`, margin, y, contentWidth);
  y = recapBullet(doc, `Solde à régler au déménageur (60%) : ${formatCurrency(data.remainingAmount)}`, margin, y, contentWidth);

  if (data.guaranteeAmount && !isNaN(data.guaranteeAmount) && data.guaranteeAmount > 0) {
    y = recapBullet(doc, `Garantie retenue par la plateforme : ${formatCurrency(data.guaranteeAmount)}`, margin, y, contentWidth);
  }
  y += 8;

  // ────────── FOOTER ──────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Données récapitulatives — TrouveTonDéménageur.fr', pageWidth / 2, 287, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

// ── Recap page helpers (matching DOCUMENT_FINAL_SITE style) ──

function recapSectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y);
  return y + 7;
}

function recapLine(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * 4.8;
}

function recapBullet(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('•', x, y);
  const lines = doc.splitTextToSize(text, maxWidth - 6);
  doc.text(lines, x + 5, y);
  return y + lines.length * 4.8 + 1;
}

// =============================================================================
// MOVER PDF — "Lettre de mission" (100% unchanged from original)
// =============================================================================
function generateMoverPDF(data: ContractPDFData): void {
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
  const clientTotalPrice = Math.round(displayAmount * 1.3);
  const clientDirectPayment = Math.round(clientTotalPrice * 0.6);
  const guarantee = displayAmount - clientDirectPayment;
  doc.text(`Solde à recevoir du client (le jour J):`, margin + 8, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(clientDirectPayment), margin + 75, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Garantie retenue par la plateforme:`, margin + 8, y + 22);
  doc.text(formatCurrency(guarantee), margin + 75, y + 22);
  if (data.guaranteeAmount && !isNaN(data.guaranteeAmount) && data.guaranteeAmount > 0) {
    doc.text(`Garantie (10%):`, margin + 8, y + 28);
    doc.text(formatCurrency(data.guaranteeAmount), margin + 65, y + 28);
  }
  y += 38;

  if (y > 235) { doc.addPage(); y = 15; }
  y = drawSectionHeader(doc, 'CONDITIONS GÉNÉRALES', margin, y, contentWidth);
  y += 4;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkText);
  const conditions = [
    "1. Le présent contrat engage les deux parties dès la confirmation du paiement de l'acompte.",
    "2. L'acompte de 40% du montant total est versé via la plateforme TrouveTonDéménageur pour confirmer la réservation.",
    "3. Le solde (60%) est à régler directement au déménageur le jour du déménagement, avant ou après la prestation selon accord.",
    "4. Une garantie de 10% est retenue par la plateforme pendant 48h après la livraison pour couvrir d'éventuels dommages.",
    "5. Le déménageur s'engage à effectuer le transport des biens dans les meilleures conditions de sécurité.",
    "6. Le client dispose de 48 heures après la livraison pour signaler tout dommage ou objet manquant via la plateforme.",
    "7. En cas d'annulation par le client plus de 7 jours avant la date prévue, l'acompte est remboursé intégralement.",
    "8. En cas d'annulation par le client moins de 7 jours avant la date prévue, des frais d'annulation peuvent s'appliquer.",
    "9. Le déménageur est tenu de respecter la date et les horaires convenus. Tout retard significatif doit être signalé.",
    "10. Les deux parties reconnaissent avoir pris connaissance des conditions générales d'utilisation de TrouveTonDéménageur.",
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
  doc.save(`Contrat_${contractNumber}.pdf`);
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
// buildContractPDFData — unchanged
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