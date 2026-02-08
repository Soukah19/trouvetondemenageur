import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, User, FileText, Upload, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GeographicAreaSelector } from '../components/GeographicAreaSelector';
import { DocumentUploadInput } from '../components/DocumentUploadInput';
import { MultiDocumentUploadInput } from '../components/MultiDocumentUploadInput';
import { validateEmail, validatePhone, validateSiret, validatePostalCode, validateRegistrationNumber, validatePassword, getEmailValidationMessage, getPhoneValidationMessage, getSiretValidationMessage, getPostalCodeValidationMessage, getRegistrationNumberValidationMessage } from '../utils/validation';
import { showToast } from '../utils/toast';

type MoverSignupPageProps = {
  onSuccess?: () => void;
};

const serviceOptions = [
  'Déménagement local',
  'Déménagement national',
  'Déménagement longue distance',
  'Déménagement international',
  'Emballage/Déballage',
  'Fourniture de cartons',
  'Démontage/Remontage meubles',
  'Monte-meuble',
  'Garde-meubles',
  'Transport d\'objets fragiles',
  'Nettoyage',
  'Piano et objets volumineux'
];

export function MoverSignupPage({ onSuccess }: MoverSignupPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [managerData, setManagerData] = useState({
    manager_firstname: '',
    manager_lastname: '',
    manager_phone: '',
    identity_document_recto: [] as File[],
    identity_document_verso: [] as File[],
    identity_type: 'id_card' as 'id_card' | 'passport' | 'driver_license'
  });

  const [companyData, setCompanyData] = useState({
    company_name: '',
    siret: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    description: '',
    services: [] as string[],
    coverage_area: '',
    // Bank details for receiving payments
    iban: '',
    bic: '',
    bank_name: '',
    account_holder_name: ''
  });

  const [trucks, setTrucks] = useState<Array<{
    id: string;
    registration_number: string;
    capacity_m3: number;
    registration_card: File | null;
  }>>([]);

  const [identityVerificationStatus, setIdentityVerificationStatus] = useState<{
    verified: boolean;
    message: string;
    namesMatch: boolean;
  } | null>(null);

  const [geographicAreas, setGeographicAreas] = useState<Array<{
    id: string;
    department: string;
    departmentCode: string;
    region: string;
    type: 'city' | 'region';
    displayText: string;
  }>>([]);

  const [documents, setDocuments] = useState({
    kbis: [] as File[],
    insurance: [] as File[],
    license: [] as File[]
  });

  const toggleService = (service: string) => {
    setCompanyData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const errors: {[key: string]: string} = {};

    try {
      if (!validateEmail(authData.email)) {
        errors.email = getEmailValidationMessage();
      }

      // Validate password strength
      const passwordValidation = validatePassword(authData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors.join('. ');
      }

      if (authData.password !== authData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }

      // If there are validation errors, show them
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError(Object.values(errors)[0]);
        showToast(Object.values(errors)[0], 'error');
        setLoading(false);
        return;
      }

      const { data: existingMover } = await supabase
        .from('movers')
        .select('id, company_name')
        .eq('email', authData.email)
        .maybeSingle();

      if (existingMover) {
        setError(`Cette adresse email est déjà utilisée par ${existingMover.company_name}. Veuillez vous connecter ou utiliser une autre adresse email.`);
        setFieldErrors({ email: 'Email déjà utilisé' });
        showToast('Cette adresse email est déjà utilisée', 'error');
        setLoading(false);
        return;
      }

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', authData.email)
        .maybeSingle();

      if (existingClient) {
        setError('Cette adresse email est déjà utilisée par un compte client. Veuillez utiliser une autre adresse email.');
        setFieldErrors({ email: 'Email déjà utilisé par un client' });
        showToast('Cette adresse email est déjà utilisée', 'error');
        setLoading(false);
        return;
      }

      setStep(2);
    } catch (error) {
      console.error('Error checking email:', error);
      showToast('Erreur lors de la vérification de l\'email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(managerData.manager_phone)) {
      setError(getPhoneValidationMessage());
      showToast(getPhoneValidationMessage(), 'error');
      return;
    }

    if (managerData.identity_document_recto.length === 0) {
      setError('Le recto de la pièce d\'identité est obligatoire');
      showToast('Le recto de la pièce d\'identité est obligatoire', 'error');
      return;
    }

    if (managerData.identity_document_verso.length === 0) {
      setError('Le verso de la pièce d\'identité est obligatoire');
      showToast('Le verso de la pièce d\'identité est obligatoire', 'error');
      return;
    }

    setStep(3);
  };

  const addTruck = () => {
    setTrucks([...trucks, {
      id: Date.now().toString(),
      registration_number: '',
      capacity_m3: 0,
      registration_card: null
    }]);
  };

  const removeTruck = (id: string) => {
    setTrucks(trucks.filter(t => t.id !== id));
  };

  const updateTruck = (id: string, field: string, value: any) => {
    setTrucks(trucks.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors: {[key: string]: string} = {};

    // Validation du SIRET
    const siretValidation = validateSiret(companyData.siret);
    if (!siretValidation.isValid) {
      errors.siret = siretValidation.error || getSiretValidationMessage();
    }

    // Validation du code postal
    const postalCodeValidation = validatePostalCode(companyData.postal_code);
    if (!postalCodeValidation.isValid) {
      errors.postal_code = postalCodeValidation.error || getPostalCodeValidationMessage();
    }

    if (!validateEmail(companyData.email)) {
      errors.company_email = getEmailValidationMessage();
    }

    if (!validatePhone(companyData.phone)) {
      errors.company_phone = getPhoneValidationMessage();
    }

    if (companyData.services.length === 0) {
      errors.services = 'Veuillez sélectionner au moins un service';
    }

    if (geographicAreas.length === 0) {
      errors.geographic_areas = 'Veuillez sélectionner au moins une zone géographique';
    }

    if (trucks.length === 0) {
      errors.trucks = 'Veuillez ajouter au moins un camion';
    }

    // Validate each truck
    for (let i = 0; i < trucks.length; i++) {
      const truck = trucks[i];
      if (!truck.registration_number || truck.registration_number.trim() === '') {
        errors[`truck_${i}_registration`] = 'Numéro d\'immatriculation manquant';
      } else {
        const registrationValidation = validateRegistrationNumber(truck.registration_number);
        if (!registrationValidation.isValid) {
          errors[`truck_${i}_registration`] = registrationValidation.error || getRegistrationNumberValidationMessage();
        }
      }
      if (!truck.capacity_m3 || truck.capacity_m3 <= 0) {
        errors[`truck_${i}_capacity`] = 'Cubage manquant ou invalide';
      }
      if (!truck.registration_card) {
        errors[`truck_${i}_card`] = 'Carte grise manquante';
      }
    }

    // If there are validation errors, show them
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setError(firstError);
      showToast(firstError, 'error');
      return;
    }

    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (documents.kbis.length === 0) {
      setError('L\'extrait KBIS est obligatoire pour finaliser votre inscription');
      showToast('L\'extrait KBIS est obligatoire', 'error');
      return;
    }

    if (documents.insurance.length === 0) {
      setError('L\'attestation d\'assurance est obligatoire pour finaliser votre inscription');
      showToast('L\'attestation d\'assurance est obligatoire', 'error');
      return;
    }

    if (documents.license.length === 0) {
      setError('La licence de transport est obligatoire pour finaliser votre inscription');
      showToast('La licence de transport est obligatoire', 'error');
      return;
    }

    setLoading(true);

    try {
      // Étape 1: Nettoyer automatiquement l'ancien compte avec le même SIRET (mode test)
      showToast('Vérification des doublons...', 'info');

      await supabase.rpc('cleanup_test_mover_by_siret', {
        test_siret: companyData.siret
      });

      // Petit délai pour s'assurer que le nettoyage est terminé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Créer le compte utilisateur
      const { data: authResponse, error: signupError } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password
      });

      if (signupError) {
        if (signupError.message.includes('already registered') || signupError.message.includes('already been registered')) {
          setError('Ce compte existe déjà. Veuillez vous connecter ou utiliser un autre email.');
          showToast('Ce compte existe déjà. Veuillez vous connecter ou utiliser un autre email.', 'error');
          setLoading(false);
          return;
        }
        throw signupError;
      }

      if (!authResponse.user) throw new Error('Erreur lors de la création du compte');

      showToast('Compte créé avec succès', 'success');

      // Étape 2.5: Se connecter automatiquement avec le nouveau compte
      const { data: signInResponse, error: signInError } = await supabase.auth.signInWithPassword({
        email: authData.email,
        password: authData.password
      });

      if (signInError) throw signInError;

      if (!signInResponse.user) throw new Error('Erreur lors de la connexion automatique');

      showToast('Connexion automatique réussie', 'success');

      // Utiliser le user de la connexion pour les opérations suivantes
      const authenticatedUser = signInResponse.user;

      // Helper: get file extension from MIME type (more reliable than file name)
      const getExtFromFile = (file: File): string => {
        const mimeMap: Record<string, string> = {
          'application/pdf': 'pdf',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
        };
        return mimeMap[file.type] || file.name.split('.').pop() || 'bin';
      };

      // Étape 2: Upload des documents d'identité
      const identityDocumentRectoUrls: string[] = [];
      const identityDocumentVersoUrls: string[] = [];

      if (managerData.identity_document_recto.length > 0) {
        for (const rectoFile of managerData.identity_document_recto) {
          const rectoExt = getExtFromFile(rectoFile);
          const rectoFileName = `${authenticatedUser.id}/identity_recto_${Date.now()}_${Math.random().toString(36).substring(7)}.${rectoExt}`;
          const { data: rectoData, error: rectoError } = await supabase.storage
            .from('identity-documents')
            .upload(rectoFileName, rectoFile);

          if (rectoError) throw new Error('Erreur lors de l\'upload du recto: ' + rectoError.message);
          identityDocumentRectoUrls.push(rectoData.path);
        }
      }

      if (managerData.identity_document_verso.length > 0) {
        for (const versoFile of managerData.identity_document_verso) {
          const versoExt = getExtFromFile(versoFile);
          const versoFileName = `${authenticatedUser.id}/identity_verso_${Date.now()}_${Math.random().toString(36).substring(7)}.${versoExt}`;
          const { data: versoData, error: versoError } = await supabase.storage
            .from('identity-documents')
            .upload(versoFileName, versoFile);

          if (versoError) throw new Error('Erreur lors de l\'upload du verso: ' + versoError.message);
          identityDocumentVersoUrls.push(versoData.path);
        }
      }

      showToast('Documents d\'identité uploadés', 'success');

      // Étape 3: Upload des documents d'entreprise (KBIS, assurance, etc.)
      const kbisUrls: string[] = [];
      const insuranceUrls: string[] = [];
      const licenseUrls: string[] = [];

      if (documents.kbis.length > 0) {
        for (const kbisFile of documents.kbis) {
          const kbisExt = getExtFromFile(kbisFile);
          const kbisFileName = `${authenticatedUser.id}/kbis_${Date.now()}_${Math.random().toString(36).substring(7)}.${kbisExt}`;
          const { data: kbisData, error: kbisError } = await supabase.storage
            .from('identity-documents')
            .upload(kbisFileName, kbisFile);

          if (kbisError) throw new Error('Erreur lors de l\'upload du KBIS: ' + kbisError.message);
          kbisUrls.push(kbisData.path);
        }
      }

      if (documents.insurance.length > 0) {
        for (const insuranceFile of documents.insurance) {
          const insuranceExt = getExtFromFile(insuranceFile);
          const insuranceFileName = `${authenticatedUser.id}/insurance_${Date.now()}_${Math.random().toString(36).substring(7)}.${insuranceExt}`;
          const { data: insuranceData, error: insuranceError } = await supabase.storage
            .from('identity-documents')
            .upload(insuranceFileName, insuranceFile);

          if (insuranceError) throw new Error('Erreur lors de l\'upload de l\'assurance: ' + insuranceError.message);
          insuranceUrls.push(insuranceData.path);
        }
      }

      if (documents.license.length > 0) {
        for (const licenseFile of documents.license) {
          const licenseExt = getExtFromFile(licenseFile);
          const licenseFileName = `${authenticatedUser.id}/license_${Date.now()}_${Math.random().toString(36).substring(7)}.${licenseExt}`;
          const { data: licenseData, error: licenseError } = await supabase.storage
            .from('identity-documents')
            .upload(licenseFileName, licenseFile);

          if (licenseError) throw new Error('Erreur lors de l\'upload de la licence: ' + licenseError.message);
          licenseUrls.push(licenseData.path);
        }
      }

      showToast('Documents d\'entreprise uploadés', 'success');

      // Étape 4: Créer le profil déménageur
      const coverageArray = geographicAreas.length > 0
        ? geographicAreas.map(area => area.displayText)
        : companyData.coverage_area
            .split(',')
            .map(area => area.trim())
            .filter(area => area.length > 0);

      const { data: moverData, error: moverError } = await supabase.from('movers').insert({
        user_id: authenticatedUser.id,
        company_name: companyData.company_name,
        siret: companyData.siret,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        postal_code: companyData.postal_code,
        manager_firstname: managerData.manager_firstname,
        manager_lastname: managerData.manager_lastname,
        manager_phone: managerData.manager_phone,
        description: companyData.description || '',
        coverage_area: coverageArray,
        services: companyData.services,
        verification_status: 'pending',
        is_active: false,
        // Bank details
        iban: companyData.iban || null,
        bic: companyData.bic || null,
        bank_name: companyData.bank_name || null,
        account_holder_name: companyData.account_holder_name || null,
        bank_details_verified: false
      }).select().single();

      if (moverError) throw moverError;

      showToast('Profil déménageur créé', 'success');

      // Étape 5: Créer les documents du déménageur
      const moverDocuments = [];

      identityDocumentRectoUrls.forEach((url, index) => {
        moverDocuments.push({
          mover_id: moverData.id,
          document_type: 'identity_recto',
          document_name: `${managerData.identity_type} - Recto - Page ${index + 1}`,
          document_url: url,
          verification_status: 'pending'
        });
      });

      identityDocumentVersoUrls.forEach((url, index) => {
        moverDocuments.push({
          mover_id: moverData.id,
          document_type: 'identity_verso',
          document_name: `${managerData.identity_type} - Verso - Page ${index + 1}`,
          document_url: url,
          verification_status: 'pending'
        });
      });

      kbisUrls.forEach((url, index) => {
        moverDocuments.push({
          mover_id: moverData.id,
          document_type: 'kbis',
          document_name: `Extrait KBIS - Page ${index + 1}`,
          document_url: url,
          verification_status: 'pending'
        });
      });

      insuranceUrls.forEach((url, index) => {
        moverDocuments.push({
          mover_id: moverData.id,
          document_type: 'insurance',
          document_name: `Attestation d'assurance - Page ${index + 1}`,
          document_url: url,
          verification_status: 'pending'
        });
      });

      licenseUrls.forEach((url, index) => {
        moverDocuments.push({
          mover_id: moverData.id,
          document_type: 'license',
          document_name: `Licence de transport - Page ${index + 1}`,
          document_url: url,
          verification_status: 'pending'
        });
      });

      if (moverDocuments.length > 0) {
        const { error: docsError } = await supabase.from('mover_documents').insert(moverDocuments);
        if (docsError) throw docsError;
        showToast('Documents enregistrés', 'success');
      }

      // Étape 6: Appeler la vérification IA des documents d'identité
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session && identityDocumentRectoUrls.length > 0) {
        const { data: publicUrlRecto } = supabase.storage
          .from('identity-documents')
          .getPublicUrl(identityDocumentRectoUrls[0]);

        const verificationResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-identity-document`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentUrl: publicUrlRecto.publicUrl,
              documentType: managerData.identity_type,
              managerName: `${managerData.manager_firstname} ${managerData.manager_lastname}`,
              kbisName: companyData.company_name
            })
          }
        );

        if (verificationResponse.ok) {
          const verificationResult = await verificationResponse.json();
          if (verificationResult.success) {
            showToast('✓ Vérification d\'identité réussie', 'success');

            // Envoyer un email de bienvenue
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'mover_approval',
                  recipientEmail: authData.email,
                  data: {
                    company_name: companyData.company_name
                  }
                })
              }
            );

            // Envoyer une notification de vérification réussie
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'document_verified',
                  recipientEmail: authData.email,
                  data: {
                    documentType: 'Pièce d\'identité',
                    confidence: verificationResult.analysis?.confidenceScore || 0
                  }
                })
              }
            );
          } else {
            showToast('⚠ Vérification en attente de révision manuelle', 'info');
          }
        }
      }

      // Étape 6: Upload des cartes grises des camions
      for (const truck of trucks) {
        if (truck.registration_card) {
          const truckExt = getExtFromFile(truck.registration_card);
          const truckCardFileName = `${authenticatedUser.id}/truck_${truck.registration_number}_${Date.now()}.${truckExt}`;
          const { data: truckCardData, error: truckCardError } = await supabase.storage
            .from('truck-documents')
            .upload(truckCardFileName, truck.registration_card);

          if (truckCardError) throw new Error('Erreur lors de l\'upload de la carte grise: ' + truckCardError.message);

          // Créer l'entrée du camion
          await supabase.from('trucks').insert({
            mover_id: moverData.id,
            registration_number: truck.registration_number,
            capacity_m3: truck.capacity_m3,
            registration_card_url: truckCardData.path
          });
        }
      }

      showToast('Camions enregistrés', 'success');

      // Étape 7: Lancer la vérification IA complète
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          showToast('Lancement de la vérification IA...', 'info');

          const verificationResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comprehensive-mover-verification`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                moverId: moverData.id
              })
            }
          );

          if (verificationResponse.ok) {
            const verificationResult = await verificationResponse.json();
            if (verificationResult.success) {
              const report = verificationResult.report;
              if (report.overallStatus === 'verified') {
                showToast(`Vérification réussie ! Score: ${report.score}/100`, 'success');
              } else if (report.overallStatus === 'needs_review') {
                showToast(`Documents en révision (Score: ${report.score}/100)`, 'info');
              }
            }
          }
        }
      } catch (verificationError) {
        console.error('Erreur lors de la vérification IA:', verificationError);
      }

      // Envoyer l'email de confirmation d'inscription
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'mover_registration_received',
              recipientEmail: authData.email,
              data: {
                company_name: companyData.company_name
              }
            })
          }
        );
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      }

      showToast('✓ Inscription complète !', 'success');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/mover/signup-success');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      showToast(err.message || 'Une erreur est survenue lors de l\'inscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'kbis' | 'insurance' | 'license', files: File[]) => {
    setDocuments(prev => ({ ...prev, [type]: files }));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/7464022/pexels-photo-7464022.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/88 via-white/85 to-blue-50/88"></div>
      <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mx-auto ${
                        s <= step
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 4 && (
                      <div
                        className={`flex-1 h-1 ${
                          s < step ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex">
              {['Compte', 'Gérant', 'Entreprise', 'Documents'].map((label, index) => (
                <div key={index} className="flex-1 text-center text-sm text-gray-600">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Créer votre compte professionnel
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email professionnel <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={authData.email}
                  onChange={(e) => {
                    setAuthData({ ...authData, email: e.target.value });
                    if (fieldErrors.email) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors.email;
                      setFieldErrors(newErrors);
                    }
                  }}
                  onBlur={() => {
                    if (authData.email && !validateEmail(authData.email)) {
                      setFieldErrors(prev => ({ ...prev, email: getEmailValidationMessage() }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authData.password}
                    onChange={(e) => {
                      setAuthData({ ...authData, password: e.target.value });
                      if (fieldErrors.password) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.password;
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={() => {
                      if (authData.password) {
                        const validation = validatePassword(authData.password);
                        if (!validation.isValid) {
                          setFieldErrors(prev => ({ ...prev, password: validation.errors.join('. ') }));
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Minimum 8 caractères avec au moins un chiffre</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={authData.confirmPassword}
                    onChange={(e) => {
                      setAuthData({ ...authData, confirmPassword: e.target.value });
                      if (fieldErrors.confirmPassword) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.confirmPassword;
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={() => {
                      if (authData.confirmPassword && authData.password !== authData.confirmPassword) {
                        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas' }));
                      }
                    }}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Continuer
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Informations du gérant
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={managerData.manager_firstname}
                    onChange={(e) => setManagerData({ ...managerData, manager_firstname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={managerData.manager_lastname}
                    onChange={(e) => setManagerData({ ...managerData, manager_lastname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone personnel <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={managerData.manager_phone}
                  onChange={(e) => setManagerData({ ...managerData, manager_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de pièce d'identité <span className="text-red-500">*</span>
                </label>
                <select
                  value={managerData.identity_type}
                  onChange={(e) => setManagerData({ ...managerData, identity_type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="id_card">Carte d'identité</option>
                  <option value="passport">Passeport</option>
                  <option value="driver_license">Permis de conduire</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Important :</strong> Vous devez importer le recto ET le verso de votre pièce d'identité.
                    Les deux faces seront analysées automatiquement par notre système IA pour vérifier l'authenticité et comparer avec le nom sur le KBIS.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MultiDocumentUploadInput
                    id="identity-document-recto"
                    label="RECTO (Face avant)"
                    description="Photo ou scan de la face avant"
                    required
                    value={managerData.identity_document_recto}
                    onChange={(files) => {
                      setManagerData({ ...managerData, identity_document_recto: files });
                      if (error && files.length > 0) {
                        setError('');
                      }
                    }}
                    maxFiles={5}
                  />

                  <MultiDocumentUploadInput
                    id="identity-document-verso"
                    label="VERSO (Face arrière)"
                    description="Photo ou scan de la face arrière"
                    required
                    value={managerData.identity_document_verso}
                    onChange={(files) => {
                      setManagerData({ ...managerData, identity_document_verso: files });
                      if (error && files.length > 0) {
                        setError('');
                      }
                    }}
                    maxFiles={5}
                  />
                </div>
                {error && (managerData.identity_document_recto.length === 0 || managerData.identity_document_verso.length === 0) && (
                  <div className="text-red-600 text-sm text-center">Les deux faces de la pièce d'identité sont obligatoires</div>
                )}

                {identityVerificationStatus && (
                  <div className={`p-4 rounded-lg ${
                    identityVerificationStatus.verified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      identityVerificationStatus.verified ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {identityVerificationStatus.message}
                    </p>
                    {identityVerificationStatus.namesMatch && (
                      <p className="text-sm text-green-700 mt-1">
                        ✓ Le nom correspond au KBIS
                      </p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Continuer
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Building className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Informations de l'entreprise
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyData.company_name}
                  onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.siret}
                    onChange={(e) => {
                      setCompanyData({ ...companyData, siret: e.target.value });
                      if (fieldErrors.siret) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.siret;
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={() => {
                      if (companyData.siret) {
                        const validation = validateSiret(companyData.siret);
                        if (!validation.isValid) {
                          setFieldErrors(prev => ({ ...prev, siret: validation.error || getSiretValidationMessage() }));
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      fieldErrors.siret ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    maxLength={14}
                  />
                  {fieldErrors.siret && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.siret}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email entreprise <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => {
                      setCompanyData({ ...companyData, email: e.target.value });
                      if (fieldErrors.company_email) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.company_email;
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={() => {
                      if (companyData.email && !validateEmail(companyData.email)) {
                        setFieldErrors(prev => ({ ...prev, company_email: getEmailValidationMessage() }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      fieldErrors.company_email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.company_email && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.company_email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => {
                    setCompanyData({ ...companyData, phone: e.target.value });
                    if (fieldErrors.company_phone) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors.company_phone;
                      setFieldErrors(newErrors);
                    }
                  }}
                  onBlur={() => {
                    if (companyData.phone && !validatePhone(companyData.phone)) {
                      setFieldErrors(prev => ({ ...prev, company_phone: getPhoneValidationMessage() }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    fieldErrors.company_phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {fieldErrors.company_phone && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.company_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.postal_code}
                    onChange={(e) => {
                      setCompanyData({ ...companyData, postal_code: e.target.value });
                      if (fieldErrors.postal_code) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.postal_code;
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={() => {
                      if (companyData.postal_code) {
                        const validation = validatePostalCode(companyData.postal_code);
                        if (!validation.isValid) {
                          setFieldErrors(prev => ({ ...prev, postal_code: validation.error || getPostalCodeValidationMessage() }));
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      fieldErrors.postal_code ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    maxLength={5}
                  />
                  {fieldErrors.postal_code && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.postal_code}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'entreprise
                </label>
                <textarea
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Présentez votre entreprise et votre expérience..."
                />
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Flotte de véhicules <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-gray-600">Ajoutez tous vos camions avec leurs cartes grises</p>
                  </div>
                  <button
                    type="button"
                    onClick={addTruck}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                  >
                    + Ajouter un camion
                  </button>
                </div>
                {fieldErrors.trucks && (
                  <p className="text-red-500 text-sm mb-4">{fieldErrors.trucks}</p>
                )}

                {trucks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucun camion ajouté. Cliquez sur "Ajouter un camion" pour commencer.</p>
                  </div>
                )}

                {trucks.map((truck, index) => (
                  <div key={truck.id} className={`bg-white border-2 rounded-lg p-4 mb-4 ${
                    fieldErrors[`truck_${index}_registration`] || fieldErrors[`truck_${index}_capacity`] || fieldErrors[`truck_${index}_card`]
                      ? 'border-red-300'
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Camion #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeTruck(truck.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro d'immatriculation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={truck.registration_number}
                          onChange={(e) => {
                            updateTruck(truck.id, 'registration_number', e.target.value);
                            if (fieldErrors[`truck_${index}_registration`]) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors[`truck_${index}_registration`];
                              setFieldErrors(newErrors);
                            }
                          }}
                          onBlur={() => {
                            if (truck.registration_number) {
                              const validation = validateRegistrationNumber(truck.registration_number);
                              if (!validation.isValid) {
                                setFieldErrors(prev => ({ ...prev, [`truck_${index}_registration`]: validation.error || getRegistrationNumberValidationMessage() }));
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            fieldErrors[`truck_${index}_registration`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="AA-123-BB"
                          required
                        />
                        {fieldErrors[`truck_${index}_registration`] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors[`truck_${index}_registration`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacité (m³) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.1"
                          value={truck.capacity_m3 || ''}
                          onChange={(e) => updateTruck(truck.id, 'capacity_m3', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="20"
                          required
                        />
                      </div>
                    </div>

                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      truck.registration_card ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        truck.registration_card ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-900 mb-1">Carte grise *</p>
                      <input
                        type="file"
                        onChange={(e) => updateTruck(truck.id, 'registration_card', e.target.files?.[0] || null)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id={`truck-card-${truck.id}`}
                      />
                      <label
                        htmlFor={`truck-card-${truck.id}`}
                        className={`inline-block px-3 py-1.5 rounded-lg transition cursor-pointer text-sm ${
                          truck.registration_card ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {truck.registration_card ? `✓ ${truck.registration_card.name}` : 'Choisir un fichier'}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services proposés *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {serviceOptions.map(service => (
                    <label
                      key={service}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={companyData.services.includes(service)}
                        onChange={() => toggleService(service)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <GeographicAreaSelector
                selectedAreas={geographicAreas}
                onChange={setGeographicAreas}
              />

              {/* Bank Details Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🏦</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Coordonnées bancaires (RIB)
                    </h3>
                    <p className="text-sm text-gray-500">
                      Pour recevoir vos paiements (10% escrow après validation des missions)
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> Ces informations sont nécessaires pour vous verser les 10% de garantie 
                    après chaque mission validée. Sans RIB valide, nous ne pourrons pas effectuer les virements.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyData.iban}
                      onChange={(e) => setCompanyData({ ...companyData, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: FR76 suivi de 23 chiffres</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BIC / SWIFT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={companyData.bic}
                        onChange={(e) => setCompanyData({ ...companyData, bic: e.target.value.toUpperCase() })}
                        placeholder="BNPAFRPP"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                        required
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la banque <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={companyData.bank_name}
                        onChange={(e) => setCompanyData({ ...companyData, bank_name: e.target.value })}
                        placeholder="BNP Paribas, Crédit Agricole, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titulaire du compte <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyData.account_holder_name}
                      onChange={(e) => setCompanyData({ ...companyData, account_holder_name: e.target.value })}
                      placeholder="Nom du titulaire (entreprise ou personne)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Doit correspondre au nom de l'entreprise ou du gérant
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Continuer
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Documents légaux
                </h2>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  <strong>Documents obligatoires :</strong> L'extrait KBIS, l'attestation d'assurance ET la licence de transport sont requis pour finaliser votre inscription. Sans ces 3 documents, vous ne pourrez pas créer votre compte professionnel.
                </p>
              </div>

              <div className="space-y-6">
                <MultiDocumentUploadInput
                  id="kbis"
                  label="Extrait KBIS"
                  description="Document de moins de 3 mois (obligatoire)"
                  required
                  value={documents.kbis}
                  onChange={(files) => {
                    handleFileChange('kbis', files);
                    if (error && files.length > 0) {
                      setError('');
                    }
                  }}
                  maxFiles={10}
                />

                <MultiDocumentUploadInput
                  id="insurance"
                  label="Attestation d'assurance"
                  description="Assurance responsabilité civile professionnelle valide (obligatoire)"
                  required
                  value={documents.insurance}
                  onChange={(files) => {
                    handleFileChange('insurance', files);
                    if (error && files.length > 0) {
                      setError('');
                    }
                  }}
                  maxFiles={10}
                />

                <MultiDocumentUploadInput
                  id="license"
                  label="Licence de transport"
                  description="Obligatoire pour exercer l'activité de déménagement"
                  required={true}
                  value={documents.license}
                  onChange={(files) => {
                    handleFileChange('license', files);
                    if (error && files.length > 0) {
                      setError('');
                    }
                  }}
                  maxFiles={10}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  {loading ? 'Création du compte...' : 'Finaliser l\'inscription'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
