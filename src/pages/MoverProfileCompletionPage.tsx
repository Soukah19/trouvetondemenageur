// MoverProfileCompletionPage with 3-step wizard UI
// Steps: 1. Gérant, 2. Entreprise, 3. Documents

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { isEmailVerificationEnabled } from '../utils/emailVerification';
import { DocumentUploadInput } from '../components/DocumentUploadInput';
import { MultiDocumentUploadInput } from '../components/MultiDocumentUploadInput';
import { GeographicAreaSelector } from '../components/GeographicAreaSelector';
import { User, Building2, FileText, Check, ChevronRight, ChevronLeft, AlertCircle, Truck, Settings, Landmark } from 'lucide-react';

// Available services list
const AVAILABLE_SERVICES = [
  { id: 'demenagement_complet', label: 'Déménagement complet', description: 'Emballage, transport et déballage' },
  { id: 'transport_seul', label: 'Transport seul', description: 'Uniquement le transport des biens' },
  { id: 'emballage', label: 'Service d\'emballage', description: 'Emballage professionnel de vos affaires' },
  { id: 'montage_meubles', label: 'Montage/Démontage meubles', description: 'Assemblage et désassemblage de meubles' },
  { id: 'garde_meuble', label: 'Garde-meuble', description: 'Stockage temporaire de vos biens' },
  { id: 'piano', label: 'Transport de piano', description: 'Transport spécialisé pour pianos' },
  { id: 'objets_lourds', label: 'Objets lourds/volumineux', description: 'Coffres-forts, billards, etc.' },
  { id: 'international', label: 'Déménagement international', description: 'Déménagements vers l\'étranger' },
  { id: 'entreprise', label: 'Déménagement d\'entreprise', description: 'Bureaux et locaux professionnels' },
  { id: 'monte_meuble', label: 'Monte-meuble', description: 'Élévation par l\'extérieur' },
];

interface CompanyData {
  company_name: string;
  siret: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  description: string;
  coverage_area: string;
  services: string[];
  iban: string;
  bic: string;
  bank_name: string;
  account_holder_name: string;
}

interface ManagerData {
  manager_firstname: string;
  manager_lastname: string;
  manager_phone: string;
  identity_type: string;
  identity_document_recto: File[];
  identity_document_verso: File[];
}

interface Documents {
  kbis: File[];
  insurance: File[];
  license: File[];
  urssaf: File[];
  bank_details: File[];
}

interface TruckDoc {
  registration_number: string;
  capacity_m3: number;
  registration_card: File | null;
}

interface FieldErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

const STEPS = [
  { id: 1, name: 'Gérant', icon: User },
  { id: 2, name: 'Entreprise', icon: Building2 },
  { id: 3, name: 'Documents', icon: FileText },
];

// Validation functions
const validateName = (value: string): string => {
  if (!value || !value.trim()) return 'Ce champ est obligatoire';
  if (value.trim().length < 2) return 'Minimum 2 caractères requis';
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value.trim())) return 'Uniquement des lettres';
  return '';
};

const validatePhone = (value: string): string => {
  if (!value || !value.trim()) return 'Ce champ est obligatoire';
  const clean = value.replace(/[\s.-]/g, '');
  if (!/^(0|\+33)[1-9][0-9]{8}$/.test(clean)) return 'Format invalide (ex: 06 12 34 56 78)';
  return '';
};

const validateSiret = (value: string): string => {
  if (!value || !value.trim()) return 'Ce champ est obligatoire';
  const clean = value.replace(/\s/g, '');
  if (!/^[0-9]+$/.test(clean)) return 'Uniquement des chiffres';
  if (clean.length !== 14) return `14 chiffres requis (${clean.length}/14)`;
  
  // Luhn algorithm validation for SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(clean[i], 10);
    // Multiply by 2 for even positions (0, 2, 4, 6, 8, 10, 12)
    if (i % 2 === 0) {
      digit *= 2;
      // If result > 9, subtract 9 (equivalent to summing digits)
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  if (sum % 10 !== 0) return 'Numéro SIRET invalide (vérification Luhn)';
  return '';
};

const validateCompanyName = (value: string): string => {
  if (!value || !value.trim()) return 'Ce champ est obligatoire';
  if (value.trim().length < 2) return 'Minimum 2 caractères requis';
  return '';
};

const validatePostalCode = (value: string): string => {
  if (!value || !value.trim()) return 'Ce champ est obligatoire';
  if (!/^[0-9]{5}$/.test(value)) return 'Code postal invalide (5 chiffres requis)';
  return '';
};

const validateLicensePlate = (value: string): string => {
  if (!value || !value.trim()) return 'Ce champ est obligatoire';
  const clean = value.toUpperCase().replace(/[\s-]/g, '');
  // New format: AA-123-AA (2 letters, 3 digits, 2 letters)
  const newFormat = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
  // Old format: 123-ABC-45 (1-4 digits, 2-3 letters, 2 digits)
  const oldFormat = /^[0-9]{1,4}[A-Z]{2,3}[0-9]{2}$/;
  
  if (!newFormat.test(clean) && !oldFormat.test(clean)) {
    return 'Format invalide (ex: AB-123-CD ou 123-AB-45)';
  }
  return '';
};

export default function MoverProfileCompletionPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  
  const [companyData, setCompanyData] = useState<CompanyData>({
    company_name: '',
    siret: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    description: '',
    coverage_area: '',
    services: [],
    iban: '',
    bic: '',
    bank_name: '',
    account_holder_name: '',
  });

  const [managerData, setManagerData] = useState<ManagerData>({
    manager_firstname: '',
    manager_lastname: '',
    manager_phone: '',
    identity_type: 'cni',
    identity_document_recto: [],
    identity_document_verso: []
  });

  const [documents, setDocuments] = useState<Documents>({
    kbis: [],
    insurance: [],
    license: [],
    urssaf: [],
    bank_details: [],
  });

  const [vehicleOwnership, setVehicleOwnership] = useState<'owns' | 'rents'>('owns');
  const [trucks, setTrucks] = useState<TruckDoc[]>([
    { registration_number: '', capacity_m3: 20, registration_card: null }
  ]);

  // Type for geographic areas that matches GeographicAreaSelector
  type GeographicAreaType = {
    id: string;
    department: string;
    departmentCode: string;
    region: string;
    type: 'city' | 'region';
    displayText: string;
  };

  const [geographicAreas, setGeographicAreas] = useState<GeographicAreaType[]>([]);

  // Get input class based on error state
  const getInputClass = (fieldName: string, baseClass: string = '') => {
    const hasError = touchedFields[fieldName] && fieldErrors[fieldName];
    const errorClass = hasError 
      ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
    return `w-full px-4 py-3 border rounded-lg transition-colors ${errorClass} ${baseClass}`;
  };

  // Handle blur for validation
  const handleBlur = (fieldName: string, value: string, validator: (v: string) => string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    const error = validator(value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Render error message
  const renderError = (fieldName: string) => {
    if (!touchedFields[fieldName] || !fieldErrors[fieldName]) return null;
    return (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {fieldErrors[fieldName]}
      </p>
    );
  };

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        showToast('Vous devez vous connecter pour continuer', 'error');
        navigate('/mover/signup');
        return;
      }

      // Check if email verification is enabled
      const emailVerificationEnabled = isEmailVerificationEnabled();

      // If email verification is enabled and email not confirmed, redirect
      if (emailVerificationEnabled && !user.email_confirmed_at) {
        showToast('Veuillez vérifier votre email avant de continuer', 'error');
        navigate('/mover/verify-email', { state: { email: user.email } });
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || '');
      loadSavedProgress(user.id);
      
      if (emailVerificationEnabled) {
        showToast('✓ Email vérifié, vous pouvez continuer', 'success');
      } else {
        showToast('✓ Vous pouvez compléter votre profil', 'success');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      navigate('/mover/signup');
    }
  };

  const loadSavedProgress = async (uid: string) => {
    try {
      const { data: progress, error } = await supabase
        .from('mover_signup_progress')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error) return;

      if (progress) {
        setCompanyData(prev => ({
          ...prev,
          company_name: progress.company_name || '',
          siret: progress.siret || '',
          email: progress.email || userEmail,
          phone: progress.phone || '',
          address: progress.address || '',
          city: progress.city || '',
          postal_code: progress.postal_code || '',
          description: progress.description || '',
          coverage_area: progress.coverage_area?.join(', ') || '',
          services: progress.services || []
        }));

        setManagerData(prev => ({
          ...prev,
          manager_firstname: progress.manager_firstname || '',
          manager_lastname: progress.manager_lastname || '',
          manager_phone: progress.manager_phone || ''
        }));

        showToast('📋 Progression restaurée', 'info');
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const validateStep = (step: number): boolean => {
    setError('');
    const newErrors: FieldErrors = {};
    const newTouched: TouchedFields = {};
    let hasErrors = false;
    
    if (step === 1) {
      newTouched['manager_firstname'] = true;
      newTouched['manager_lastname'] = true;
      newTouched['manager_phone'] = true;
      
      newErrors['manager_firstname'] = validateName(managerData.manager_firstname);
      newErrors['manager_lastname'] = validateName(managerData.manager_lastname);
      newErrors['manager_phone'] = validatePhone(managerData.manager_phone);
      
      if (newErrors['manager_firstname'] || newErrors['manager_lastname'] || newErrors['manager_phone']) {
        hasErrors = true;
      }
      
      if (managerData.identity_document_recto.length === 0) {
        setError('La pièce d\'identité (recto) est obligatoire');
        hasErrors = true;
      }
    }
    
    if (step === 2) {
      newTouched['company_name'] = true;
      newTouched['siret'] = true;
      newTouched['company_phone'] = true;
      newTouched['postal_code'] = true;
      newTouched['services'] = true;
      
      newErrors['company_name'] = validateCompanyName(companyData.company_name);
      newErrors['siret'] = validateSiret(companyData.siret);
      newErrors['company_phone'] = validatePhone(companyData.phone);
      newErrors['postal_code'] = validatePostalCode(companyData.postal_code);
      
      if (newErrors['company_name'] || newErrors['siret'] || newErrors['company_phone'] || newErrors['postal_code']) {
        hasErrors = true;
      }
      
      if (companyData.services.length === 0) {
        newErrors['services'] = 'Sélectionnez au moins un service';
        hasErrors = true;
      }

      // Validate bank details
      if (!companyData.iban.trim()) {
        newErrors['iban'] = 'L\'IBAN est requis';
        newTouched['iban'] = true;
        hasErrors = true;
      }
      if (!companyData.bic.trim()) {
        newErrors['bic'] = 'Le BIC est requis';
        newTouched['bic'] = true;
        hasErrors = true;
      }
      if (!companyData.bank_name.trim()) {
        newErrors['bank_name'] = 'Le nom de la banque est requis';
        newTouched['bank_name'] = true;
        hasErrors = true;
      }
      if (!companyData.account_holder_name.trim()) {
        newErrors['account_holder_name'] = 'Le titulaire du compte est requis';
        newTouched['account_holder_name'] = true;
        hasErrors = true;
      }
      
      // Validate trucks only if mover owns vehicles
      if (vehicleOwnership === 'owns') {
        let hasCompleteTruck = false;
        for (let i = 0; i < trucks.length; i++) {
          const truck = trucks[i];
          const plateError = validateLicensePlate(truck.registration_number);

          newTouched[`truck_plate_${i}`] = true;
          newTouched[`truck_card_${i}`] = true;

          if (plateError) {
            newErrors[`truck_plate_${i}`] = plateError;
            hasErrors = true;
          }
          if (!truck.registration_card) {
            newErrors[`truck_card_${i}`] = 'Carte grise obligatoire';
            hasErrors = true;
          }

          // Check if this truck is complete
          if (!plateError && truck.registration_card) {
            hasCompleteTruck = true;
          }
        }

        // At least one complete truck required
        if (!hasCompleteTruck) {
          newErrors['trucks'] = 'Ajoutez au moins un véhicule complet (immatriculation + carte grise)';
          newTouched['trucks'] = true;
          hasErrors = true;
        }
      }
    }
    
    if (step === 3) {
      if (documents.kbis.length === 0) {
        setError('L\'extrait KBIS est obligatoire');
        hasErrors = true;
      } else if (documents.insurance.length === 0) {
        setError('L\'attestation d\'assurance RC Pro est obligatoire');
        hasErrors = true;
      } else if (documents.license.length === 0) {
        setError('La licence de transport est obligatoire');
        hasErrors = true;
      } else if (documents.urssaf.length === 0) {
        setError('L\'attestation URSSAF est obligatoire');
        hasErrors = true;
      }
    }
    
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    setTouchedFields(prev => ({ ...prev, ...newTouched }));
    
    return !hasErrors;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleService = (serviceId: string) => {
    setCompanyData(prev => {
      const newServices = prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId];
      
      // Clear error if services selected
      if (newServices.length > 0 && fieldErrors['services']) {
        setFieldErrors(fe => ({ ...fe, services: '' }));
      }
      
      return { ...prev, services: newServices };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    if (!userId) {
      setError('Session expirée, veuillez vous reconnecter');
      navigate('/mover/signup');
      return;
    }

    setLoading(true);

    try {
      showToast('Enregistrement des informations...', 'info');

      const coverageArray = geographicAreas.length > 0
        ? geographicAreas.map(area => area.displayText)
        : companyData.coverage_area.split(',').map(a => a.trim()).filter(a => a);

      // Try to update signup progress if table exists, but don't fail if it doesn't
      try {
        await supabase
          .from('mover_signup_progress')
          .upsert({
            user_id: userId,
            email: companyData.email || userEmail, // Professional email
            company_name: companyData.company_name,
            siret: companyData.siret,
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
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } catch (progressErr) {
        // Non-blocking, continue without signup progress
        console.log('Signup progress update skipped:', progressErr);
      }

      showToast('✓ Informations enregistrées', 'success');

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

      // Upload identity documents
      showToast('Upload des pièces d\'identité...', 'info');
      
      const identityRectoUrls: string[] = [];
      for (const file of managerData.identity_document_recto) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/identity_recto_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload pièce d\'identité recto: ' + uploadError.message);
        identityRectoUrls.push(data.path);
      }

      const identityVersoUrls: string[] = [];
      for (const file of managerData.identity_document_verso) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/identity_verso_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload pièce d\'identité verso: ' + uploadError.message);
        identityVersoUrls.push(data.path);
      }

      showToast('✓ Pièces d\'identité uploadées', 'success');

      // Upload company documents
      showToast('Upload des documents entreprise...', 'info');

      const kbisUrls: string[] = [];
      for (const file of documents.kbis) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/kbis_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload KBIS: ' + uploadError.message);
        kbisUrls.push(data.path);
      }

      const insuranceUrls: string[] = [];
      for (const file of documents.insurance) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/insurance_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload assurance: ' + uploadError.message);
        insuranceUrls.push(data.path);
      }

      const licenseUrls: string[] = [];
      for (const file of documents.license) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/license_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload licence: ' + uploadError.message);
        licenseUrls.push(data.path);
      }

      const urssafUrls: string[] = [];
      for (const file of documents.urssaf) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/urssaf_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload attestation URSSAF: ' + uploadError.message);
        urssafUrls.push(data.path);
      }

      const bankDetailsUrls: string[] = [];
      for (const file of documents.bank_details) {
        const fileExt = getExtFromFile(file);
        const fileName = `${userId}/bank_details_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('identity-documents').upload(fileName, file);
        if (uploadError) throw new Error('Erreur upload RIB: ' + uploadError.message);
        bankDetailsUrls.push(data.path);
      }

      showToast('✓ Documents entreprise uploadés', 'success');

      // Create mover profile
      showToast('Création du profil déménageur...', 'info');

      const { data: moverData, error: moverError } = await supabase
        .from('movers')
        .upsert({
          user_id: userId,
          company_name: companyData.company_name,
          siret: companyData.siret,
          email: companyData.email || userEmail, // Use professional email, fallback to account email
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          postal_code: companyData.postal_code,
          description: companyData.description,
          coverage_area: coverageArray,
          services: companyData.services,
          manager_firstname: managerData.manager_firstname,
          manager_lastname: managerData.manager_lastname,
          manager_phone: managerData.manager_phone,
          vehicle_ownership: vehicleOwnership,
          iban: companyData.iban || null,
          bic: companyData.bic || null,
          bank_name: companyData.bank_name || null,
          account_holder_name: companyData.account_holder_name || null,
          bank_details_verified: false,
          verification_status: 'pending',
          is_active: false
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (moverError) throw moverError;

      const moverId = moverData.id;
      showToast('✓ Profil créé', 'success');

      // Insert documents into verification_documents table
      showToast('Enregistrement des documents...', 'info');

      const documentInserts = [];

      // Identity documents
      for (const url of identityRectoUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'id_card',
          document_url: url,
          verification_status: 'pending'
        });
      }

      for (const url of identityVersoUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'id_card',
          document_url: url,
          verification_status: 'pending'
        });
      }

      // Company documents
      for (const url of kbisUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'kbis',
          document_url: url,
          verification_status: 'pending'
        });
      }

      for (const url of insuranceUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'insurance',
          document_url: url,
          verification_status: 'pending'
        });
      }

      for (const url of licenseUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'transport_license',
          document_url: url,
          verification_status: 'pending'
        });
      }

      for (const url of urssafUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'urssaf',
          document_url: url,
          verification_status: 'pending'
        });
      }

      for (const url of bankDetailsUrls) {
        documentInserts.push({
          mover_id: moverId,
          document_type: 'bank_details',
          document_url: url,
          verification_status: 'pending'
        });
      }

      if (documentInserts.length > 0) {
        const { error: docsError } = await supabase
          .from('verification_documents')
          .insert(documentInserts);

        if (docsError) throw docsError;
      }

      showToast('✓ Documents enregistrés', 'success');

      // Upload truck documents (only if mover owns vehicles)
      if (vehicleOwnership === 'owns') {
        showToast('Enregistrement des véhicules...', 'info');

        for (const truck of trucks) {
          if (truck.registration_card && truck.registration_number) {
            const truckExt = getExtFromFile(truck.registration_card);
            const truckCardFileName = `${userId}/truck_${truck.registration_number}_${Date.now()}.${truckExt}`;
            const { data: truckCardData, error: truckCardError } = await supabase.storage
              .from('truck-documents')
              .upload(truckCardFileName, truck.registration_card);

            if (truckCardError) throw new Error('Erreur upload carte grise: ' + truckCardError.message);

            await supabase.from('trucks').insert({
              mover_id: moverId,
              registration_number: truck.registration_number,
              capacity_m3: truck.capacity_m3,
              registration_card_url: truckCardData.path
            });
          }
        }
      }

      showToast('🎉 Inscription complète !', 'success');

      // Send profile-completed email (documents submitted, awaiting validation)
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              userType: 'mover',
              email: currentUser?.email || '',
              userId: currentUser?.id || '',
              companyName: companyData.company_name,
              isProfileCompleted: true,
            }),
          }
        );
      } catch (emailError) {
        console.error('Error sending profile completed email:', emailError);
      }

      navigate('/mover/signup-success');

    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
      showToast(err.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'kbis' | 'insurance' | 'license' | 'urssaf' | 'bank_details', files: File[]) => {
    setDocuments(prev => ({ ...prev, [type]: files }));
  };

  const addTruck = () => {
    setTrucks([...trucks, { registration_number: '', capacity_m3: 20, registration_card: null }]);
  };

  const removeTruck = (index: number) => {
    setTrucks(trucks.filter((_, i) => i !== index));
  };

  const updateTruck = (index: number, field: keyof TruckDoc, value: any) => {
    const newTrucks = [...trucks];
    newTrucks[index] = { ...newTrucks[index], [field]: value };
    setTrucks(newTrucks);
  };

  // Stepper Component
  const Stepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-gray-200 text-gray-500'}
                  `}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : step.id}
                </div>
                <span className={`mt-2 text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-24 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  // Step 1: Manager Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Informations du gérant</h2>
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
            onBlur={(e) => handleBlur('manager_firstname', e.target.value, validateName)}
            className={getInputClass('manager_firstname')}
            placeholder="Votre prénom"
          />
          {renderError('manager_firstname')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={managerData.manager_lastname}
            onChange={(e) => setManagerData({ ...managerData, manager_lastname: e.target.value })}
            onBlur={(e) => handleBlur('manager_lastname', e.target.value, validateName)}
            className={getInputClass('manager_lastname')}
            placeholder="Votre nom"
          />
          {renderError('manager_lastname')}
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
          onBlur={(e) => handleBlur('manager_phone', e.target.value, validatePhone)}
          className={getInputClass('manager_phone')}
          placeholder="06 12 34 56 78"
        />
        {renderError('manager_phone')}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de pièce d'identité <span className="text-red-500">*</span>
        </label>
        <select
          value={managerData.identity_type}
          onChange={(e) => setManagerData({ ...managerData, identity_type: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="cni">Carte d'identité</option>
          <option value="passport">Passeport</option>
          <option value="residence_permit">Titre de séjour</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Important :</p>
          <p>Vous devez importer le recto ET le verso de votre pièce d'identité. Les deux faces seront analysées automatiquement par notre système IA pour vérifier l'authenticité et comparer avec le nom sur le KBIS.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MultiDocumentUploadInput
          id="identity_document_recto"
          label="Pièce d'identité - Recto *"
          description="Face avant de votre pièce d'identité"
          required
          value={managerData.identity_document_recto}
          onChange={(files) => setManagerData({ ...managerData, identity_document_recto: files })}
          maxFiles={3}
        />

        <MultiDocumentUploadInput
          id="identity_document_verso"
          label="Pièce d'identité - Verso"
          description="Face arrière de votre pièce d'identité"
          value={managerData.identity_document_verso}
          onChange={(files) => setManagerData({ ...managerData, identity_document_verso: files })}
          maxFiles={3}
        />
      </div>
    </div>
  );

  // Step 2: Company Information
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Informations de l'entreprise</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'entreprise <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={companyData.company_name}
            onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
            onBlur={(e) => handleBlur('company_name', e.target.value, validateCompanyName)}
            className={getInputClass('company_name')}
            placeholder="Ma Société SARL"
          />
          {renderError('company_name')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SIRET <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={companyData.siret}
            onChange={(e) => setCompanyData({ ...companyData, siret: e.target.value.replace(/\D/g, '').slice(0, 14) })}
            onBlur={(e) => handleBlur('siret', e.target.value, validateSiret)}
            className={getInputClass('siret')}
            placeholder="12345678901234"
          />
          {renderError('siret')}
          {!fieldErrors['siret'] && <p className="mt-1 text-xs text-gray-500">14 chiffres sans espaces</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone entreprise <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={companyData.phone}
            onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
            onBlur={(e) => handleBlur('company_phone', e.target.value, validatePhone)}
            className={getInputClass('company_phone')}
            placeholder="01 23 45 67 89"
          />
          {renderError('company_phone')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email professionnel <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={companyData.email}
            onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="contact@votre-entreprise.fr"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email de contact pour les clients (peut être différent de votre email de connexion)
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
        <input
          type="text"
          value={companyData.address}
          onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="123 rue de la Paix"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <input
            type="text"
            value={companyData.city}
            onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paris"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code postal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={companyData.postal_code}
            onChange={(e) => setCompanyData({ ...companyData, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            onBlur={(e) => handleBlur('postal_code', e.target.value, validatePostalCode)}
            className={getInputClass('postal_code')}
            placeholder="75001"
          />
          {renderError('postal_code')}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'entreprise</label>
        <textarea
          rows={4}
          value={companyData.description}
          onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Présentez votre entreprise, vos spécialités, votre expérience..."
        />
      </div>

      {/* Fleet Vehicles Section */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Véhicules <span className="text-red-500">*</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setVehicleOwnership('owns')}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
              vehicleOwnership === 'owns'
                ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            🚚 J'ai mes propres véhicules
          </button>
          <button
            type="button"
            onClick={() => setVehicleOwnership('rents')}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
              vehicleOwnership === 'rents'
                ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            🔑 Je loue des véhicules
          </button>
        </div>

        {vehicleOwnership === 'rents' && (
          <div className="text-center py-6 text-gray-500 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">Vous louez des véhicules — aucun document véhicule requis.</p>
            <p className="text-xs text-blue-500 mt-1">Vous pourrez modifier cette information depuis "Informations de l'entreprise".</p>
          </div>
        )}

        {vehicleOwnership === 'owns' && (<>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Ajoutez au moins un véhicule avec son immatriculation et sa carte grise.
            </p>
            <button
              type="button"
              onClick={addTruck}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Ajouter un véhicule
            </button>
          </div>

          {touchedFields['trucks'] && fieldErrors['trucks'] && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {fieldErrors['trucks']}
            </div>
          )}

          {trucks.map((truck, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-medium text-gray-900">Véhicule {index + 1}</h4>
                {trucks.length > 1 && (
                  <button type="button" onClick={() => removeTruck(index)} className="text-red-600 hover:text-red-700 text-sm">
                    Supprimer
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro d'immatriculation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={truck.registration_number}
                    onChange={(e) => updateTruck(index, 'registration_number', e.target.value.toUpperCase())}
                    onBlur={(e) => handleBlur(`truck_plate_${index}`, e.target.value, validateLicensePlate)}
                    className={getInputClass(`truck_plate_${index}`)}
                    placeholder="AB-123-CD"
                  />
                  {renderError(`truck_plate_${index}`)}
                  {!fieldErrors[`truck_plate_${index}`] && (
                    <p className="mt-1 text-xs text-gray-500">Format: AB-123-CD ou 123-AB-45</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Volume (m³)</label>
                  <input
                    type="number"
                    value={truck.capacity_m3}
                    onChange={(e) => updateTruck(index, 'capacity_m3', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    step="0.1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carte grise <span className="text-red-500">*</span>
                  </label>
                  <DocumentUploadInput
                    id={`truck_registration_${index}`}
                    label=""
                    value={truck.registration_card}
                    onChange={(file) => updateTruck(index, 'registration_card', file)}
                  />
                  {touchedFields[`truck_card_${index}`] && fieldErrors[`truck_card_${index}`] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {fieldErrors[`truck_card_${index}`]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>)}
      </div>

      {/* Services Section */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Services proposés <span className="text-red-500">*</span>
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez tous les services que vous proposez à vos clients.
        </p>
        
        {touchedFields['services'] && fieldErrors['services'] && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {fieldErrors['services']}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_SERVICES.map((service) => {
            const isSelected = companyData.services.includes(service.id);
            return (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{service.label}</p>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coordonnées bancaires (RIB) */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-600" /> Coordonnées bancaires (RIB)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IBAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyData.iban}
              onChange={(e) => setCompanyData({ ...companyData, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent font-mono ${fieldErrors.iban && touchedFields.iban ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            <p className="text-xs text-gray-400 mt-0.5">Format : FR76 suivi de 23 chiffres</p>
            {fieldErrors.iban && touchedFields.iban && <p className="text-red-500 text-sm mt-1">{fieldErrors.iban}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BIC / SWIFT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyData.bic}
                onChange={(e) => setCompanyData({ ...companyData, bic: e.target.value.toUpperCase() })}
                placeholder="BNPAFRPP"
                maxLength={11}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent font-mono ${fieldErrors.bic && touchedFields.bic ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              {fieldErrors.bic && touchedFields.bic && <p className="text-red-500 text-sm mt-1">{fieldErrors.bic}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la banque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyData.bank_name}
                onChange={(e) => setCompanyData({ ...companyData, bank_name: e.target.value })}
                placeholder="BNP Paribas, Crédit Agricole..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${fieldErrors.bank_name && touchedFields.bank_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              {fieldErrors.bank_name && touchedFields.bank_name && <p className="text-red-500 text-sm mt-1">{fieldErrors.bank_name}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulaire du compte <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyData.account_holder_name}
              onChange={(e) => setCompanyData({ ...companyData, account_holder_name: e.target.value })}
              placeholder="Nom du titulaire (entreprise ou personne)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${fieldErrors.account_holder_name && touchedFields.account_holder_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            {fieldErrors.account_holder_name && touchedFields.account_holder_name && <p className="text-red-500 text-sm mt-1">{fieldErrors.account_holder_name}</p>}
          </div>
        </div>
      </div>

      {/* Geographic Areas */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Zones d'intervention</label>
        <GeographicAreaSelector
          selectedAreas={geographicAreas}
          onChange={setGeographicAreas}
        />
      </div>
    </div>
  );

  // Step 3: Documents
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Documents obligatoires</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Documents requis</p>
          <p>Tous les documents ci-dessous sont obligatoires pour valider votre inscription. Ils seront vérifiés par notre équipe sous 24-48h.</p>
        </div>
      </div>

      <div className="space-y-6">
        <MultiDocumentUploadInput
          id="kbis"
          label="Extrait KBIS (moins de 3 mois) *"
          description="Document officiel attestant de l'existence légale de votre entreprise"
          required
          value={documents.kbis}
          onChange={(files) => handleFileChange('kbis', files)}
          maxFiles={5}
        />

        <MultiDocumentUploadInput
          id="insurance"
          label="Attestation d'assurance RC Pro *"
          description="Responsabilité Civile Professionnelle couvrant votre activité de déménagement"
          required
          value={documents.insurance}
          onChange={(files) => handleFileChange('insurance', files)}
          maxFiles={5}
        />

        <MultiDocumentUploadInput
          id="license"
          label="Licence de transport *"
          description="Licence de transport de marchandises ou capacité de transport"
          required
          value={documents.license}
          onChange={(files) => handleFileChange('license', files)}
          maxFiles={5}
        />

        <MultiDocumentUploadInput
          id="urssaf"
          label="Attestation URSSAF *"
          description="Attestation de vigilance URSSAF en cours de validité"
          required
          value={documents.urssaf}
          onChange={(files) => handleFileChange('urssaf', files)}
          maxFiles={5}
        />

        <MultiDocumentUploadInput
          id="bank_details"
          label="RIB / Relevé d'Identité Bancaire"
          description="Document bancaire (RIB, relevé de compte) pour les virements"
          required={false}
          value={documents.bank_details}
          onChange={(files) => handleFileChange('bank_details', files)}
          maxFiles={5}
        />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 -mt-3">
          <p className="text-blue-800 text-xs">
            <strong>ℹ️ Recommandé :</strong> Joignez votre RIB pour faciliter et accélérer le traitement de vos paiements après chaque mission.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Complétez votre profil professionnel
            </h1>
            <p className="text-gray-600">✓ Email vérifié - Dernières étapes avant d'être visible</p>
          </div>

          <Stepper />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="min-h-[400px]">
              {renderCurrentStep()}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Précédent
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Finalisation...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Finaliser mon inscription
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Vos documents seront vérifiés sous 24-48h. Vous recevrez un email dès validation.
          </p>
        </div>
      </div>
    </div>
  );
}