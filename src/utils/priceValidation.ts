import { QuoteRequest } from '../lib/supabase';

type PriceRange = {
  min: number;
  max: number;
  recommended: number;
};

export function calculateEstimatedPrice(request: QuoteRequest): PriceRange {
  let basePrice = 0;

  if (request.volume_m3 && request.volume_m3 > 0) {
    basePrice = request.volume_m3 * 50;
  } else {
    const homeSizePrices: Record<string, number> = {
      'Studio': 750,
      'T1': 1000,
      'T2': 1500,
      'T3': 2250,
      'T4': 3000,
      'T5+': 3750
    };

    basePrice = homeSizePrices[request.home_size] || 1500;

    if (request.home_type === 'Maison') {
      basePrice *= 1.2;
    }
  }

  let floorCostFrom = request.floor_from * (request.elevator_from ? 0 : 80);
  let floorCostTo = request.floor_to * (request.elevator_to ? 0 : 80);

  basePrice += floorCostFrom + floorCostTo;

  const distance = estimateDistance(
    request.from_postal_code,
    request.to_postal_code
  );

  if (distance > 200) {
    basePrice += 90 + (distance - 200) * 0.45;
  } else if (distance > 50) {
    basePrice += (distance - 50) * 0.60;
  }

  request.services_needed.forEach(service => {
    const serviceCosts: Record<string, number> = {
      'Emballage/Déballage': 250,
      'Fourniture de cartons': 80,
      'Démontage/Remontage meubles': 300,
      'Garde-meubles': 150,
      'Transport d\'objets fragiles': 120,
      'Nettoyage après déménagement': 180
    };

    basePrice += serviceCosts[service] || 0;
  });

  const variationPercent = 0.15;
  const min = Math.round(basePrice * (1 - variationPercent));
  const max = Math.round(basePrice * (1 + variationPercent));
  const recommended = Math.round(basePrice);

  return {
    min,
    max,
    recommended
  };
}

function estimateDistance(postalCode1: string, postalCode2: string): number {
  const dept1 = postalCode1.substring(0, 2);
  const dept2 = postalCode2.substring(0, 2);

  if (dept1 === dept2) {
    return 30;
  }

  const adjacentDepts: Record<string, string[]> = {
    '75': ['77', '78', '91', '92', '93', '94', '95'],
    '92': ['75', '78', '91', '93', '94', '95'],
    '93': ['75', '77', '92', '94', '95'],
    '94': ['75', '77', '91', '92', '93', '95'],
    '91': ['75', '77', '78', '92', '94', '95'],
    '77': ['75', '91', '93', '94', '95'],
    '78': ['75', '91', '92', '95'],
    '95': ['75', '77', '78', '92', '93', '94']
  };

  if (adjacentDepts[dept1]?.includes(dept2)) {
    return 50;
  }

  const regions: Record<string, string[]> = {
    'idf': ['75', '77', '78', '91', '92', '93', '94', '95'],
    'nord': ['02', '59', '60', '62', '80'],
    'est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
    'ouest': ['14', '22', '29', '35', '44', '49', '50', '53', '56', '72', '85'],
    'centre': ['18', '28', '36', '37', '41', '45'],
    'sud': ['04', '05', '06', '13', '83', '84'],
    'sudouest': ['09', '11', '12', '30', '31', '32', '34', '46', '47', '48', '64', '65', '66', '81', '82']
  };

  for (const region in regions) {
    if (regions[region].includes(dept1) && regions[region].includes(dept2)) {
      return 150;
    }
  }

  return 400;
}

export function validatePrice(
  price: number,
  request: QuoteRequest
): { isValid: boolean; message: string; range: PriceRange } {
  const range = calculateEstimatedPrice(request);

  const lowerBound = range.min * 0.7;
  const upperBound = range.max * 1.5;

  if (price < lowerBound) {
    return {
      isValid: false,
      message: `Le prix proposé (${price}€) semble anormalement bas. Prix estimé : ${range.min}€ - ${range.max}€. Un prix trop bas peut indiquer un manque de professionnalisme ou des frais cachés.`,
      range
    };
  }

  if (price > upperBound) {
    return {
      isValid: false,
      message: `Le prix proposé (${price}€) semble excessif. Prix estimé : ${range.min}€ - ${range.max}€. Veuillez vérifier votre calcul.`,
      range
    };
  }

  if (price < range.min || price > range.max) {
    return {
      isValid: true,
      message: `Prix acceptable mais en dehors de la fourchette recommandée (${range.min}€ - ${range.max}€). Prix conseillé : ${range.recommended}€`,
      range
    };
  }

  return {
    isValid: true,
    message: `Prix dans la fourchette normale du marché.`,
    range
  };
}
