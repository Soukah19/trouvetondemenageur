const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CardValidationRequest {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
  customerId?: string;
  amount?: number;
}

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface ValidationResult {
  valid: boolean;
  fraudScore: number;
  fraudIndicators: FraudIndicator[];
  recommendations: string[];
  allowPayment: boolean;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestData: CardValidationRequest = await req.json();
    const {
      cardNumber,
      cardholderName,
      expiryDate,
      cvv,
      customerId,
      amount,
    } = requestData;

    const fraudIndicators: FraudIndicator[] = [];
    let fraudScore = 0;

    if (!cardNumber || !cardholderName || !expiryDate) {
      return new Response(
        JSON.stringify({
          valid: false,
          fraudScore: 0,
          fraudIndicators: [],
          recommendations: ['Informations de carte incomplètes'],
          allowPayment: false,
          reason: 'Informations de carte manquantes',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');

    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      fraudIndicators.push({
        type: 'invalid_format',
        severity: 'high',
        description: 'Format de numéro de carte invalide',
      });
      fraudScore += 50;
    }

    if (!luhnCheck(cleanCardNumber)) {
      fraudIndicators.push({
        type: 'invalid_luhn',
        severity: 'high',
        description: 'Numéro de carte invalide (échec du test de Luhn)',
      });
      fraudScore += 50;
    }

    const testCardPrefixes = ['4111', '5555', '3782', '6011', '3056'];
    if (testCardPrefixes.some(prefix => cleanCardNumber.startsWith(prefix))) {
      fraudIndicators.push({
        type: 'test_card',
        severity: 'high',
        description: 'Numéro de carte de test détecté',
      });
      fraudScore += 80;
    }

    if (isSequentialNumbers(cleanCardNumber)) {
      fraudIndicators.push({
        type: 'sequential_numbers',
        severity: 'high',
        description: 'Séquence de numéros suspecte détectée',
      });
      fraudScore += 70;
    }

    if (isRepeatedNumbers(cleanCardNumber)) {
      fraudIndicators.push({
        type: 'repeated_numbers',
        severity: 'medium',
        description: 'Numéros répétés suspects détectés',
      });
      fraudScore += 40;
    }

    if (cardholderName.length < 3 || !/^[a-zA-Z\s]+$/.test(cardholderName)) {
      fraudIndicators.push({
        type: 'invalid_cardholder',
        severity: 'medium',
        description: 'Nom du titulaire suspect ou invalide',
      });
      fraudScore += 30;
    }

    const suspiciousNames = ['test', 'fake', 'fraud', 'invalid', 'dummy'];
    if (suspiciousNames.some(name => cardholderName.toLowerCase().includes(name))) {
      fraudIndicators.push({
        type: 'suspicious_name',
        severity: 'high',
        description: 'Nom du titulaire suspect',
      });
      fraudScore += 60;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
    if (!expiryRegex.test(expiryDate)) {
      fraudIndicators.push({
        type: 'invalid_expiry',
        severity: 'medium',
        description: 'Format de date d\'expiration invalide',
      });
      fraudScore += 30;
    } else {
      const [month, year] = expiryDate.split('/');
      const fullYear = year.length === 2 ? `20${year}` : year;
      const expiryTimestamp = new Date(`${fullYear}-${month}-01`).getTime();
      const now = new Date().getTime();

      if (expiryTimestamp < now) {
        fraudIndicators.push({
          type: 'expired_card',
          severity: 'high',
          description: 'Carte expirée',
        });
        fraudScore += 100;
      }
    }

    if (cvv && (!/^\d{3,4}$/.test(cvv))) {
      fraudIndicators.push({
        type: 'invalid_cvv',
        severity: 'medium',
        description: 'CVV invalide',
      });
      fraudScore += 30;
    }

    if (amount && amount > 10000) {
      fraudIndicators.push({
        type: 'high_amount',
        severity: 'medium',
        description: 'Montant élevé nécessitant une vérification supplémentaire',
      });
      fraudScore += 20;
    }

    const recommendations: string[] = [];
    if (fraudScore >= 70) {
      recommendations.push('Bloquer la transaction immédiatement');
      recommendations.push('Signaler l\'utilisateur pour fraude potentielle');
    } else if (fraudScore >= 40) {
      recommendations.push('Demander une vérification supplémentaire (3D Secure)');
      recommendations.push('Limiter le montant de la transaction');
    } else if (fraudScore >= 20) {
      recommendations.push('Surveiller l\'activité du compte');
    } else {
      recommendations.push('Transaction à faible risque - autoriser');
    }

    const allowPayment = fraudScore < 50;

    const result: ValidationResult = {
      valid: fraudScore < 30,
      fraudScore,
      fraudIndicators,
      recommendations,
      allowPayment,
      reason: !allowPayment
        ? `Score de fraude trop élevé (${fraudScore}/100)`
        : undefined,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in validate-payment-card:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur lors de la validation de la carte',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

function isSequentialNumbers(cardNumber: string): boolean {
  let sequentialCount = 0;
  for (let i = 1; i < cardNumber.length; i++) {
    const current = parseInt(cardNumber[i], 10);
    const previous = parseInt(cardNumber[i - 1], 10);
    if (current === previous + 1 || current === previous - 1) {
      sequentialCount++;
      if (sequentialCount >= 4) {
        return true;
      }
    } else {
      sequentialCount = 0;
    }
  }
  return false;
}

function isRepeatedNumbers(cardNumber: string): boolean {
  const digitCounts: { [key: string]: number } = {};
  for (const digit of cardNumber) {
    digitCounts[digit] = (digitCounts[digit] || 0) + 1;
  }

  for (const count of Object.values(digitCounts)) {
    if (count > cardNumber.length * 0.4) {
      return true;
    }
  }

  return false;
}
