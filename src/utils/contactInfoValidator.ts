export interface ValidationResult {
  isValid: boolean;
  blockedReasons: string[];
}

export function validateNoContactInfo(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { isValid: true, blockedReasons: [] };
  }

  const blockedReasons: string[] = [];
  const normalizedText = text.toLowerCase()
    .replace(/[\s\-_.()]/g, '')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u');

  const phonePatterns = [
    /\b0[1-9][\s\-.]{0,2}(?:\d[\s\-.]{0,2}){8}\b/,
    /\b\+?\d{1,3}[\s\-.]{0,2}(?:\d[\s\-.]{0,2}){8,12}\b/,
    /\b(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)[\s\-]{0,2}(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)[\s\-]{0,2}(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)/gi,
    /\b(?:06|07|01|02|03|04|05|08|09)\d{8}\b/,
    /(?:telephone|tel|phone|portable|mobile|contact|appel|whatsapp|signal|telegram)[\s:]*(?:\+?\d[\d\s\-.()]{8,}|\d{10})/gi
  ];

  for (const pattern of phonePatterns) {
    if (pattern.test(text) || pattern.test(normalizedText)) {
      blockedReasons.push('Numéros de téléphone interdits');
      break;
    }
  }

  const emailPatterns = [
    /[a-z0-9._%+\-]+[\s]*@[\s]*[a-z0-9.\-]+\.[a-z]{2,}/gi,
    /[a-z0-9._%+\-]+[\s]*\[at\][\s]*[a-z0-9.\-]+[\s]*\[dot\][\s]*[a-z]{2,}/gi,
    /[a-z0-9._%+\-]+[\s]*\(at\)[\s]*[a-z0-9.\-]+[\s]*\(dot\)[\s]*[a-z]{2,}/gi,
    /[a-z0-9._%+\-]+[\s]*arobase[\s]*[a-z0-9.\-]+[\s]*point[\s]*[a-z]{2,}/gi,
    /\b[a-z0-9._%+\-]+\s*@\s*[a-z0-9.\-]+\s*\.\s*(?:com|fr|net|org|eu)\b/gi
  ];

  for (const pattern of emailPatterns) {
    if (pattern.test(text) || pattern.test(normalizedText)) {
      blockedReasons.push('Adresses email interdites');
      break;
    }
  }

  const urlPatterns = [
    /(?:https?:\/\/|www\.)[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi,
    /\b[a-z0-9\-]+\s*\.\s*(?:com|fr|net|org|eu|co|io)\b/gi,
    /(?:site|web|lien|link|url)[\s:]+[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi
  ];

  for (const pattern of urlPatterns) {
    if (pattern.test(text)) {
      blockedReasons.push('URLs et liens web interdits');
      break;
    }
  }

  const numberWordPatterns = [
    /\b(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\b.*\b(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\b.*\b(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\b/gi,
    /(?:0|1|2|3|4|5|6|7|8|9)[\s\-._]{0,2}(?:0|1|2|3|4|5|6|7|8|9)[\s\-._]{0,2}(?:0|1|2|3|4|5|6|7|8|9)[\s\-._]{0,2}(?:0|1|2|3|4|5|6|7|8|9)[\s\-._]{0,2}(?:0|1|2|3|4|5|6|7|8|9)[\s\-._]{0,2}(?:0|1|2|3|4|5|6|7|8|9)/g
  ];

  for (const pattern of numberWordPatterns) {
    const matches = text.match(pattern) || [];
    if (matches.some(match => match.replace(/[\s\-._]/g, '').length >= 8)) {
      blockedReasons.push('Séquences de chiffres interdites');
      break;
    }
  }

  const suspiciousKeywords = [
    'appelez', 'appelle', 'appellez', 'contactez', 'contacter',
    'ecrivez', 'ecris', 'ecrire', 'mail', 'email', 'e-mail',
    'whatsapp', 'signal', 'telegram', 'messenger', 'facebook',
    'instagram', 'snapchat', 'twitter', 'linkedin',
    'directement', 'en direct', 'hors plateforme', 'sans commission'
  ];

  let suspiciousCount = 0;
  for (const keyword of suspiciousKeywords) {
    if (normalizedText.includes(keyword)) {
      suspiciousCount++;
    }
  }

  if (suspiciousCount >= 2) {
    blockedReasons.push('Tentative de contournement de la plateforme détectée');
  }

  const companyIndicators = [
    /demenagement\s+[a-z]+/gi,
    /[a-z]+\s+demenagement/gi,
    /sarl|sas|eurl|auto-entrepreneur/gi,
    /siret|siren/gi
  ];

  for (const pattern of companyIndicators) {
    if (pattern.test(text)) {
      blockedReasons.push('Noms d\'entreprise interdits');
      break;
    }
  }

  const atSymbolVariants = ['@', 'arobase', 'at', '[at]', '(at)', 'arroba'];
  const dotVariants = ['.', 'point', 'dot', '[dot]', '(dot)'];

  let hasAtVariant = false;
  let hasDotVariant = false;

  for (const variant of atSymbolVariants) {
    if (normalizedText.includes(variant)) {
      hasAtVariant = true;
      break;
    }
  }

  for (const variant of dotVariants) {
    if (normalizedText.includes(variant)) {
      hasDotVariant = true;
      break;
    }
  }

  if (hasAtVariant && hasDotVariant) {
    if (!blockedReasons.includes('Adresses email interdites')) {
      blockedReasons.push('Adresses email interdites');
    }
  }

  return {
    isValid: blockedReasons.length === 0,
    blockedReasons
  };
}

export function sanitizeText(text: string): string {
  const validation = validateNoContactInfo(text);
  if (!validation.isValid) {
    return '';
  }
  return text;
}
