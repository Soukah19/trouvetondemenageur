export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  const blockedDomains = ['example.com', 'test.com', 'fake.com'];
  const domain = email.split('@')[1].toLowerCase();

  if (blockedDomains.includes(domain)) {
    return false;
  }

  return true;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');

  const frenchMobileRegex = /^(\+33|0033|0)[67]\d{8}$/;
  if (frenchMobileRegex.test(cleanPhone)) {
    return true;
  }

  const frenchLandlineRegex = /^(\+33|0033|0)[1-5]\d{8}$/;
  if (frenchLandlineRegex.test(cleanPhone)) {
    return true;
  }

  const europeanRegex = /^(\+|00)(32|41|49|34|39|351|352|353|44|31|43|45|46|47|358|420|421|48)\d{7,13}$/;
  if (europeanRegex.test(cleanPhone)) {
    return true;
  }

  const invalidPatterns = [
    /^0+$/,
    /^1+$/,
    /^2+$/,
    /^3+$/,
    /^4+$/,
    /^5+$/,
    /^6+$/,
    /^7+$/,
    /^8+$/,
    /^9+$/,
    /^(00)+$/,
    /^(11)+$/,
    /^(123456)/
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(cleanPhone)) {
      return false;
    }
  }

  return false;
};

export const getPhoneValidationMessage = (): string => {
  return "Veuillez entrer un numéro de téléphone valide (français ou européen). Exemples: 06 12 34 56 78, +33 6 12 34 56 78, 01 23 45 67 89";
};

export const getEmailValidationMessage = (): string => {
  return "Veuillez entrer une adresse email valide. Exemple: nom@exemple.fr";
};

// Validation SIRET (numéro d'identification des entreprises françaises)
export const validateSiret = (siret: string): { isValid: boolean; error?: string } => {
  // Nettoyer le SIRET (supprimer espaces et tirets)
  const cleanSiret = siret.replace(/[\s\-]/g, '');
  
  // Vérifier que le SIRET contient exactement 14 chiffres
  if (!/^\d{14}$/.test(cleanSiret)) {
    return {
      isValid: false,
      error: 'Le numéro SIRET doit contenir exactement 14 chiffres'
    };
  }
  
  // Vérifier que ce n'est pas une suite de chiffres identiques
  if (/^(\d)\1{13}$/.test(cleanSiret)) {
    return {
      isValid: false,
      error: 'Le numéro SIRET saisi est invalide (chiffres identiques)'
    };
  }
  
  // Algorithme de Luhn pour valider le SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleanSiret[i], 10);
    
    // Doubler les chiffres aux positions paires (0, 2, 4, ...)
    if (i % 2 === 0) {
      digit *= 2;
      // Si le résultat dépasse 9, soustraire 9
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  // Le SIRET est valide si la somme est divisible par 10
  if (sum % 10 !== 0) {
    return {
      isValid: false,
      error: 'Le numéro SIRET saisi est invalide (vérification Luhn échouée)'
    };
  }
  
  // Extraire et valider le SIREN (9 premiers chiffres)
  const siren = cleanSiret.substring(0, 9);
  let sirenSum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(siren[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sirenSum += digit;
  }
  
  if (sirenSum % 10 !== 0) {
    return {
      isValid: false,
      error: 'Le numéro SIREN (9 premiers chiffres) est invalide'
    };
  }
  
  return { isValid: true };
};

export const getSiretValidationMessage = (): string => {
  return "Veuillez entrer un numéro SIRET valide (14 chiffres). Exemple: 123 456 789 00001";
};

// Validation du code postal français
export const validatePostalCode = (postalCode: string): { isValid: boolean; error?: string } => {
  // Nettoyer le code postal (supprimer espaces)
  const cleanPostalCode = postalCode.replace(/\s/g, '');
  
  // Vérifier que le code postal contient exactement 5 chiffres
  if (!/^\d{5}$/.test(cleanPostalCode)) {
    return {
      isValid: false,
      error: 'Le code postal doit contenir exactement 5 chiffres'
    };
  }
  
  // Vérifier que ce n'est pas une suite de chiffres identiques
  if (/^(\d)\1{4}$/.test(cleanPostalCode)) {
    return {
      isValid: false,
      error: 'Le code postal saisi est invalide'
    };
  }
  
  // Vérifier les plages valides de départements français (01-95, 97-98 pour DOM, 2A/2B pour Corse converti)
  const departement = parseInt(cleanPostalCode.substring(0, 2), 10);
  
  // Vérifier si c'est un code postal valide
  // Départements métropolitains: 01-95 (sauf 20 qui est la Corse, codes 20000-20999 ou 2A/2B)
  // DOM-TOM: 97xxx, 98xxx
  if (departement === 0) {
    return {
      isValid: false,
      error: 'Le code postal saisi est invalide'
    };
  }
  
  if (departement > 95 && departement < 97) {
    return {
      isValid: false,
      error: 'Le code postal saisi est invalide'
    };
  }
  
  if (departement > 98) {
    return {
      isValid: false,
      error: 'Le code postal saisi est invalide'
    };
  }
  
  return { isValid: true };
};

export const getPostalCodeValidationMessage = (): string => {
  return "Veuillez entrer un code postal français valide (5 chiffres). Exemple: 75001";
};

// Validation du numéro d'immatriculation français
export const validateRegistrationNumber = (registration: string): { isValid: boolean; error?: string } => {
  // Nettoyer le numéro (supprimer espaces et tirets, mettre en majuscule)
  const cleanRegistration = registration.replace(/[\s\-]/g, '').toUpperCase();
  
  if (cleanRegistration.length === 0) {
    return {
      isValid: false,
      error: "Le numéro d'immatriculation est requis"
    };
  }
  
  // Format nouveau (depuis 2009): AA-123-AA ou AA123AA
  const newFormatRegex = /^[A-HJ-NP-TV-Z]{2}\d{3}[A-HJ-NP-TV-Z]{2}$/;
  
  // Format ancien: 123 ABC 75 ou 123ABC75
  const oldFormatRegex = /^\d{1,4}[A-Z]{1,3}\d{2,3}$/;
  
  if (newFormatRegex.test(cleanRegistration) || oldFormatRegex.test(cleanRegistration)) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: "Format d'immatriculation invalide. Exemples: AB-123-CD ou 123 ABC 75"
  };
};

export const getRegistrationNumberValidationMessage = (): string => {
  return "Veuillez entrer un numéro d'immatriculation valide. Exemples: AB-123-CD ou 123 ABC 75";
};

// Validation du mot de passe
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getPasswordValidationMessage = (): string => {
  return "Le mot de passe doit contenir au moins 8 caractères et au moins un chiffre";
};
