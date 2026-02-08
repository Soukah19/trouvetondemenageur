// Utility to generate contract text and create contracts
// Matches the DEPLOYED contracts table schema:
// id, quote_id, client_id, mover_id, contract_text (NOT NULL), status, created_at, expires_at

export interface ContractInput {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  moverCompanyName: string;
  moverSiret?: string;
  moverManagerName?: string;
  moverEmail?: string;
  moverPhone?: string;
  moverAddress?: string;
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
  services?: string[];
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
}

export function generateContractText(input: ContractInput): string {
  const contractNumber = `TTD-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toLocaleDateString('fr-FR');
  const movingDateFormatted = new Date(input.movingDate).toLocaleDateString('fr-FR');

  return `CONTRAT DE DÉMÉNAGEMENT - ${contractNumber}
================================================================================

Date de création: ${now}

INFORMATIONS CLIENT
-------------------
Nom: ${input.clientName || 'N/A'}
Email: ${input.clientEmail || 'N/A'}
Téléphone: ${input.clientPhone || 'N/A'}

INFORMATIONS DÉMÉNAGEUR
-----------------------
Société: ${input.moverCompanyName || 'N/A'}
SIRET: ${input.moverSiret || 'N/A'}
Responsable: ${input.moverManagerName || 'N/A'}
Adresse: ${input.moverAddress || 'N/A'}
Email: ${input.moverEmail || 'N/A'}
Téléphone: ${input.moverPhone || 'N/A'}

DÉTAILS DU DÉMÉNAGEMENT
-----------------------
Date prévue: ${movingDateFormatted}

Adresse de départ:
${input.fromAddress || 'N/A'}
${input.fromPostalCode || ''} ${input.fromCity || ''}
Étage: ${input.fromFloor ?? 'RDC'} | Ascenseur: ${input.fromElevator ? 'Oui' : 'Non'}

Adresse d'arrivée:
${input.toAddress || 'N/A'}
${input.toPostalCode || ''} ${input.toCity || ''}
Étage: ${input.toFloor ?? 'RDC'} | Ascenseur: ${input.toElevator ? 'Oui' : 'Non'}

Type de logement: ${input.homeSize || 'N/A'}${input.homeType ? ` - ${input.homeType}` : ''}
Volume estimé: ${input.volumeM3 || 'N/A'} m³

Services: ${input.services?.join(', ') || 'Aucun service spécifique'}

INFORMATIONS FINANCIÈRES
------------------------
Montant total: ${input.totalAmount?.toLocaleString('fr-FR')} €
Acompte versé: ${input.depositAmount?.toLocaleString('fr-FR')} €
Solde à régler: ${input.remainingAmount?.toLocaleString('fr-FR')} €

CONDITIONS GÉNÉRALES
--------------------
1. Le présent contrat engage les deux parties dès sa signature.
2. L'acompte versé confirme la réservation du déménagement.
3. Le solde est à régler directement au déménageur le jour du déménagement.
4. En cas d'annulation, les conditions de remboursement s'appliquent selon le délai.
5. Le déménageur s'engage à effectuer le transport dans les meilleures conditions.
6. Le client dispose de 48h après la livraison pour signaler tout dommage.

================================================================================
Ce document est un contrat de déménagement généré par TrouveTonDéménageur.
${contractNumber}`;
}

export function parseContractText(contractText: string): ContractInput & { contractNumber?: string } {
  // Try to extract data from contract text for display purposes
  const lines = contractText.split('\n');
  const getValue = (label: string): string => {
    const line = lines.find(l => l.startsWith(label));
    return line ? line.substring(label.length).trim() : 'N/A';
  };

  // Extract contract number from first line
  const firstLine = lines[0] || '';
  const contractNumberMatch = firstLine.match(/TTD-[\w]+/);
  
  return {
    contractNumber: contractNumberMatch?.[0],
    clientName: getValue('Nom: '),
    clientEmail: getValue('Email: '),
    clientPhone: getValue('Téléphone: '),
    moverCompanyName: getValue('Société: '),
    moverSiret: getValue('SIRET: '),
    moverManagerName: getValue('Responsable: '),
    moverEmail: '',
    moverPhone: '',
    moverAddress: getValue('Adresse: '),
    movingDate: '',
    fromCity: '',
    toCity: '',
    totalAmount: 0,
    depositAmount: 0,
    remainingAmount: 0,
  };
}
