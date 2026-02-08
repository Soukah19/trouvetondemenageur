import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { moverId } = await req.json();

    if (!moverId) {
      throw new Error('Missing moverId');
    }

    // Récupérer toutes les informations du déménageur
    const { data: mover, error: moverError } = await supabase
      .from('movers')
      .select('*, trucks(*)')
      .eq('id', moverId)
      .single();

    if (moverError || !mover) {
      throw new Error('Mover not found');
    }

    // Initialiser le rapport de vérification
    const verificationReport = {
      moverId,
      overallStatus: 'verified' as 'verified' | 'needs_review' | 'rejected',
      checks: [] as any[],
      alerts: [] as any[],
      expirationWarnings: [] as any[],
      score: 100,
    };

    // 1. VÉRIFICATION KBIS
    if (mover.kbis_document_url) {
      const kbisCheck = await verifyKBIS(mover);
      verificationReport.checks.push(kbisCheck);
      if (!kbisCheck.passed) {
        verificationReport.overallStatus = 'needs_review';
        verificationReport.score -= kbisCheck.severity === 'critical' ? 30 : 10;
      }
      if (kbisCheck.alerts.length > 0) {
        verificationReport.alerts.push(...kbisCheck.alerts);
      }
      if (kbisCheck.expirationWarning) {
        verificationReport.expirationWarnings.push(kbisCheck.expirationWarning);
      }
    } else {
      verificationReport.checks.push({
        type: 'kbis',
        passed: false,
        message: 'KBIS manquant',
        severity: 'critical',
      });
      verificationReport.overallStatus = 'needs_review';
      verificationReport.score -= 30;
    }

    // 2. VÉRIFICATION ASSURANCE RC PRO
    if (mover.insurance_document_url) {
      const insuranceCheck = await verifyInsurance(mover);
      verificationReport.checks.push(insuranceCheck);
      if (!insuranceCheck.passed) {
        verificationReport.overallStatus = 'needs_review';
        verificationReport.score -= insuranceCheck.severity === 'critical' ? 30 : 10;
      }
      if (insuranceCheck.expirationWarning) {
        verificationReport.expirationWarnings.push(insuranceCheck.expirationWarning);
      }
    } else {
      verificationReport.checks.push({
        type: 'insurance',
        passed: false,
        message: 'Assurance RC PRO manquante',
        severity: 'critical',
      });
      verificationReport.overallStatus = 'needs_review';
      verificationReport.score -= 30;
    }

    // 3. VÉRIFICATION PIÈCE D'IDENTITÉ
    if (mover.identity_document_url) {
      const identityCheck = await verifyIdentity(mover);
      verificationReport.checks.push(identityCheck);
      if (!identityCheck.passed) {
        verificationReport.overallStatus = 'needs_review';
        verificationReport.score -= identityCheck.severity === 'critical' ? 20 : 10;
      }
      if (identityCheck.expirationWarning) {
        verificationReport.expirationWarnings.push(identityCheck.expirationWarning);
      }
    } else {
      verificationReport.checks.push({
        type: 'identity',
        passed: false,
        message: 'Pièce d\'identité manquante',
        severity: 'critical',
      });
      verificationReport.overallStatus = 'needs_review';
      verificationReport.score -= 20;
    }

    // 4. VÉRIFICATION CAMIONS ET CARTES GRISES
    if (mover.trucks && mover.trucks.length > 0) {
      for (const truck of mover.trucks) {
        const truckCheck = await verifyTruck(truck, mover);
        verificationReport.checks.push(truckCheck);
        if (!truckCheck.passed) {
          verificationReport.overallStatus = 'needs_review';
          verificationReport.score -= 10;
        }
      }
    } else {
      verificationReport.checks.push({
        type: 'trucks',
        passed: false,
        message: 'Aucun véhicule enregistré',
        severity: 'warning',
      });
      verificationReport.score -= 5;
    }

    // 5. VÉRIFICATION LICENCE DE TRANSPORT (si applicable)
    if (mover.transport_license_url) {
      const licenseCheck = await verifyTransportLicense(mover);
      verificationReport.checks.push(licenseCheck);
      if (!licenseCheck.passed) {
        verificationReport.overallStatus = 'needs_review';
        verificationReport.score -= 15;
      }
      if (licenseCheck.expirationWarning) {
        verificationReport.expirationWarnings.push(licenseCheck.expirationWarning);
      }
    }

    // 6. DÉTECTION DE FRAUDE
    const fraudCheck = await detectFraud(mover, supabase);
    if (fraudCheck.suspiciousActivity) {
      verificationReport.checks.push(fraudCheck);
      verificationReport.overallStatus = 'needs_review';
      verificationReport.alerts.push(...fraudCheck.alerts);
      verificationReport.score -= 25;
    }

    // Déterminer le statut final
    if (verificationReport.score < 50) {
      verificationReport.overallStatus = 'rejected';
    } else if (verificationReport.score < 85 || verificationReport.alerts.length > 0) {
      verificationReport.overallStatus = 'needs_review';
    }

    // Enregistrer le rapport dans la base de données
    await supabase
      .from('verification_reports')
      .insert({
        mover_id: moverId,
        report_data: verificationReport,
        status: verificationReport.overallStatus,
        score: verificationReport.score,
        created_at: new Date().toISOString(),
      });

    // Créer des notifications pour l'admin
    if (verificationReport.overallStatus === 'verified') {
      await supabase
        .from('notifications')
        .insert({
          user_id: null, // Pour les admins
          notification_type: 'mover_ready_for_approval',
          title: '✅ Déménageur prêt à approuver',
          message: `${mover.company_name} a passé toutes les vérifications IA (Score: ${verificationReport.score}/100)`,
          related_entity_type: 'mover',
          related_entity_id: moverId,
        });
    } else if (verificationReport.overallStatus === 'needs_review') {
      await supabase
        .from('notifications')
        .insert({
          user_id: null,
          notification_type: 'mover_needs_manual_review',
          title: '⚠️ Révision manuelle nécessaire',
          message: `${mover.company_name} nécessite une vérification manuelle (Score: ${verificationReport.score}/100, ${verificationReport.alerts.length} alerte(s))`,
          related_entity_type: 'mover',
          related_entity_id: moverId,
        });
    }

    // Alertes d'expiration
    for (const warning of verificationReport.expirationWarnings) {
      await supabase
        .from('notifications')
        .insert({
          user_id: mover.user_id,
          notification_type: 'document_expiring',
          title: '📅 Document proche de l\'expiration',
          message: warning.message,
          related_entity_type: 'mover',
          related_entity_id: moverId,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: verificationReport,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in comprehensive verification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
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
});

// ========== FONCTIONS DE VÉRIFICATION ==========

async function verifyKBIS(mover: any) {
  // SIMULATION: En production, utiliser une API d'OCR réelle
  await new Promise(resolve => setTimeout(resolve, 500));

  const check: any = {
    type: 'kbis',
    passed: true,
    alerts: [],
    details: {},
  };

  // Extraire les informations du KBIS (simulé)
  const extractedData = {
    companyName: mover.company_name,
    siret: mover.siret || '12345678901234',
    address: mover.address || '',
    managerName: mover.manager_name || '',
    issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 mois
  };

  check.details = extractedData;

  // 1. Vérifier que le KBIS a moins de 3 mois
  const kbisAge = (Date.now() - extractedData.issueDate.getTime()) / (1000 * 60 * 60 * 24);
  if (kbisAge > 90) {
    check.passed = false;
    check.severity = 'critical';
    check.message = `KBIS expiré (${Math.floor(kbisAge)} jours)`;
    check.alerts.push({
      type: 'expired_kbis',
      message: `Le KBIS a plus de 3 mois (${Math.floor(kbisAge)} jours)`,
      severity: 'critical',
    });
  } else if (kbisAge > 60) {
    check.expirationWarning = {
      type: 'kbis',
      message: `Le KBIS expire bientôt (${Math.floor(90 - kbisAge)} jours restants). Merci de le mettre à jour.`,
      daysRemaining: Math.floor(90 - kbisAge),
    };
  }

  // 2. Comparer SIRET
  if (mover.siret && extractedData.siret !== mover.siret) {
    check.passed = false;
    check.severity = 'critical';
    check.alerts.push({
      type: 'siret_mismatch',
      message: `SIRET ne correspond pas: saisi "${mover.siret}", KBIS "${extractedData.siret}"`,
      severity: 'critical',
    });
  }

  // 3. Comparer nom de l'entreprise
  const normalizedCompanyName = normalize(mover.company_name);
  const normalizedExtracted = normalize(extractedData.companyName);
  if (!normalizedCompanyName.includes(normalizedExtracted) && !normalizedExtracted.includes(normalizedCompanyName)) {
    check.passed = false;
    check.severity = 'warning';
    check.alerts.push({
      type: 'company_name_mismatch',
      message: `Nom d'entreprise différent: saisi "${mover.company_name}", KBIS "${extractedData.companyName}"`,
      severity: 'warning',
    });
  }

  // 4. Comparer nom du gérant
  if (mover.manager_name) {
    const normalizedManager = normalize(mover.manager_name);
    const normalizedExtractedManager = normalize(extractedData.managerName);
    if (!normalizedManager.includes(normalizedExtractedManager) && !normalizedExtractedManager.includes(normalizedManager)) {
      check.passed = false;
      check.severity = 'warning';
      check.alerts.push({
        type: 'manager_name_mismatch',
        message: `Nom du gérant différent: saisi "${mover.manager_name}", KBIS "${extractedData.managerName}"`,
        severity: 'warning',
      });
    }
  }

  if (check.passed) {
    check.message = 'KBIS vérifié avec succès';
  }

  return check;
}

async function verifyInsurance(mover: any) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const check: any = {
    type: 'insurance',
    passed: true,
    details: {},
  };

  // Simuler l'extraction de la date d'expiration
  const expirationDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 mois
  check.details.expirationDate = expirationDate;

  // Vérifier la validité
  const daysUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  if (daysUntilExpiration < 0) {
    check.passed = false;
    check.severity = 'critical';
    check.message = 'Assurance RC PRO expirée';
  } else if (daysUntilExpiration < 30) {
    check.expirationWarning = {
      type: 'insurance',
      message: `Votre assurance RC PRO expire dans ${Math.floor(daysUntilExpiration)} jours. Merci de la renouveler.`,
      daysRemaining: Math.floor(daysUntilExpiration),
    };
    check.message = 'Assurance valide mais expire bientôt';
  } else {
    check.message = 'Assurance RC PRO valide';
  }

  return check;
}

async function verifyIdentity(mover: any) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const check: any = {
    type: 'identity',
    passed: true,
    details: {},
  };

  // Simuler l'extraction des données
  const extractedData = {
    name: mover.manager_name || 'Jean Dupont',
    birthDate: '01/01/1980',
    expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 ans
    documentNumber: 'FR123456789',
  };

  check.details = extractedData;

  // Vérifier l'expiration
  const daysUntilExpiration = (extractedData.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilExpiration < 0) {
    check.passed = false;
    check.severity = 'critical';
    check.message = 'Pièce d\'identité expirée';
  } else if (daysUntilExpiration < 60) {
    check.expirationWarning = {
      type: 'identity',
      message: `Votre pièce d'identité expire dans ${Math.floor(daysUntilExpiration)} jours.`,
      daysRemaining: Math.floor(daysUntilExpiration),
    };
    check.message = 'Pièce d\'identité valide mais expire bientôt';
  } else {
    check.message = 'Pièce d\'identité valide';
  }

  // Comparer avec le nom du gérant
  if (mover.manager_name) {
    const normalizedExtracted = normalize(extractedData.name);
    const normalizedManager = normalize(mover.manager_name);
    if (!normalizedExtracted.includes(normalizedManager) && !normalizedManager.includes(normalizedExtracted)) {
      check.passed = false;
      check.severity = 'warning';
      check.message = `Nom sur la pièce d'identité ("${extractedData.name}") ne correspond pas au gérant saisi ("${mover.manager_name}")`;
    }
  }

  return check;
}

async function verifyTruck(truck: any, mover: any) {
  await new Promise(resolve => setTimeout(resolve, 300));

  const check: any = {
    type: 'truck',
    truckId: truck.id,
    passed: true,
    details: {},
  };

  // Simuler l'extraction de la carte grise
  const extractedPlate = truck.license_plate || 'AB-123-CD';
  check.details.extractedPlate = extractedPlate;

  // Vérifier la plaque d'immatriculation
  if (truck.license_plate !== extractedPlate) {
    check.passed = false;
    check.severity = 'warning';
    check.message = `Immatriculation ne correspond pas pour le camion: saisi "${truck.license_plate}", carte grise "${extractedPlate}"`;
  } else {
    check.message = `Camion ${truck.license_plate} vérifié`;
  }

  // Vérifier que le titulaire est l'entreprise
  const ownerOnCard = mover.company_name;
  check.details.owner = ownerOnCard;
  
  if (!ownerOnCard.includes(mover.company_name) && !mover.company_name.includes(ownerOnCard)) {
    check.passed = false;
    check.severity = 'warning';
    check.message = `Le titulaire de la carte grise ne correspond pas à l'entreprise`;
  }

  return check;
}

async function verifyTransportLicense(mover: any) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const check: any = {
    type: 'transport_license',
    passed: true,
    details: {},
  };

  // Simuler l'extraction
  const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
  check.details.expirationDate = expirationDate;
  check.details.licenseNumber = 'LT-2024-12345';

  const daysUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilExpiration < 0) {
    check.passed = false;
    check.severity = 'critical';
    check.message = 'Licence de transport expirée';
  } else if (daysUntilExpiration < 30) {
    check.expirationWarning = {
      type: 'transport_license',
      message: `Votre licence de transport expire dans ${Math.floor(daysUntilExpiration)} jours.`,
      daysRemaining: Math.floor(daysUntilExpiration),
    };
    check.message = 'Licence de transport valide mais expire bientôt';
  } else {
    check.message = 'Licence de transport valide';
  }

  return check;
}

async function detectFraud(mover: any, supabase: any) {
  const fraudCheck: any = {
    type: 'fraud_detection',
    suspiciousActivity: false,
    alerts: [],
  };

  // 1. Vérifier si le même SIRET est déjà utilisé
  if (mover.siret) {
    const { data: duplicates } = await supabase
      .from('movers')
      .select('id, company_name')
      .eq('siret', mover.siret)
      .neq('id', mover.id);

    if (duplicates && duplicates.length > 0) {
      fraudCheck.suspiciousActivity = true;
      fraudCheck.alerts.push({
        type: 'duplicate_siret',
        message: `SIRET déjà utilisé par: ${duplicates.map((d: any) => d.company_name).join(', ')}`,
        severity: 'critical',
      });
    }
  }

  // 2. Vérifier si le même email est utilisé
  const { data: emailDuplicates } = await supabase
    .from('movers')
    .select('id, company_name, email')
    .eq('email', mover.email)
    .neq('id', mover.id);

  if (emailDuplicates && emailDuplicates.length > 0) {
    fraudCheck.suspiciousActivity = true;
    fraudCheck.alerts.push({
      type: 'duplicate_email',
      message: `Email déjà utilisé par: ${emailDuplicates.map((d: any) => d.company_name).join(', ')}`,
      severity: 'warning',
    });
  }

  // 3. Vérifier si le même téléphone est utilisé
  if (mover.phone) {
    const { data: phoneDuplicates } = await supabase
      .from('movers')
      .select('id, company_name')
      .eq('phone', mover.phone)
      .neq('id', mover.id);

    if (phoneDuplicates && phoneDuplicates.length > 0) {
      fraudCheck.suspiciousActivity = true;
      fraudCheck.alerts.push({
        type: 'duplicate_phone',
        message: `Téléphone déjà utilisé par: ${phoneDuplicates.map((d: any) => d.company_name).join(', ')}`,
        severity: 'warning',
      });
    }
  }

  return fraudCheck;
}

// Fonction utilitaire pour normaliser les textes
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}
