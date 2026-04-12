import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Home, Package, CheckCircle, Calculator, User, Shield, AlertCircle, Clock, Navigation } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VolumeCalculator, type FurnitureInventory } from '../components/VolumeCalculator';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { FurniturePhotoUpload } from '../components/FurniturePhotoUpload';
import { validateEmail, validatePhone, getEmailValidationMessage, getPhoneValidationMessage } from '../utils/validation';
import { validateNoContactInfo } from '../utils/contactInfoValidator';
import { showToast } from '../utils/toast';
import { calculateRealDistance } from '../utils/distanceCalculator';
import { calculateMarketPrice } from '../utils/marketPriceCalculation';
import { ClientLayout } from '../components/ClientLayout';

type ClientQuotePageProps = {
  editingQuoteRequestId?: string | null;
};

const homeSizes = ['Studio', 'T1', 'T2', 'T3', 'T4', 'T5+'];
const homeTypes = ['Appartement', 'Maison', 'Bureau'];
const elevatorCapacities = ['2-3 pers', '3-4 pers', '4-5 pers', '6+ pers'];
const services = [
  'Emballage/Déballage',
  'Fourniture de cartons',
  'Démontage/Remontage meubles',
  'Garde-meubles',
  'Transport d\'objets fragiles',
  'Nettoyage après déménagement'
];

export function ClientQuotePage({ editingQuoteRequestId: propEditingQuoteRequestId }: ClientQuotePageProps) {
  const { user } = useAuth();
  const { quoteRequestId } = useParams<{ quoteRequestId: string }>();
  const navigate = useNavigate();
  const editingQuoteRequestId = propEditingQuoteRequestId || quoteRequestId || null;
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingExistingData, setLoadingExistingData] = useState(!!editingQuoteRequestId);
  const [error, setError] = useState('');
  const [showVolumeCalculator, setShowVolumeCalculator] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [additionalInfoErrors, setAdditionalInfoErrors] = useState<string[]>([]);
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);
  const [hasExistingQuotes, setHasExistingQuotes] = useState(false);
  const [furnitureInventory, setFurnitureInventory] = useState<FurnitureInventory | null>(null);
  const [furniturePhotos, setFurniturePhotos] = useState<string[]>([]);
  const [calculatedDistance, setCalculatedDistance] = useState<{
    distance: number;
    distanceText: string;
    duration: number;
    durationText: string;
  } | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    from_address: '',
    from_city: '',
    from_postal_code: '',
    from_latitude: null as number | null,
    from_longitude: null as number | null,
    from_home_size: '',
    from_home_type: '',
    from_surface_m2: null as number | null,
    to_address: '',
    to_city: '',
    to_postal_code: '',
    to_latitude: null as number | null,
    to_longitude: null as number | null,
    to_home_size: '',
    to_home_type: '',
    to_surface_m2: null as number | null,
    moving_date: '',
    date_flexibility_days: 0,
    floor_from: 0,
    floor_to: 0,
    elevator_from: false,
    elevator_to: false,
    elevator_capacity_from: '',
    elevator_capacity_to: '',
    furniture_lift_needed_departure: false,
    furniture_lift_needed_arrival: false,
    carrying_distance_from: '',
    carrying_distance_to: '',
    volume_m3: null as number | null,
    services_needed: [] as string[],
    additional_info: '',
    accepts_groupage: false,
    distance_km: null as number | null,
    market_price_estimate: null as number | null
  });
  const [selectedFormula, setSelectedFormula] = useState<string>('');

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user || userInfoLoaded) return;

      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('first_name, last_name, phone, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!clientError && clientData && clientData.first_name && clientData.last_name && clientData.phone) {
          const fullName = `${clientData.first_name} ${clientData.last_name}`;
          setFormData(prev => ({
            ...prev,
            client_name: fullName,
            client_email: clientData.email || user.email || '',
            client_phone: clientData.phone || ''
          }));

          setCurrentStep(2);
        } else {
          setFormData(prev => ({
            ...prev,
            client_email: user.email || ''
          }));
        }

        setUserInfoLoaded(true);
      } catch (err) {
        console.error('Error loading user info:', err);
        setFormData(prev => ({
          ...prev,
          client_email: user.email || ''
        }));
        setUserInfoLoaded(true);
      }
    };

    loadUserInfo();
  }, [user, userInfoLoaded]);

  useEffect(() => {
    const loadExistingQuoteRequest = async () => {
      if (!editingQuoteRequestId) {
        setLoadingExistingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('id', editingQuoteRequestId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            client_name: data.client_name || '',
            client_email: data.client_email || '',
            client_phone: data.client_phone || '',
            from_address: data.from_address || '',
            from_city: data.from_city || '',
            from_postal_code: data.from_postal_code || '',
            from_home_size: data.from_home_size || '',
            from_home_type: data.from_home_type || '',
            from_surface_m2: data.from_surface_m2,
            to_address: data.to_address || '',
            to_city: data.to_city || '',
            to_postal_code: data.to_postal_code || '',
            to_home_size: data.to_home_size || '',
            to_home_type: data.to_home_type || '',
            to_surface_m2: data.to_surface_m2,
            moving_date: data.moving_date ? new Date(data.moving_date).toISOString().split('T')[0] : '',
            date_flexibility_days: data.date_flexibility_days || 0,
            floor_from: data.floor_from || 0,
            floor_to: data.floor_to || 0,
            elevator_from: data.elevator_from || false,
            elevator_to: data.elevator_to || false,
            elevator_capacity_from: data.elevator_capacity_from || '',
            elevator_capacity_to: data.elevator_capacity_to || '',
            furniture_lift_needed_departure: data.furniture_lift_needed_departure || false,
            furniture_lift_needed_arrival: data.furniture_lift_needed_arrival || false,
            carrying_distance_from: data.carrying_distance_from || '',
            carrying_distance_to: data.carrying_distance_to || '',
            volume_m3: data.volume_m3,
            services_needed: data.services_needed || [],
            additional_info: data.additional_info || '',
            accepts_groupage: data.accepts_groupage || false,
            from_latitude: data.from_latitude || null,
            from_longitude: data.from_longitude || null,
            to_latitude: data.to_latitude || null,
            to_longitude: data.to_longitude || null,
            distance_km: data.distance_km || null,
            market_price_estimate: data.market_price_estimate || null
          });

          // Also set the calculated distance if it exists
          if (data.distance_km) {
            setCalculatedDistance({
              distance: data.distance_km,
              distanceText: `${data.distance_km.toFixed(1)} km`,
              duration: 0,
              durationText: ''
            });
          }

          if (data.furniture_inventory) {
            setFurnitureInventory(data.furniture_inventory as FurnitureInventory);
          }

          if (data.furniture_photos && Array.isArray(data.furniture_photos)) {
            setFurniturePhotos(data.furniture_photos);
          }

          setCurrentStep(2);
          setUserInfoLoaded(true);

          const { data: quotesData } = await supabase
            .from('quotes')
            .select('id')
            .eq('quote_request_id', editingQuoteRequestId);

          if (quotesData && quotesData.length > 0) {
            setHasExistingQuotes(true);
          }
        }
      } catch (err) {
        console.error('Error loading quote request:', err);
        showToast('Erreur lors du chargement de la demande', 'error');
      } finally {
        setLoadingExistingData(false);
      }
    };

    loadExistingQuoteRequest();
  }, [editingQuoteRequestId]);

  // Calculate distance when addresses change
  useEffect(() => {
    const calculateDistance = async () => {
      if (
        formData.from_address && 
        formData.from_city && 
        formData.from_postal_code &&
        formData.to_address && 
        formData.to_city && 
        formData.to_postal_code
      ) {
        setCalculatingDistance(true);
        try {
          const result = await calculateRealDistance(
            formData.from_address,
            formData.from_city,
            formData.from_postal_code,
            formData.to_address,
            formData.to_city,
            formData.to_postal_code
          );
          
          if (result) {
            setCalculatedDistance(result);
            setFormData(prev => ({
              ...prev,
              distance_km: result.distance
            }));
          }
        } catch (error) {
          console.error('Error calculating distance:', error);
        } finally {
          setCalculatingDistance(false);
        }
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(calculateDistance, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.from_address, 
    formData.from_city, 
    formData.from_postal_code,
    formData.to_address, 
    formData.to_city, 
    formData.to_postal_code
  ]);

  // Calculate market price when relevant data changes
  useEffect(() => {
    if (formData.volume_m3 && formData.from_postal_code && formData.to_postal_code) {
      const marketPrice = calculateMarketPrice({
        volume_m3: formData.volume_m3,
        surface_m2: formData.from_surface_m2 || undefined,
        home_size: formData.from_home_size,
        floor_from: formData.floor_from,
        floor_to: formData.floor_to,
        elevator_from: formData.elevator_from,
        elevator_to: formData.elevator_to,
        services_needed: formData.services_needed,
        distance_km: formData.distance_km || undefined,
        from_postal_code: formData.from_postal_code,
        to_postal_code: formData.to_postal_code
      });
      
      setFormData(prev => ({
        ...prev,
        market_price_estimate: marketPrice
      }));
    }
  }, [
    formData.volume_m3,
    formData.from_surface_m2,
    formData.from_home_size,
    formData.floor_from,
    formData.floor_to,
    formData.elevator_from,
    formData.elevator_to,
    formData.services_needed,
    formData.distance_km,
    formData.from_postal_code,
    formData.to_postal_code
  ]);

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(service)
        ? prev.services_needed.filter(s => s !== service)
        : [...prev.services_needed, service]
    }));
  };

  // Détecter automatiquement la formule basée sur les services sélectionnés
  useEffect(() => {
    const services = formData.services_needed;
    const hasEmballage = services.includes('Emballage/Déballage');
    const hasDemontage = services.includes('Démontage/Remontage meubles');
    const hasCartons = services.includes('Fourniture de cartons');

    if (hasEmballage && hasDemontage && hasCartons) {
      setSelectedFormula('premium');
    } else if (hasEmballage && hasDemontage) {
      setSelectedFormula('confort');
    } else if (hasDemontage && !hasEmballage) {
      setSelectedFormula('standard');
    } else if (services.length === 0) {
      setSelectedFormula('eco');
    } else {
      setSelectedFormula('');
    }
  }, [formData.services_needed]);

  const selectFormula = (formula: string) => {
    let newServices: string[] = [];

    switch (formula) {
      case 'eco':
        newServices = [];
        break;
      case 'standard':
        newServices = ['Démontage/Remontage meubles'];
        break;
      case 'confort':
        newServices = ['Emballage/Déballage', 'Démontage/Remontage meubles'];
        break;
      case 'premium':
        newServices = ['Emballage/Déballage', 'Démontage/Remontage meubles', 'Fourniture de cartons'];
        break;
    }

    setFormData(prev => ({
      ...prev,
      services_needed: newServices
    }));
    setSelectedFormula(formula);
  };

  const validateStep1 = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.client_name.trim()) {
      errors.client_name = 'Le nom est requis';
    }

    if (!validateEmail(formData.client_email)) {
      errors.client_email = getEmailValidationMessage();
    }

    if (!validatePhone(formData.client_phone)) {
      errors.client_phone = getPhoneValidationMessage();
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const errors: {[key: string]: string} = {};

    if (!formData.from_address || !formData.from_city || !formData.from_postal_code) {
      errors.from_address = 'Adresse de départ complète requise';
    }

    if (!formData.to_address || !formData.to_city || !formData.to_postal_code) {
      errors.to_address = 'Adresse d\'arrivée complète requise';
    }

    if (!formData.moving_date) {
      errors.moving_date = 'La date de déménagement est requise';
    }

    if (!formData.from_home_size) {
      errors.from_home_size = 'La taille du logement de départ est requise';
    }

    if (!formData.from_home_type) {
      errors.from_home_type = 'Le type de logement de départ est requis';
    }

    if (!formData.to_home_size) {
      errors.to_home_size = 'La taille du logement d\'arrivée est requise';
    }

    if (!formData.to_home_type) {
      errors.to_home_type = 'Le type de logement d\'arrivée est requis';
    }

    if (!formData.volume_m3 || formData.volume_m3 <= 0) {
      errors.volume_m3 = 'Le volume en m³ est obligatoire. Utilisez le calculateur de volume pour l\'estimer.';
    }

    if (!formData.from_surface_m2 || formData.from_surface_m2 <= 0) {
      errors.from_surface_m2 = 'La surface du logement de départ est requise';
    }

    const additionalInfoValidation = validateNoContactInfo(formData.additional_info);
    if (!additionalInfoValidation.isValid) {
      errors.additional_info = 'Les informations complémentaires contiennent des données interdites';
      setAdditionalInfoErrors(additionalInfoValidation.blockedReasons);
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Veuillez corriger les erreurs dans le formulaire');
      showToast('Veuillez corriger les erreurs dans le formulaire', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      if (editingQuoteRequestId) {
        const { data: currentRequest } = await supabase
          .from('quote_requests')
          .select('status, accepted_quote_id')
          .eq('id', editingQuoteRequestId)
          .single();

        const updateData: any = {
          ...formData,
          furniture_inventory: furnitureInventory,
          furniture_photos: furniturePhotos,
          updated_at: new Date().toISOString()
        };

        if (currentRequest?.status === 'accepted') {
          updateData.status = 'quoted';
          updateData.accepted_quote_id = null;
        }

        const { error: updateError } = await supabase
          .from('quote_requests')
          .update(updateData)
          .eq('id', editingQuoteRequestId);

        if (updateError) throw updateError;

        // Expire any pending/accepted quotes
        const { data: quotesToExpire } = await supabase
          .from('quotes')
          .select('id')
          .eq('quote_request_id', editingQuoteRequestId)
          .in('status', ['pending', 'accepted']);

        if (quotesToExpire && quotesToExpire.length > 0) {
          const { error: expireError } = await supabase
            .from('quotes')
            .update({ status: 'expired' })
            .eq('quote_request_id', editingQuoteRequestId)
            .in('status', ['pending', 'accepted']);

          if (expireError) {
            console.error('Error expiring quotes:', expireError);
          }
        }

        // Notify ALL movers who ever submitted a quote for this request
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('id, mover_id, price, status')
          .eq('quote_request_id', editingQuoteRequestId);

        if (quotesData && quotesData.length > 0) {
          // Get unique mover IDs
          const uniqueMoverIds = [...new Set(quotesData.map(q => q.mover_id))];

          const { data: moversData } = await supabase
            .from('movers')
            .select('id, user_id, email, company_name')
            .in('id', uniqueMoverIds);

          if (moversData && moversData.length > 0) {
            const notifications = moversData.map(mover => ({
              user_id: mover.user_id,
              user_type: 'mover',
              title: 'Demande de déménagement modifiée',
              message: `Le client a modifié sa demande de déménagement ${formData.from_city} → ${formData.to_city}. Veuillez vérifier et ajuster votre devis si nécessaire.`,
              type: 'quote_update',
              related_id: editingQuoteRequestId,
              read: false,
              created_at: new Date().toISOString()
            }));

            await supabase.from('notifications').insert(notifications);

            for (const mover of moversData) {
              try {
                await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  },
                  body: JSON.stringify({
                    type: 'quote_update',
                    recipientEmail: mover.email,
                    data: {
                      modifiedBy: 'client',
                      companyName: mover.company_name,
                      fromCity: formData.from_city,
                      fromPostalCode: formData.from_postal_code,
                      toCity: formData.to_city,
                      toPostalCode: formData.to_postal_code,
                      movingDate: new Date(formData.moving_date).toLocaleDateString('fr-FR'),
                      homeSize: `${formData.from_home_type} ${formData.from_home_size}`,
                      volumeM3: formData.volume_m3,
                      surfaceM2: formData.from_surface_m2,
                      servicesNeeded: formData.services_needed
                    }
                  })
                });
              } catch (emailError) {
                console.error('Error sending email notification:', emailError);
              }
            }
          }
        }

        const { data: admins } = await supabase
          .from('admins')
          .select('user_id, email');

        if (admins && admins.length > 0) {
          const adminNotifications = admins.map(admin => ({
            user_id: admin.user_id,
            user_type: 'admin',
            title: 'Client a modifié sa demande',
            message: `Le client a modifié sa demande de déménagement de ${formData.from_city} vers ${formData.to_city} du ${new Date(formData.moving_date).toLocaleDateString('fr-FR')}.`,
            type: 'quote_update',
            related_id: editingQuoteRequestId,
            read: false,
            created_at: new Date().toISOString()
          }));

          await supabase.from('notifications').insert(adminNotifications);
        }

        showToast('Demande modifiée avec succès', 'success');
      } else {
        const { error: submitError } = await supabase
          .from('quote_requests')
          .insert([{
            ...formData,
            furniture_inventory: furnitureInventory,
            furniture_photos: furniturePhotos,
            client_user_id: user?.id || null
          }]);

        if (submitError) throw submitError;

        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: 'quote_request_submitted',
              recipientEmail: formData.client_email,
              data: {
                quoteRequestId: formData.id,
                movingDate: new Date(formData.moving_date).toLocaleDateString('fr-FR'),
                fromCity: `${formData.from_city} (${formData.from_postal_code})`,
                toCity: `${formData.to_city} (${formData.to_postal_code})`,
                propertyType: `${formData.from_home_type} ${formData.from_home_size}`,
                volume: formData.volume_m3,
                fromAddress: formData.from_address,
                toAddress: formData.to_address,
                fromSurface: formData.from_surface_m2,
                toSurface: formData.to_surface_m2,
                floorFrom: formData.floor_from,
                floorTo: formData.floor_to,
                elevatorFrom: formData.elevator_from,
                elevatorTo: formData.elevator_to,
                servicesNeeded: formData.services_needed,
                additionalInfo: formData.additional_info
              }
            })
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
        }

        // Notify all verified movers about the new quote request
        try {
          const { data: verifiedMovers } = await supabase
            .from('movers')
            .select('id, user_id, email, company_name, coverage_type, activity_departments')
            .eq('verification_status', 'verified')
            .eq('is_active', true);

          if (verifiedMovers && verifiedMovers.length > 0) {
            const fromDept = formData.from_postal_code?.substring(0, 2);
            const toDept = formData.to_postal_code?.substring(0, 2);

            const matchingMovers = verifiedMovers.filter(mover => {
              if (mover.coverage_type === 'all_france') return true;
              if (mover.coverage_type === 'departments' && mover.activity_departments?.length > 0) {
                return mover.activity_departments.includes(fromDept) || mover.activity_departments.includes(toDept);
              }
              // Movers without configured zones get all requests (discovery mode)
              return true;
            });

            // Send email notifications to matching movers
            for (const mover of matchingMovers) {
              try {
                await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  },
                  body: JSON.stringify({
                    type: 'activity_zone_new_quote',
                    recipientEmail: mover.email,
                    data: {
                      companyName: mover.company_name,
                      fromCity: formData.from_city,
                      fromPostalCode: formData.from_postal_code,
                      toCity: formData.to_city,
                      toPostalCode: formData.to_postal_code,
                      movingDate: new Date(formData.moving_date).toLocaleDateString('fr-FR'),
                      homeSize: `${formData.from_home_type} ${formData.from_home_size}`,
                      volumeM3: formData.volume_m3,
                      surfaceM2: formData.from_surface_m2,
                      servicesNeeded: formData.services_needed
                    }
                  })
                });
              } catch (moverEmailError) {
                console.error('Error sending mover notification email:', moverEmailError);
              }
            }
          }
        } catch (moverNotifError) {
          console.error('Error notifying movers:', moverNotifError);
        }

        showToast('Demande envoyée avec succès', 'success');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      showToast(err.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ClientLayout title={editingQuoteRequestId ? 'Demande modifiée' : 'Demande envoyée'}>
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {editingQuoteRequestId ? 'Demande modifiée !' : 'Demande envoyée !'}
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {editingQuoteRequestId
                ? hasExistingQuotes
                  ? 'Votre demande a été modifiée avec succès. Les déménageurs ayant soumis un devis ont été notifiés et pourront ajuster leurs propositions.'
                  : 'Votre demande a été modifiée avec succès.'
                : 'Votre demande de devis a été transmise à nos déménageurs partenaires. Vous recevrez des propositions sous 24 heures par email.'
              }
            </p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (loadingExistingData) {
    return (
      <ClientLayout title={editingQuoteRequestId ? 'Modifier la demande' : 'Nouvelle demande de devis'}>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la demande...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title={editingQuoteRequestId ? 'Modifier la demande' : 'Nouvelle demande de devis'}>
    <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {hasExistingQuotes && editingQuoteRequestId && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Vous avez déjà reçu des devis pour cette demande. Les déménageurs seront notifiés de vos modifications.
              </p>
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {editingQuoteRequestId ? 'Modifier la demande' : 'Demande de devis gratuit'}
            </h1>
            <p className="text-gray-600">
              {editingQuoteRequestId
                ? 'Modifiez les informations de votre demande de déménagement'
                : 'Remplissez ce formulaire et recevez jusqu\'à 3 devis de déménageurs professionnels vérifiés'
              }
            </p>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center w-full max-w-md">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
                </div>
                <span className="text-xs mt-2 text-center font-medium">Vos informations</span>
              </div>

              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
                <span className="text-xs mt-2 text-center font-medium">Détails du déménagement</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Vos informations
                  </h3>
                </div>

                {user && userInfoLoaded && formData.client_name && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <strong>Informations pré-remplies :</strong> Vos coordonnées ont été récupérées depuis votre dernière demande. Vous pouvez les modifier si nécessaire.
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => {
                        setFormData({ ...formData, client_name: e.target.value });
                        if (fieldErrors.client_name) {
                          setFieldErrors({ ...fieldErrors, client_name: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                        fieldErrors.client_name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {fieldErrors.client_name && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.client_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => {
                        setFormData({ ...formData, client_email: e.target.value });
                        if (fieldErrors.client_email) {
                          setFieldErrors({ ...fieldErrors, client_email: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                        fieldErrors.client_email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {fieldErrors.client_email && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.client_email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => {
                      setFormData({ ...formData, client_phone: e.target.value });
                      if (fieldErrors.client_phone) {
                        setFieldErrors({ ...fieldErrors, client_phone: '' });
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                      fieldErrors.client_phone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {fieldErrors.client_phone && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.client_phone}</p>
                  )}
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Suivant
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Adresses de déménagement
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Adresse de départ</h4>
                      <div className="space-y-4">
                        <AddressAutocomplete
                          id="from-address"
                          value={`${formData.from_address}${formData.from_city ? ', ' + formData.from_city : ''}${formData.from_postal_code ? ' ' + formData.from_postal_code : ''}`}
                          onAddressSelect={(address) => {
                            setFormData({
                              ...formData,
                              from_address: address.street,
                              from_city: address.city,
                              from_postal_code: address.postalCode,
                              from_latitude: address.latitude || null,
                              from_longitude: address.longitude || null
                            });
                            if (fieldErrors.from_address) {
                              setFieldErrors({ ...fieldErrors, from_address: '' });
                            }
                          }}
                          placeholder="Tapez l'adresse de départ..."
                          label="Adresse complète"
                          required
                          error={fieldErrors.from_address}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Étage
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={formData.floor_from}
                              onChange={(e) => setFormData({ ...formData, floor_from: Number(e.target.value) })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Distance de portage *
                            </label>
                            <select
                              value={formData.carrying_distance_from}
                              onChange={(e) => setFormData({ ...formData, carrying_distance_from: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Sélectionner</option>
                              <option value="10m">10 mètres</option>
                              <option value="20m">20 mètres</option>
                              <option value="30m">30 mètres</option>
                              <option value="40m">40 mètres</option>
                              <option value="plus_40m">Plus de 40 mètres</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Distance du camion à l'entrée</p>
                          </div>
                        </div>
                      </div>
                      {formData.floor_from > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-3">Accès au logement :</p>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.elevator_from}
                                onChange={(e) => setFormData({ ...formData, elevator_from: e.target.checked })}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">Ascenseur disponible</span>
                            </label>
                            {!formData.elevator_from && (
                              <div className="ml-8 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                                Étage sans ascenseur - Monte-meuble recommandé
                              </div>
                            )}
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.furniture_lift_needed_departure}
                                onChange={(e) => setFormData({ ...formData, furniture_lift_needed_departure: e.target.checked })}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">Monte-meuble nécessaire</span>
                            </label>
                          </div>
                        </div>
                      )}
                      {formData.floor_from === 0 && (
                        <div className="mt-4 space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.furniture_lift_needed_departure}
                              onChange={(e) => setFormData({ ...formData, furniture_lift_needed_departure: e.target.checked })}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700">Monte-meuble nécessaire</span>
                          </label>
                        </div>
                      )}
                      {formData.elevator_from && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capacité de l'ascenseur
                          </label>
                          <select
                            value={formData.elevator_capacity_from}
                            onChange={(e) => setFormData({ ...formData, elevator_capacity_from: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Sélectionner</option>
                            {elevatorCapacities.map(capacity => (
                              <option key={capacity} value={capacity}>{capacity}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-4">Caractéristiques du logement de départ</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Taille *
                            </label>
                            <select
                              value={formData.from_home_size}
                              onChange={(e) => {
                                setFormData({ ...formData, from_home_size: e.target.value });
                                if (fieldErrors.from_home_size) {
                                  setFieldErrors({ ...fieldErrors, from_home_size: '' });
                                }
                              }}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                                fieldErrors.from_home_size
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            >
                              <option value="">Sélectionner</option>
                              {homeSizes.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                            {fieldErrors.from_home_size && (
                              <p className="text-red-600 text-sm mt-1">{fieldErrors.from_home_size}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type *
                            </label>
                            <select
                              value={formData.from_home_type}
                              onChange={(e) => {
                                setFormData({ ...formData, from_home_type: e.target.value });
                                if (fieldErrors.from_home_type) {
                                  setFieldErrors({ ...fieldErrors, from_home_type: '' });
                                }
                              }}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                                fieldErrors.from_home_type
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            >
                              <option value="">Sélectionner</option>
                              {homeTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            {fieldErrors.from_home_type && (
                              <p className="text-red-600 text-sm mt-1">{fieldErrors.from_home_type}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Surface (m²) <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="number"
                              placeholder="Ex: 65"
                              value={formData.from_surface_m2 || ''}
                              onChange={(e) => setFormData({ ...formData, from_surface_m2: e.target.value ? Number(e.target.value) : null })}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                fieldErrors.from_surface_m2 ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {fieldErrors.from_surface_m2 && (
                              <p className="mt-1 text-sm text-red-600">{fieldErrors.from_surface_m2}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Adresse d'arrivée</h4>
                      <div className="space-y-4">
                        <AddressAutocomplete
                          id="to-address"
                          value={`${formData.to_address}${formData.to_city ? ', ' + formData.to_city : ''}${formData.to_postal_code ? ' ' + formData.to_postal_code : ''}`}
                          onAddressSelect={(address) => {
                            setFormData({
                              ...formData,
                              to_address: address.street,
                              to_city: address.city,
                              to_postal_code: address.postalCode,
                              to_latitude: address.latitude || null,
                              to_longitude: address.longitude || null
                            });
                            if (fieldErrors.to_address) {
                              setFieldErrors({ ...fieldErrors, to_address: '' });
                            }
                          }}
                          placeholder="Tapez l'adresse d'arrivée..."
                          label="Adresse complète"
                          required
                          error={fieldErrors.to_address}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Étage
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={formData.floor_to}
                              onChange={(e) => setFormData({ ...formData, floor_to: Number(e.target.value) })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Distance de portage *
                            </label>
                            <select
                              value={formData.carrying_distance_to}
                              onChange={(e) => setFormData({ ...formData, carrying_distance_to: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Sélectionner</option>
                              <option value="10m">10 mètres</option>
                              <option value="20m">20 mètres</option>
                              <option value="30m">30 mètres</option>
                              <option value="40m">40 mètres</option>
                              <option value="plus_40m">Plus de 40 mètres</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Distance du camion à l'entrée</p>
                          </div>
                        </div>
                      </div>
                      {formData.floor_to > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-3">Accès au logement :</p>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.elevator_to}
                                onChange={(e) => setFormData({ ...formData, elevator_to: e.target.checked })}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">Ascenseur disponible</span>
                            </label>
                            {!formData.elevator_to && (
                              <div className="ml-8 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                                Étage sans ascenseur - Monte-meuble recommandé
                              </div>
                            )}
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.furniture_lift_needed_arrival}
                                onChange={(e) => setFormData({ ...formData, furniture_lift_needed_arrival: e.target.checked })}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">Monte-meuble nécessaire</span>
                            </label>
                          </div>
                        </div>
                      )}
                      {formData.floor_to === 0 && (
                        <div className="mt-4 space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.furniture_lift_needed_arrival}
                              onChange={(e) => setFormData({ ...formData, furniture_lift_needed_arrival: e.target.checked })}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700">Monte-meuble nécessaire</span>
                          </label>
                        </div>
                      )}
                      {formData.elevator_to && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capacité de l'ascenseur
                          </label>
                          <select
                            value={formData.elevator_capacity_to}
                            onChange={(e) => setFormData({ ...formData, elevator_capacity_to: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Sélectionner</option>
                            {elevatorCapacities.map(capacity => (
                              <option key={capacity} value={capacity}>{capacity}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-4">Caractéristiques du logement d'arrivée</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Taille *
                            </label>
                            <select
                              value={formData.to_home_size}
                              onChange={(e) => {
                                setFormData({ ...formData, to_home_size: e.target.value });
                                if (fieldErrors.to_home_size) {
                                  setFieldErrors({ ...fieldErrors, to_home_size: '' });
                                }
                              }}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                                fieldErrors.to_home_size
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            >
                              <option value="">Sélectionner</option>
                              {homeSizes.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                            {fieldErrors.to_home_size && (
                              <p className="text-red-600 text-sm mt-1">{fieldErrors.to_home_size}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type *
                            </label>
                            <select
                              value={formData.to_home_type}
                              onChange={(e) => {
                                setFormData({ ...formData, to_home_type: e.target.value });
                                if (fieldErrors.to_home_type) {
                                  setFieldErrors({ ...fieldErrors, to_home_type: '' });
                                }
                              }}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                                fieldErrors.to_home_type
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            >
                              <option value="">Sélectionner</option>
                              {homeTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            {fieldErrors.to_home_type && (
                              <p className="text-red-600 text-sm mt-1">{fieldErrors.to_home_type}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Surface (m²)
                            </label>
                            <input
                              type="number"
                              placeholder="Ex: 65"
                              value={formData.to_surface_m2 || ''}
                              onChange={(e) => setFormData({ ...formData, to_surface_m2: e.target.value ? Number(e.target.value) : null })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {(fieldErrors.from_address || fieldErrors.to_address) && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">
                          {fieldErrors.from_address || fieldErrors.to_address}
                        </p>
                      </div>
                    )}

                    {/* Distance Display */}
                    {(formData.from_address && formData.to_address) && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Navigation className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-1">
                              Distance du trajet
                            </h4>
                            {calculatingDistance ? (
                              <div className="flex items-center gap-2 text-blue-700">
                                <Clock className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Calcul en cours...</span>
                              </div>
                            ) : calculatedDistance ? (
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <span className="text-lg font-bold text-blue-700">
                                    {calculatedDistance.distanceText}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-green-700">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">
                                    Durée estimée : {calculatedDistance.durationText}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Entrez les deux adresses complètes pour calculer la distance
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Détails du déménagement
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date souhaitée *
                      </label>
                      <input
                        type="date"
                        value={formData.moving_date}
                        onChange={(e) => {
                          setFormData({ ...formData, moving_date: e.target.value });
                          if (fieldErrors.moving_date) {
                            setFieldErrors({ ...fieldErrors, moving_date: '' });
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.moving_date
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {fieldErrors.moving_date && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.moving_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flexibilité
                      </label>
                      <select
                        value={formData.date_flexibility_days}
                        onChange={(e) => setFormData({ ...formData, date_flexibility_days: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>Date fixe</option>
                        <option value={1}>± 1 jour</option>
                        <option value={2}>± 2 jours</option>
                        <option value={3}>± 3 jours</option>
                        <option value={7}>± 1 semaine</option>
                        <option value={14}>± 2 semaines</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Plus vous êtes flexible, plus vous recevrez de devis
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cubage estimé (m³) <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Ex: 25"
                        value={formData.volume_m3 || ''}
                        onChange={(e) => setFormData({ ...formData, volume_m3: e.target.value ? Number(e.target.value) : null })}
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          fieldErrors.volume_m3 ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowVolumeCalculator(!showVolumeCalculator)}
                        className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Calculator className="w-5 h-5" />
                        Estimer mon cubage réel
                      </button>
                    </div>
                    {fieldErrors.volume_m3 && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.volume_m3}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Utilisez le calculateur pour obtenir une estimation précise basée sur votre inventaire.
                    </p>
                  </div>

                  {showVolumeCalculator && (
  <VolumeCalculator

  onClose={() => setShowVolumeCalculator(false)}
    initialInventory={furnitureInventory || undefined}
    onCalculated={(volume, inventory) => {
      setFormData({ ...formData, volume_m3: volume });
      setFurnitureInventory(inventory);
      setShowVolumeCalculator(false);
      showToast(`Volume calculé: ${volume}m³`, 'success');
    }}
  />
)}

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Choisissez votre formule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => selectFormula('eco')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedFormula === 'eco'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 mb-1">ECO</div>
                        <div className="text-xs text-gray-600">Aucun service</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => selectFormula('standard')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedFormula === 'standard'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 mb-1">STANDARD</div>
                        <div className="text-xs text-gray-600">Démontage/Remontage</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => selectFormula('confort')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedFormula === 'confort'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 mb-1">CONFORT</div>
                        <div className="text-xs text-gray-600">Emballage + Démontage/Remontage</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => selectFormula('premium')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedFormula === 'premium'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 mb-1">PREMIUM</div>
                        <div className="text-xs text-gray-600">Tout inclus</div>
                      </button>
                    </div>

                    {(selectedFormula === 'standard' || selectedFormula === 'confort' || selectedFormula === 'premium') && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Pour un devis précis :</p>
                            <p>
                              Veuillez lister dans les <strong>commentaires additionnels</strong> les meubles à démonter/remonter
                              et ajoutez des <strong>photos</strong> de votre mobilier. Cela permet aux déménageurs de vous proposer
                              un devis adapté et vous protège en cas de sinistre.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Services supplémentaires</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map(service => (
                      <label
                        key={service}
                        className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.services_needed.includes(service)}
                          onChange={() => toggleService(service)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Informations complémentaires
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Photos de votre mobilier
                      </h4>
                      <FurniturePhotoUpload
                        photos={furniturePhotos}
                        onPhotosChange={setFurniturePhotos}
                        maxPhotos={30}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commentaires additionnels
                      </label>
                      <textarea
                        value={formData.additional_info}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, additional_info: value });
                          const validation = validateNoContactInfo(value);
                          setAdditionalInfoErrors(validation.blockedReasons);
                        }}
                        rows={4}
                        placeholder="Objets volumineux, particularités, contraintes d'accès..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none ${
                          additionalInfoErrors.length > 0
                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {additionalInfoErrors.length > 0 && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-800 mb-1">
                                Contenu interdit détecté :
                              </p>
                              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                                {additionalInfoErrors.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accepts_groupage}
                          onChange={(e) => setFormData({ ...formData, accepts_groupage: e.target.checked })}
                          className="w-5 h-5 text-green-600 border-green-300 rounded focus:ring-green-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-green-800">
                            J'accepte le groupage de mon déménagement
                          </span>
                          <p className="text-xs text-green-700 mt-1">
                            En acceptant le groupage, vous permettez au déménageur de combiner votre déménagement avec d'autres,
                            ce qui peut réduire vos coûts. Le déménageur s'engage à respecter votre date et vos horaires.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Envoi en cours...' : 'Recevoir mes devis gratuits'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </ClientLayout>
  );
}
