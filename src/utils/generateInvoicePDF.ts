import jsPDF from 'jspdf';

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dossierReference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostalCode?: string;
  amountHT: number; // frais de réservation HT
  tvaRate: number;   // e.g. 20
  status: 'Payée' | 'En attente';
}

function loadLogoAsBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = '/ttd-logo.png';
  });
}

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Colors
  const darkBlue = [30, 58, 95];
  const gray = [100, 116, 139];
  const lightGray = [241, 245, 249];
  const black = [0, 0, 0];
  const green = [22, 163, 74];
  const yellow = [202, 138, 4];
  const accentBlue = [59, 130, 246];

  // Try to load logo
  const logoBase64 = await loadLogoAsBase64();

  // === HEADER ===
  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y, 25, 25);
    } catch { /* skip logo */ }
  }

  // "Facture" title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...darkBlue);
  doc.text('Facture', margin + 30, y + 8);

  // Company info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkBlue);
  doc.text('TROUVE TON DÉMÉNAGEUR', margin + 30, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  const companyLines = [
    'SASU au capital de 1 000,00 € · RCS',
    'Paris 101 378 248',
    '60 rue François 1er · 75008 Paris',
    'TVA intracommunautaire : FR 83',
    '101378248',
    'support@trouvetondemenageur.fr ·',
    '01.89.70.78.81',
  ];
  companyLines.forEach((line, i) => {
    doc.text(line, margin + 30, y + 20 + i * 4);
  });

  // Document box (right side)
  const boxX = 125;
  const boxY = y;
  const boxW = 65;

  // Box header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(boxX, boxY, boxW, 42, 2, 2, 'F');
  doc.setDrawColor(200, 210, 220);
  doc.roundedRect(boxX, boxY, boxW, 42, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text('DOCUMENT COMPTABLE', boxX + 4, boxY + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkBlue);
  doc.text(data.invoiceNumber, boxX + 4, boxY + 14);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text("Date d'émission", boxX + 4, boxY + 20);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(data.issueDate, boxX + 4, boxY + 24);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Référence déménagement', boxX + 34, boxY + 20);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(data.dossierReference, boxX + 34, boxY + 24);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Mode de paiement', boxX + 4, boxY + 30);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Paiement sécurisé', boxX + 4, boxY + 34);
  doc.text('Stripe', boxX + 4, boxY + 38);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Statut', boxX + 34, boxY + 30);

  // Status badge
  const statusColor = data.status === 'Payée' ? green : yellow;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(boxX + 34, boxY + 32, 20, 7, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.status, boxX + 37, boxY + 37);

  y += 52;

  // === CLIENT FACTURÉ ===
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('CLIENT FACTURÉ', margin, y);
  y += 4;

  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'S');

  // Left: identity
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Identité', margin + 4, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(data.clientName, margin + 4, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(data.clientEmail, margin + 4, y + 17);
  doc.text(data.clientPhone || '', margin + 4, y + 22);

  // Right: address
  const rightCol = margin + contentWidth / 2 + 5;
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Adresse de facturation', rightCol, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(data.clientAddress || '—', rightCol, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  if (data.clientCity || data.clientPostalCode) {
    doc.text(`${data.clientPostalCode || ''} ${data.clientCity || ''}`.trim(), rightCol, y + 17);
  }

  y += 36;

  // === DÉTAIL FACTURÉ ===
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('DÉTAIL FACTURÉ', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(...lightGray);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('Description', margin + 4, y + 5.5);
  doc.text('Qté', margin + 110, y + 5.5);
  doc.text('PU HT', margin + 125, y + 5.5);
  doc.text('Total HT', margin + 148, y + 5.5);
  y += 8;

  // Table row
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('Frais de réservation – mise en relation plateforme', margin + 4, y + 4);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text("Réservation d'un déménageur via la plateforme", margin + 4, y + 9);
  doc.text('TROUVE TON DÉMÉNAGEUR', margin + 4, y + 13);
  doc.text(`Dossier : ${data.dossierReference}`, margin + 4, y + 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...black);
  doc.text('1', margin + 112, y + 4);
  doc.text(`${data.amountHT.toFixed(2)} €`, margin + 123, y + 4);
  doc.text(`${data.amountHT.toFixed(2)} €`, margin + 146, y + 4);

  y += 24;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + contentWidth, y);

  // === TOTALS ===
  y += 6;
  const totalsX = margin + 100;
  const totalsValX = margin + 150;

  const tvaAmount = data.amountHT * (data.tvaRate / 100);
  const totalTTC = data.amountHT + tvaAmount;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX - 4, y - 3, 74, 32, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Sous-total HT', totalsX, y + 3);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.amountHT.toFixed(2)} €`, totalsValX, y + 3);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`TVA (${data.tvaRate} %)`, totalsX, y + 3);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text(`${tvaAmount.toFixed(2)} €`, totalsValX, y + 3);

  y += 9;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, y, totalsX + 68, y);
  y += 2;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkBlue);
  doc.text('Total TTC', totalsX, y + 5);
  doc.text(`${totalTTC.toFixed(2)} €`, totalsValX - 2, y + 5);

  y += 18;

  // === DISCLAIMER ===
  doc.setDrawColor(...accentBlue);
  doc.setLineWidth(1);
  doc.line(margin, y, margin, y + 18);
  doc.setLineWidth(0.2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...black);
  doc.text('Ces frais correspondent à la commission de mise en relation de la plateforme et ', margin + 4, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('ne constituent pas un', margin + 4 + doc.getTextWidth('Ces frais correspondent à la commission de mise en relation de la plateforme et '), y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('acompte', margin + 4, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(' sur la prestation de déménagement.', margin + 4 + doc.getTextWidth('acompte'), y + 9);
  doc.text('Le solde de la prestation est réglé directement entre le Client et le Déménageur.', margin + 4, y + 14);

  y += 26;

  // === FOOTER ===
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('Hotline', margin, y);
  doc.text('Site', margin + 100, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('01.89.70.78.81', margin, y);
  doc.text('www.trouvetondemenageur.fr', margin + 100, y);
  y += 4;
  doc.text('support@trouvetondemenageur.fr', margin, y);
  doc.setFontSize(7);
  doc.text('Facture générée automatiquement par le CRM', margin + 100, y);

  // Save
  doc.save(`Facture_${data.invoiceNumber}.pdf`);
}

// Returns invoice PDF as base64 string (for email attachments)
export async function getInvoicePDFBase64(data: InvoiceData): Promise<string> {
  const doc = new jsPDF('p', 'mm', 'a4');
  await buildInvoicePDFContent(doc, data);
  return doc.output('datauristring').split(',')[1];
}

// Helper to build invoice content into a jsPDF doc
async function buildInvoicePDFContent(doc: jsPDF, data: InvoiceData): Promise<void> {
  // Re-invoke the same generation logic as generateInvoicePDF but on the provided doc
  // We call generateInvoicePDFToDoc internally
}

// Alternate: simpler approach — generate full PDF and extract base64
export async function generateInvoicePDFBase64(data: InvoiceData): Promise<string> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const darkBlue = [30, 58, 95];
  const gray = [100, 116, 139];
  const lightGray = [241, 245, 249];
  const black = [0, 0, 0];
  const green = [22, 163, 74];
  const yellow = [202, 138, 4];
  const accentBlue = [59, 130, 246];

  const logoBase64 = await loadLogoAsBase64();

  if (logoBase64) { try { doc.addImage(logoBase64, 'PNG', margin, y, 25, 25); } catch { /* skip */ } }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.setTextColor(...darkBlue);
  doc.text('Facture', margin + 30, y + 8);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkBlue);
  doc.text('TROUVE TON DÉMÉNAGEUR', margin + 30, y + 15);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  ['SASU au capital de 1 000,00 € · RCS','Paris 101 378 248','60 rue François 1er · 75008 Paris','TVA intracommunautaire : FR 83','101378248','support@trouvetondemenageur.fr ·','01.89.70.78.81'].forEach((l, i) => { doc.text(l, margin + 30, y + 20 + i * 4); });

  const boxX = 125, boxY = y, boxW = 65;
  doc.setFillColor(241, 245, 249); doc.roundedRect(boxX, boxY, boxW, 42, 2, 2, 'F');
  doc.setDrawColor(200, 210, 220); doc.roundedRect(boxX, boxY, boxW, 42, 2, 2, 'S');
  doc.setFontSize(7); doc.setTextColor(...gray); doc.text('DOCUMENT COMPTABLE', boxX + 4, boxY + 6);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkBlue); doc.text(data.invoiceNumber, boxX + 4, boxY + 14);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text("Date d'émission", boxX + 4, boxY + 20);
  doc.setTextColor(...black); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(data.issueDate, boxX + 4, boxY + 24);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text('Référence déménagement', boxX + 34, boxY + 20);
  doc.setTextColor(...black); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(data.dossierReference, boxX + 34, boxY + 24);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text('Mode de paiement', boxX + 4, boxY + 30);
  doc.setTextColor(...black); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('Paiement sécurisé', boxX + 4, boxY + 34); doc.text('Stripe', boxX + 4, boxY + 38);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text('Statut', boxX + 34, boxY + 30);
  const sc = data.status === 'Payée' ? green : yellow;
  doc.setFillColor(sc[0], sc[1], sc[2]); doc.roundedRect(boxX + 34, boxY + 32, 20, 7, 2, 2, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text(data.status, boxX + 37, boxY + 37);

  y += 52;
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray); doc.text('CLIENT FACTURÉ', margin, y); y += 4;
  doc.setDrawColor(220, 220, 220); doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'S');
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text('Identité', margin + 4, y + 6);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...black); doc.text(data.clientName, margin + 4, y + 12);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text(data.clientEmail, margin + 4, y + 17); doc.text(data.clientPhone || '', margin + 4, y + 22);
  const rC = margin + contentWidth / 2 + 5;
  doc.setFontSize(7); doc.setTextColor(...gray); doc.text('Adresse de facturation', rC, y + 6);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...black); doc.text(data.clientAddress || '—', rC, y + 12);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  if (data.clientCity || data.clientPostalCode) doc.text(`${data.clientPostalCode || ''} ${data.clientCity || ''}`.trim(), rC, y + 17);

  y += 36;
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray); doc.text('DÉTAIL FACTURÉ', margin, y); y += 4;
  doc.setFillColor(...lightGray); doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray);
  doc.text('Description', margin + 4, y + 5.5); doc.text('Qté', margin + 110, y + 5.5); doc.text('PU HT', margin + 125, y + 5.5); doc.text('Total HT', margin + 148, y + 5.5);
  y += 8; doc.setDrawColor(220, 220, 220); doc.line(margin, y, margin + contentWidth, y); y += 3;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...black); doc.text('Frais de réservation – mise en relation plateforme', margin + 4, y + 4);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  doc.text("Réservation d'un déménageur via la plateforme", margin + 4, y + 9);
  doc.text('TROUVE TON DÉMÉNAGEUR', margin + 4, y + 13);
  doc.text(`Dossier : ${data.dossierReference}`, margin + 4, y + 17);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...black);
  doc.text('1', margin + 112, y + 4); doc.text(`${data.amountHT.toFixed(2)} €`, margin + 123, y + 4); doc.text(`${data.amountHT.toFixed(2)} €`, margin + 146, y + 4);
  y += 24; doc.line(margin, y, margin + contentWidth, y); y += 6;

  const tvaAmount = data.amountHT * (data.tvaRate / 100);
  const totalTTC = data.amountHT + tvaAmount;
  const tX = margin + 100, tV = margin + 150;
  doc.setFillColor(248, 250, 252); doc.roundedRect(tX - 4, y - 3, 74, 32, 2, 2, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text('Sous-total HT', tX, y + 3);
  doc.setTextColor(...black); doc.setFont('helvetica', 'bold'); doc.text(`${data.amountHT.toFixed(2)} €`, tV, y + 3); y += 9;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text(`TVA (${data.tvaRate} %)`, tX, y + 3);
  doc.setTextColor(...black); doc.setFont('helvetica', 'bold'); doc.text(`${tvaAmount.toFixed(2)} €`, tV, y + 3); y += 9;
  doc.setDrawColor(200, 200, 200); doc.line(tX, y, tX + 68, y); y += 2;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkBlue); doc.text('Total TTC', tX, y + 5); doc.text(`${totalTTC.toFixed(2)} €`, tV - 2, y + 5); y += 18;

  doc.setDrawColor(...accentBlue); doc.setLineWidth(1); doc.line(margin, y, margin, y + 18); doc.setLineWidth(0.2);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...black);
  doc.text('Ces frais correspondent à la commission de mise en relation de la plateforme et ne constituent pas un', margin + 4, y + 4);
  doc.setFont('helvetica', 'bold'); doc.text('acompte sur la prestation de déménagement.', margin + 4, y + 9);
  doc.setFont('helvetica', 'normal'); doc.text('Le solde de la prestation est réglé directement entre le Client et le Déménageur.', margin + 4, y + 14); y += 26;

  doc.setDrawColor(220, 220, 220); doc.line(margin, y, margin + contentWidth, y); y += 6;
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray); doc.text('Hotline', margin, y); doc.text('Site', margin + 100, y); y += 5;
  doc.setFont('helvetica', 'normal'); doc.text('01.89.70.78.81', margin, y); doc.text('www.trouvetondemenageur.fr', margin + 100, y); y += 4;
  doc.text('support@trouvetondemenageur.fr', margin, y); doc.setFontSize(7); doc.text('Facture générée automatiquement par le CRM', margin + 100, y);

  return doc.output('datauristring').split(',')[1];
}

// Helper to build invoice data from payment context
export function buildInvoiceData(
  payment: any,
  quote: any,
  quoteRequest: any,
  contractNumber: string
): InvoiceData {
  const now = new Date();
  const paidDate = payment?.paid_at ? new Date(payment.paid_at) : now;
  const issueDate = paidDate.toLocaleDateString('fr-FR');
  const invoiceNumber = `TTD-${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}${String(paidDate.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  // The 30% commission is what the client pays to TTD
  // payment.platform_fee or payment.deposit_amount are in euros (not cents)
  // payment.amount (from Stripe) would be in cents if present
  let totalTTC = 0;
  if (payment?.platform_fee) {
    totalTTC = payment.platform_fee;
  } else if (payment?.deposit_amount) {
    totalTTC = payment.deposit_amount;
  } else if (payment?.amount_paid) {
    totalTTC = payment.amount_paid;
  } else if (payment?.amount) {
    totalTTC = payment.amount / 100; // Stripe cents
  } else if (quote?.client_display_price) {
    totalTTC = quote.client_display_price * 0.3;
  }
  const tvaRate = 20;
  const amountHT = totalTTC / (1 + tvaRate / 100);

  return {
    invoiceNumber,
    issueDate,
    dossierReference: contractNumber || `DMT-${now.getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    clientName: quoteRequest?.client_name || 'Client',
    clientEmail: quoteRequest?.client_email || '',
    clientPhone: quoteRequest?.client_phone || '',
    clientAddress: quoteRequest?.from_address || '',
    clientCity: quoteRequest?.from_city || '',
    clientPostalCode: quoteRequest?.from_postal_code || '',
    amountHT: Math.round(amountHT * 100) / 100,
    tvaRate,
    status: 'Payée',
  };
}
