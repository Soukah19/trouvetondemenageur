import jsPDF from 'jspdf';

interface ContractPDFData {
  // Contract info
  contractId?: string;
  contractNumber?: string;
  createdAt: string;
  status: string;
  
  // 'client' = show client price (mover*1.3), 'mover' = show mover's proposed price only
  contractType?: 'client' | 'mover';
  
  // Client info
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  
  // Mover info
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
  
  // Moving details
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
  
  // Property
  homeSize?: string;
  homeType?: string;
  volumeM3?: number;
  distanceKm?: number;
  
  // Services
  services?: string[];
  
  // Financial
  totalAmount: number;       // Client display price (mover price * 1.3)
  moverPrice?: number;       // Mover's proposed price
  depositAmount: number;
  remainingAmount: number;
  guaranteeAmount?: number;
  
  // Inventory (optional)
  furnitureInventory?: Array<{
    name: string;
    quantity: number;
    volume_unitaire?: number;
    volume_total?: number;
  }>;
  
  // Additional info / pieces description
  additionalInfo?: string;
}

// Colors matching the green theme
const COLORS = {
  primary: [76, 175, 80],
  primaryDark: [56, 142, 60],
  headerBg: [76, 175, 80],
  headerText: [255, 255, 255],
  lightGray: [245, 245, 245],
  mediumGray: [200, 200, 200],
  darkText: [33, 33, 33],
  lightText: [117, 117, 117],
  tableBorder: [224, 224, 224],
};

function formatDate(dateStr: string): string {
  try {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr || 'N/A';
  }
}

function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/** Safely convert any value to a displayable string, avoiding "null", "undefined", "[object Object]" */
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

export function generateContractPDF(data: ContractPDFData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  const contractNumber = data.contractNumber || `TTD-${(data.contractId || Date.now().toString(36)).substring(0, 8).toUpperCase()}`;

  // ==================== HEADER ====================
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark as [number, number, number]);
  const pdfTitle = data.contractType === 'mover' ? 'CONTRAT DE DÉMÉNAGEMENT — DÉMÉNAGEUR' : 'CONTRAT DE DÉMÉNAGEMENT';
  doc.text(pdfTitle, pageWidth / 2, y + 8, { align: 'center' });
  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightText as [number, number, number]);
  doc.text(`Contrat N° ${contractNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Date de création: ${formatDate(data.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Separator line
  doc.setDrawColor(...COLORS.primary as [number, number, number]);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const colMid = margin + contentWidth / 2;

  // ==================== SECTION: INFORMATIONS CLIENT ====================
  y = drawSectionHeader(doc, 'INFORMATIONS CLIENT', margin, y, contentWidth);
  y += 2;

  doc.setDrawColor(...COLORS.mediumGray as [number, number, number]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 22);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.darkText as [number, number, number]);
  
  doc.text(`Nom: ${safe(data.clientName, 'N/A')}`, margin + 4, y + 6);
  doc.text(`Date déménagement: ${formatDate(data.movingDate)}`, margin + 4, y + 12);
  doc.text(`Téléphone: ${safe(data.clientPhone)}`, colMid + 4, y + 6);
  doc.text(`Email: ${safe(data.clientEmail)}`, colMid + 4, y + 12);
  
  doc.setDrawColor(...COLORS.mediumGray as [number, number, number]);
  doc.line(colMid, y, colMid, y + 22);
  y += 28;

  // ==================== SECTION: INFORMATIONS DU DÉMÉNAGEUR ====================
  y = drawSectionHeader(doc, 'INFORMATIONS DU DÉMÉNAGEUR', margin, y, contentWidth);
  y += 2;

  // Company info box
  const moverBoxHeight = 28;
  doc.setDrawColor(...COLORS.mediumGray as [number, number, number]);
  doc.rect(margin, y, contentWidth, moverBoxHeight);
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText as [number, number, number]);
  
  // Left column - Company details
  doc.setFont('helvetica', 'bold');
  doc.text(`Société: ${safe(data.moverCompanyName, 'N/A')}`, margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`SIRET: ${safe(data.moverSiret)}`, margin + 4, y + 12);
  doc.text(`Adresse: ${safe(data.moverAddress)}`, margin + 4, y + 18);
  const cityLine = [safe(data.moverPostalCode, ''), safe(data.moverCity, '')].filter(Boolean).join(' ').trim();
  if (cityLine) {
    doc.text(cityLine, margin + 4, y + 24);
  }
  
  // Right column - Contact details
  doc.text(`Responsable: ${safe(data.moverManagerName)}`, colMid + 4, y + 6);
  doc.text(`Tél.: ${safe(data.moverPhone)}`, colMid + 4, y + 12);
  doc.text(`Email: ${safe(data.moverCompanyEmail || data.moverEmail)}`, colMid + 4, y + 18);
  
  doc.line(colMid, y, colMid, y + moverBoxHeight);
  y += moverBoxHeight + 6;

  // Mover services (if available)
  const moverSvcs = (data.moverServices || []).filter(s => s && s !== 'null');
  if (moverSvcs.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.lightText as [number, number, number]);
    const servicesText = `Services proposés: ${moverSvcs.join(', ')}`;
    const servicesLines = doc.splitTextToSize(servicesText, contentWidth - 8);
    doc.text(servicesLines, margin + 4, y);
    y += servicesLines.length * 3.5 + 4;
  }

  // Coverage area (if available)
  const coverageAreas = (data.moverCoverageArea || []).filter(s => s && s !== 'null');
  if (coverageAreas.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.lightText as [number, number, number]);
    const coverageText = `Zones couvertes: ${coverageAreas.join(', ')}`;
    const coverageLines = doc.splitTextToSize(coverageText, contentWidth - 8);
    doc.text(coverageLines, margin + 4, y);
    y += coverageLines.length * 3.5 + 4;
  }

  // ==================== SECTION: CONFIGURATION DES LIEUX ====================
  y = drawSectionHeader(doc, 'CONFIGURATION DES LIEUX', margin, y, contentWidth);
  y += 2;

  // Distance
  if (data.distanceKm && !isNaN(Number(data.distanceKm))) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkText as [number, number, number]);
    doc.text(`DISTANCE ESTIMÉE: ${Math.round(Number(data.distanceKm)).toLocaleString('fr-FR')} km`, margin + 4, y + 5);
    y += 8;
  }

  // Two columns: departure and arrival
  const halfWidth = (contentWidth - 4) / 2;
  
  doc.setDrawColor(...COLORS.mediumGray as [number, number, number]);
  doc.rect(margin, y, halfWidth, 36);
  doc.rect(margin + halfWidth + 4, y, halfWidth, 36);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark as [number, number, number]);
  doc.text('LIEU DE DÉPART:', margin + 4, y + 6);
  doc.text("LIEU D'ARRIVÉE:", margin + halfWidth + 8, y + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.darkText as [number, number, number]);
  
  // Departure details
  let leftY = y + 11;
  doc.text(`Ville: ${safe(data.fromCity, 'N/A')}`, margin + 4, leftY);
  doc.text(`Code postal: ${safe(data.fromPostalCode, 'N/A')}`, margin + 4, leftY + 5);
  const fromAddr = doc.splitTextToSize(`Adresse: ${safe(data.fromAddress, 'N/A')}`, halfWidth - 8);
  doc.text(fromAddr[0] || '', margin + 4, leftY + 10);
  doc.text(`Étage: ${data.fromFloor != null ? data.fromFloor : 'RDC'}`, margin + 4, leftY + 15);
  doc.text(`Ascenseur: ${data.fromElevator === true ? 'Oui' : data.fromElevator === false ? 'Non' : 'N/A'}`, margin + 4, leftY + 20);
  
  // Arrival details
  const rightX = margin + halfWidth + 8;
  doc.text(`Ville: ${safe(data.toCity, 'N/A')}`, rightX, y + 11);
  doc.text(`Code postal: ${safe(data.toPostalCode, 'N/A')}`, rightX, y + 16);
  const toAddr = doc.splitTextToSize(`Adresse: ${safe(data.toAddress, 'N/A')}`, halfWidth - 8);
  doc.text(toAddr[0] || '', rightX, y + 21);
  doc.text(`Étage: ${data.toFloor != null ? data.toFloor : 'RDC'}`, rightX, y + 26);
  doc.text(`Ascenseur: ${data.toElevator === true ? 'Oui' : data.toElevator === false ? 'Non' : 'N/A'}`, rightX, y + 31);
  
  y += 42;

  // ==================== SECTION: RÉSUMÉ ====================
  y = drawSectionHeader(doc, 'RÉSUMÉ', margin, y, contentWidth);
  y += 2;

  doc.setDrawColor(...COLORS.mediumGray as [number, number, number]);
  doc.rect(margin, y, contentWidth, 14);
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText as [number, number, number]);
  
  const thirdWidth = contentWidth / 3;
  doc.text(`Volume total: ${safeNumber(data.volumeM3)} m³`, margin + 4, y + 6);
  doc.text(`Type: ${safe(data.homeSize, 'N/A')}${data.homeType ? ` - ${data.homeType}` : ''}`, margin + thirdWidth + 4, y + 6);
  
  const cleanServices = (data.services || []).filter(s => s && s !== 'null' && s !== 'undefined');
  doc.text(`Services: ${cleanServices.length}`, margin + thirdWidth * 2 + 4, y + 6);
  
  if (cleanServices.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.lightText as [number, number, number]);
    doc.text(cleanServices.join(', '), margin + 4, y + 11);
  }
  
  y += 20;

  // ==================== SECTION: INFORMATIONS COMPLÉMENTAIRES ====================
  if (data.additionalInfo && data.additionalInfo.trim() && data.additionalInfo !== 'null' && data.additionalInfo !== 'undefined') {
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    y = drawSectionHeader(doc, 'INFORMATIONS COMPLÉMENTAIRES / PIÈCES', margin, y, contentWidth);
    y += 2;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.darkText as [number, number, number]);
    
    const infoLines = doc.splitTextToSize(data.additionalInfo, contentWidth - 8);
    doc.setDrawColor(...COLORS.mediumGray as [number, number, number]);
    const infoHeight = Math.max(infoLines.length * 4.5 + 6, 14);
    doc.rect(margin, y, contentWidth, infoHeight);
    doc.text(infoLines, margin + 4, y + 6);
    y += infoHeight + 6;
  }

  // ==================== SECTION: INVENTAIRE ====================
  if (data.furnitureInventory && data.furnitureInventory.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 15;
    }

    y = drawSectionHeader(doc, 'INVENTAIRE', margin, y, contentWidth);
    y += 2;

    const cols = [
      { label: 'ARTICLE', x: margin, width: contentWidth * 0.45 },
      { label: 'QTÉ', x: margin + contentWidth * 0.45, width: contentWidth * 0.12 },
      { label: 'VOL.U', x: margin + contentWidth * 0.57, width: contentWidth * 0.15 },
      { label: 'VOL.T', x: margin + contentWidth * 0.72, width: contentWidth * 0.15 },
    ];

    doc.setFillColor(...COLORS.headerBg as [number, number, number]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.headerText as [number, number, number]);
    cols.forEach(col => {
      doc.text(col.label, col.x + 3, y + 5);
    });
    y += 7;

    doc.setFont('helvetica', 'normal');
    data.furnitureInventory.forEach((item, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 15;
        doc.setFillColor(...COLORS.headerBg as [number, number, number]);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.headerText as [number, number, number]);
        cols.forEach(col => {
          doc.text(col.label, col.x + 3, y + 5);
        });
        y += 7;
        doc.setFont('helvetica', 'normal');
      }

      if (idx % 2 === 0) {
        doc.setFillColor(...COLORS.lightGray as [number, number, number]);
        doc.rect(margin, y, contentWidth, 7, 'F');
      }
      
      doc.setDrawColor(...COLORS.tableBorder as [number, number, number]);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.darkText as [number, number, number]);
      doc.text(safe(item.name, 'N/A'), cols[0].x + 3, y + 5);
      doc.text(String(item.quantity || 0), cols[1].x + 3, y + 5);
      doc.text(item.volume_unitaire != null && !isNaN(item.volume_unitaire) ? item.volume_unitaire.toFixed(2) : '—', cols[2].x + 3, y + 5);
      doc.text(item.volume_total != null && !isNaN(item.volume_total) ? item.volume_total.toFixed(2) : '—', cols[3].x + 3, y + 5);
      y += 7;
    });

    doc.setFillColor(...COLORS.headerBg as [number, number, number]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.headerText as [number, number, number]);
    doc.setFontSize(8);
    doc.text('TOTAL', margin + 3, y + 5);
    const totalVol = data.furnitureInventory.reduce((sum, item) => sum + (item.volume_total || 0), 0);
    const totalQty = data.furnitureInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    doc.text(`${totalQty} obj`, cols[1].x + 3, y + 5);
    doc.text(`${totalVol.toFixed(2)} m³`, cols[3].x + 3, y + 5);
    y += 12;
  }

  if (y > 220) {
    doc.addPage();
    y = 15;
  }

  // ==================== SECTION: INFORMATIONS FINANCIÈRES ====================
  y = drawSectionHeader(doc, 'INFORMATIONS FINANCIÈRES', margin, y, contentWidth);
  y += 2;

  doc.setDrawColor(...COLORS.primary as [number, number, number]);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 32);

  doc.setFillColor(...COLORS.primary as [number, number, number]);
  doc.rect(margin, y, 3, 32, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.darkText as [number, number, number]);
  
  const isMoverContract = data.contractType === 'mover';
  const displayAmount = isMoverContract
    ? (data.moverPrice || Math.round(data.totalAmount / 1.3))
    : data.totalAmount;

  doc.text(isMoverContract ? 'Montant de votre devis proposé:' : 'Montant total TTC:', margin + 8, y + 8);
  doc.setTextColor(...COLORS.primaryDark as [number, number, number]);
  doc.text(formatCurrency(displayAmount), margin + 75, y + 8);
  
  doc.setTextColor(...COLORS.darkText as [number, number, number]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (isMoverContract) {
    // Mover sees: their price, what client pays them directly (totalClient * 0.6), and guarantee (moverPrice - clientDirectPayment)
    const clientTotalPrice = Math.round(displayAmount * 1.3);
    const clientDirectPayment = Math.round(clientTotalPrice * 0.6);
    const guarantee = displayAmount - clientDirectPayment;

    doc.text(`Solde à recevoir du client (le jour J):`, margin + 8, y + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(clientDirectPayment), margin + 75, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Garantie retenue par la plateforme:`, margin + 8, y + 22);
    doc.text(formatCurrency(guarantee), margin + 75, y + 22);
  } else {
    doc.text(`Acompte versé (40%):`, margin + 8, y + 16);
    doc.text(formatCurrency(data.depositAmount), margin + 75, y + 16);
    doc.text(`Solde à régler au déménageur:`, margin + 8, y + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.remainingAmount), margin + 75, y + 22);
  }

  if (data.guaranteeAmount && !isNaN(data.guaranteeAmount) && data.guaranteeAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Garantie (10%):`, margin + 8, y + 28);
    doc.text(formatCurrency(data.guaranteeAmount), margin + 65, y + 28);
  }

  y += 38;

  // ==================== SECTION: CONDITIONS GÉNÉRALES ====================
  if (y > 235) {
    doc.addPage();
    y = 15;
  }

  y = drawSectionHeader(doc, 'CONDITIONS GÉNÉRALES', margin, y, contentWidth);
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.darkText as [number, number, number]);

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
    if (y > 280) {
      doc.addPage();
      y = 15;
    }
    const lines = doc.splitTextToSize(condition, contentWidth - 8);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5 + 1.5;
  });

  y += 5;

  // ==================== FOOTER ====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(...COLORS.primary as [number, number, number]);
    doc.setLineWidth(0.5);
    doc.line(margin, 285, pageWidth - margin, 285);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightText as [number, number, number]);
    doc.text('Ce document est un contrat de déménagement généré par TrouveTonDéménageur.fr', pageWidth / 2, 289, { align: 'center' });
    doc.text(`${i}/${totalPages}`, pageWidth - margin, 289, { align: 'right' });
  }

  doc.save(`Contrat_${contractNumber}.pdf`);
}

function drawSectionHeader(doc: jsPDF, title: string, x: number, y: number, width: number): number {
  doc.setFillColor(...COLORS.headerBg as [number, number, number]);
  doc.roundedRect(x, y, width, 8, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.headerText as [number, number, number]);
  doc.text(title, x + 4, y + 5.5);
  return y + 10;
}

// Helper to build ContractPDFData from various sources
// Always enriches contract_data with live mover/quoteRequest data when available
export function buildContractPDFData(contract: any, quoteRequest?: any, quote?: any, mover?: any, payment?: any, contractType: 'client' | 'mover' = 'client'): ContractPDFData {
  const moverProposedPrice = quote?.price || payment?.mover_price || 0;

  // When contract_data exists (new schema from trigger), use it but enrich with live data
  if (contract.contract_data) {
    const cd = contract.contract_data;

    return {
      contractId: contract.id,
      contractNumber: contract.contract_number || cd.contract_number,
      createdAt: contract.created_at,
      status: contract.status || 'active',
      contractType,
      
      // Client info
      clientName: cd.client?.name || quoteRequest?.client_name || '',
      clientEmail: cd.client?.email || quoteRequest?.client_email || '',
      clientPhone: cd.client?.phone || quoteRequest?.client_phone || '',
      
      // Mover info - enrich from live mover data for completeness
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
      
      // Moving details
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
      
      // Property - enrich from quoteRequest
      homeSize: cd.home_size || quoteRequest?.home_size || '',
      homeType: cd.home_type || quoteRequest?.home_type || '',
      volumeM3: cd.volume_m3 ?? quoteRequest?.volume_m3,
      distanceKm: quoteRequest?.distance_km,
      
      // Services
      services: cd.services || quoteRequest?.services_needed || [],
      
      // Financial - prefer payment data for accuracy
      totalAmount: payment?.total_amount || cd.financial?.total_amount || 0,
      moverPrice: moverProposedPrice || cd.financial?.mover_price || Math.round((payment?.total_amount || cd.financial?.total_amount || 0) / 1.3),
      depositAmount: payment?.deposit_amount || cd.financial?.deposit_amount || 0,
      remainingAmount: payment?.remaining_amount || cd.financial?.remaining_amount || 0,
      guaranteeAmount: payment?.guarantee_amount,
      
      // Inventory from quoteRequest (not stored in contract_data by the trigger)
      furnitureInventory: quoteRequest?.furniture_inventory,
      
      // Additional info
      additionalInfo: quoteRequest?.additional_info || cd.additional_info || '',
    };
  }

  // Build from separate data sources (for old schema with contract_text)
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
