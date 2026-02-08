interface QuoteRequestData {
  volume_m3?: number;
  surface_m2?: number;
  home_size: string;
  floor_from: number;
  floor_to: number;
  elevator_from: boolean;
  elevator_to: boolean;
  services_needed: string[];
  distance_km?: number;
  from_postal_code: string;
  to_postal_code: string;
  from_city?: string;
  to_city?: string;
  furniture_lift_needed_departure?: boolean;
  furniture_lift_needed_arrival?: boolean;
  accepts_groupage?: boolean;
}

interface PriceCalculation {
  marketPrice: number;
  priceIndicator: 'green' | 'orange' | 'red';
  clientDisplayPrice: number;
}

interface MarketPriceBreakdown {
  basePrice: number;
  distanceCost: number;
  floorCost: number;
  servicesCost: number;
  totalMarketPrice: number;
  details: string[];
}

const MARKET_RATE_PER_M3 = 50;
const MARKET_RATE_PER_M3_NATIONAL = 65;
const MARKET_RATE_PER_M3_INTERNATIONAL = 100;
const MARKET_RATE_PER_M2 = 22;

const HOME_SIZE_BASE_VOLUMES: Record<string, number> = {
  'studio': 15,
  't1': 20,
  't2': 30,
  't3': 45,
  't4': 60,
  't5': 75,
  'maison': 90,
};

const SERVICE_COSTS: Record<string, number> = {
  'packing': 250,
  'furniture_disassembly': 300,
  'furniture_assembly': 300,
  'storage': 150,
  'piano': 350,
  'fragile_items': 120,
  'cleaning': 180,
  'Emballage/Déballage': 250,
  'Démontage/Remontage meubles': 300,
  'Fourniture de cartons': 80,
  'Garde-meubles': 150,
  'Transport d\'objets fragiles': 120,
  'Nettoyage après déménagement': 180,
};

const FLOOR_COST_WITHOUT_ELEVATOR = 80;
const FLOOR_COST_WITH_ELEVATOR = 0;
const FURNITURE_LIFT_COST = 400;

export function calculateMarketPrice(quoteData: QuoteRequestData): number {
  const breakdown = calculateMarketPriceWithBreakdown(quoteData);
  return breakdown.totalMarketPrice;
}

export function calculateMarketPriceWithBreakdown(quoteData: QuoteRequestData): MarketPriceBreakdown {
  const details: string[] = [];
  const distance = quoteData.distance_km || 0;

  // Detect international move
  const isInternational = detectInternationalMove(quoteData);
  const isNational = !isInternational && distance > 200;

  // Choose rate per m³ based on move type
  const ratePerM3 = isInternational ? MARKET_RATE_PER_M3_INTERNATIONAL : (isNational ? MARKET_RATE_PER_M3_NATIONAL : MARKET_RATE_PER_M3);

  let basePrice = 0;
  let volumeM3 = 0;

  if (quoteData.volume_m3 && quoteData.volume_m3 > 0) {
    volumeM3 = quoteData.volume_m3;
    basePrice = volumeM3 * ratePerM3;
    details.push(`Volume: ${volumeM3}m³ × ${ratePerM3}€ = ${basePrice}€${isInternational ? ' (tarif international)' : ''}`);
  } else if (quoteData.surface_m2 && quoteData.surface_m2 > 0) {
    basePrice = quoteData.surface_m2 * MARKET_RATE_PER_M2;
    volumeM3 = quoteData.surface_m2 * 1.5;
    details.push(`Surface: ${quoteData.surface_m2}m² × ${MARKET_RATE_PER_M2}€ = ${basePrice}€`);
  } else {
    const homeSize = quoteData.home_size.toLowerCase();
    volumeM3 = HOME_SIZE_BASE_VOLUMES[homeSize] || 30;
    basePrice = volumeM3 * ratePerM3;
    details.push(`Type de logement: ${quoteData.home_size} (${volumeM3}m³ estimés) × ${ratePerM3}€ = ${basePrice}€`);
  }

  let distanceCost = 0;
  if (distance > 0) {
    if (isInternational) {
      // International: ~2€/km + admin surcharge
      distanceCost = distance * 2.0 + 400;
      details.push(`Distance internationale: ${distance}km × 2.00€ + 400€ admin = ${distanceCost.toFixed(0)}€`);
    } else if (distance > 200) {
      // National long distance: 90€ flat + 0.45€/km beyond 200km
      distanceCost = 90 + (distance - 200) * 0.45;
      details.push(`Distance longue: 90€ + ${(distance - 200).toFixed(0)}km × 0.45€ = ${distanceCost.toFixed(0)}€`);
    } else if (distance > 50) {
      // Medium distance: 0.60€/km beyond 50km
      distanceCost = (distance - 50) * 0.60;
      details.push(`Distance: ${(distance - 50).toFixed(0)}km × 0.60€ = ${distanceCost.toFixed(0)}€`);
    } else {
      details.push(`Distance: ${distance}km (< 50km, inclus)`);
    }
  } else {
    const fromDept = parseInt(quoteData.from_postal_code.substring(0, 2));
    const toDept = parseInt(quoteData.to_postal_code.substring(0, 2));
    const deptDiff = Math.abs(fromDept - toDept);

    if (deptDiff === 0) {
      distanceCost = 0;
      details.push(`Distance: même département (inclus dans le prix)`);
    } else {
      const estimatedKm = deptDiff * 50;
      distanceCost = deptDiff * 25;
      details.push(`Distance estimée: ${deptDiff} départements (≈${estimatedKm}km) × 25€ = ${distanceCost}€`);
    }
  }

  let floorCost = 0;
  if (quoteData.floor_from > 0 && !quoteData.elevator_from) {
    const cost = quoteData.floor_from * FLOOR_COST_WITHOUT_ELEVATOR;
    floorCost += cost;
    details.push(`Étages départ: ${quoteData.floor_from} × ${FLOOR_COST_WITHOUT_ELEVATOR}€ (sans ascenseur) = ${cost}€`);
  } else if (quoteData.floor_from > 0) {
    details.push(`Étages départ: ${quoteData.floor_from} (avec ascenseur, gratuit)`);
  }

  if (quoteData.floor_to > 0 && !quoteData.elevator_to) {
    const cost = quoteData.floor_to * FLOOR_COST_WITHOUT_ELEVATOR;
    floorCost += cost;
    details.push(`Étages arrivée: ${quoteData.floor_to} × ${FLOOR_COST_WITHOUT_ELEVATOR}€ (sans ascenseur) = ${cost}€`);
  } else if (quoteData.floor_to > 0) {
    details.push(`Étages arrivée: ${quoteData.floor_to} (avec ascenseur, gratuit)`);
  }

  // Monte-meuble
  if (quoteData.furniture_lift_needed_departure) {
    floorCost += FURNITURE_LIFT_COST;
    details.push(`Monte-meuble départ: ${FURNITURE_LIFT_COST}€`);
  }
  if (quoteData.furniture_lift_needed_arrival) {
    floorCost += FURNITURE_LIFT_COST;
    details.push(`Monte-meuble arrivée: ${FURNITURE_LIFT_COST}€`);
  }

  let servicesCost = 0;
  if (quoteData.services_needed && quoteData.services_needed.length > 0) {
    quoteData.services_needed.forEach(service => {
      const cost = SERVICE_COSTS[service] || 0;
      if (cost > 0) {
        servicesCost += cost;
        details.push(`Service: ${service} = ${cost}€`);
      }
    });
  }

  let totalMarketPrice = Math.round(basePrice + distanceCost + floorCost + servicesCost);

  // Groupage discount
  if (quoteData.accepts_groupage) {
    const discount = Math.round(totalMarketPrice * 0.25);
    totalMarketPrice -= discount;
    details.push(`Groupage (-25%): -${discount}€`);
  }

  return {
    basePrice: Math.round(basePrice),
    distanceCost: Math.round(distanceCost),
    floorCost: Math.round(floorCost),
    servicesCost: Math.round(servicesCost),
    totalMarketPrice,
    details,
  };
}

function detectInternationalMove(quoteData: QuoteRequestData): boolean {
  const distance = quoteData.distance_km || 0;
  const fromCity = (quoteData.from_city || quoteData.from_postal_code || '').toLowerCase();
  const toCity = (quoteData.to_city || quoteData.to_postal_code || '').toLowerCase();

  const countryIndicators: Record<string, string[]> = {
    'BE': ['bruxelles', 'brussels', 'liège', 'anvers', 'gand', 'namur', 'mons', 'charleroi', 'woluwe', 'ixelles', 'schaerbeek', 'anderlecht', 'uccle', 'etterbeek', 'molenbeek', 'forest', 'jette', 'auderghem', 'evere', 'oostende', 'bruges', 'leuven', 'mechelen', 'kortrijk', 'aalst', 'hasselt', 'genk', 'turnhout'],
    'CH': ['zurich', 'zürich', 'bern', 'berne', 'basel', 'bâle', 'genève', 'geneva', 'lausanne', 'lucerne', 'luzern', 'winterthur', 'lugano', 'fribourg', 'neuchâtel', 'sion', 'yverdon', 'thun'],
    'DE': ['berlin', 'münchen', 'munich', 'hamburg', 'köln', 'cologne', 'frankfurt', 'stuttgart', 'düsseldorf', 'dortmund', 'essen', 'bremen', 'dresden', 'leipzig', 'hannover', 'nürnberg', 'bonn', 'aachen', 'mannheim', 'karlsruhe'],
    'LU': ['luxembourg', 'esch-sur-alzette', 'differdange', 'dudelange'],
    'NL': ['amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven', 'groningen', 'maastricht', 'breda', 'arnhem'],
  };

  let fromCountry = 'FR';
  let toCountry = 'FR';

  for (const [country, indicators] of Object.entries(countryIndicators)) {
    for (const ind of indicators) {
      if (fromCity.includes(ind)) fromCountry = country;
      if (toCity.includes(ind)) toCountry = country;
    }
  }

  if (fromCountry !== toCountry) return true;
  if (distance > 500) return true;
  return false;
}

export function calculatePriceIndicator(
  proposedPrice: number,
  marketPrice: number
): 'green' | 'orange' | 'red' {
  if (proposedPrice <= 0 || proposedPrice < marketPrice * 0.5) {
    return 'red';
  }

  const difference = ((proposedPrice - marketPrice) / marketPrice) * 100;

  if (difference >= -10 && difference <= 10) {
    return 'green';
  } else if ((difference > 10 && difference <= 25) || (difference < -10 && difference >= -25)) {
    return 'orange';
  } else {
    return 'red';
  }
}

export function getPriceIndicatorMessage(
  indicator: 'green' | 'orange' | 'red',
  proposedPrice: number,
  marketPrice: number
): string {
  const difference = ((proposedPrice - marketPrice) / marketPrice) * 100;
  const diffText = difference > 0 ? `+${difference.toFixed(0)}%` : `${difference.toFixed(0)}%`;

  switch (indicator) {
    case 'green':
      return `Excellent prix (${diffText} par rapport au marché)`;
    case 'orange':
      return `Prix correct mais légèrement élevé (${diffText} par rapport au marché)`;
    case 'red':
      if (proposedPrice < marketPrice * 0.5) {
        return `Prix anormalement bas et suspect (${diffText} par rapport au marché)`;
      } else {
        return `Prix trop éloigné du marché (${diffText})`;
      }
  }
}

export function calculateClientDisplayPrice(proposedPrice: number): number {
  return Math.round(proposedPrice * 1.3);
}

/**
 * PAYMENT SYSTEM
 * 
 * Client pays a total price (mover price + platform margin).
 * Part is held as deposit/guarantee via Stripe.
 * Remaining is paid directly by client to mover at delivery.
 * Guarantee is released to mover after 48h if no damage claim.
 */
export function calculatePriceBreakdown(clientDisplayPrice: number) {
  const moverPrice = Math.round(clientDisplayPrice / 1.3);
  const platformFee = Math.round(moverPrice * 0.3); // 30% commission

  const depositAmount = Math.round(clientDisplayPrice * 0.4); // 40% deposit via Stripe
  const remainingAmount = clientDisplayPrice - depositAmount;  // 60% cash to mover

  const guaranteeAmount = depositAmount - platformFee; // Everything after commission is guarantee

  return {
    // Prices
    clientDisplayPrice,
    moverPrice,
    totalAmount: clientDisplayPrice,

    // Deposit breakdown (what Stripe charges)
    depositAmount,        // Total charged via Stripe (40%)
    platformFee,          // Platform commission (30% of mover price)
    guaranteeAmount,      // Held for 48h damage claims (deposit - commission)

    // Cash payment
    remainingAmount,      // Client pays directly to mover at delivery (60%)

    // Mover total
    moverTotalPayout: moverPrice,  // remaining + guarantee = mover price

    // Legacy compatibility
    moverDeposit: 0,
    escrowAmount: guaranteeAmount,
    moverAdvance: 0,
    moverTotal: moverPrice,
  };
}

export function validateQuotePricing(
  quoteData: QuoteRequestData,
  proposedPrice: number
): PriceCalculation {
  const marketPrice = calculateMarketPrice(quoteData);
  const priceIndicator = calculatePriceIndicator(proposedPrice, marketPrice);
  const clientDisplayPrice = calculateClientDisplayPrice(proposedPrice);

  return {
    marketPrice,
    priceIndicator,
    clientDisplayPrice,
  };
}

export function calculateRefundAmount(
  amountPaid: number,
  daysBeforeMoving: number
): { refundPercentage: number; refundAmount: number } {
  let refundPercentage = 0;

  if (daysBeforeMoving >= 7) {
    refundPercentage = 100;
  } else if (daysBeforeMoving >= 2) {
    refundPercentage = 50;
  } else {
    refundPercentage = 0;
  }

  const refundAmount = Math.round((amountPaid * refundPercentage) / 100);

  return {
    refundPercentage,
    refundAmount,
  };
}
