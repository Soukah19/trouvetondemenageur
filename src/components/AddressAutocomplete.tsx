import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: {
    fullAddress: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  id?: string;
}

export default function AddressAutocomplete({
  value,
  onAddressSelect,
  placeholder = 'Commencez à taper une adresse...',
  label,
  required = false,
  error,
  id
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onAddressSelectRef = useRef(onAddressSelect);
  const [inputValue, setInputValue] = useState(value);
  const isInitializedRef = useRef(false);
  // Track if address was selected from autocomplete to prevent unwanted resets
  const hasSelectedAddressRef = useRef(false);
  const selectedAddressRef = useRef<string>('');

  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

  // Only update inputValue from prop if user hasn't selected an address
  // or if the prop value is significantly different (not just formatting changes)
  useEffect(() => {
    // If we have a selected address, only update if value completely changed
    if (hasSelectedAddressRef.current && selectedAddressRef.current) {
      // Check if the new value is the same address (possibly reformatted)
      const normalizedValue = value.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedSelected = selectedAddressRef.current.toLowerCase().replace(/\s+/g, ' ').trim();
      
      // Only update if value is completely different
      if (!normalizedValue.includes(normalizedSelected.split(',')[0]) && 
          !normalizedSelected.includes(normalizedValue.split(',')[0])) {
        setInputValue(value);
        hasSelectedAddressRef.current = false;
        selectedAddressRef.current = '';
      }
    } else {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!inputRef.current || isInitializedRef.current) return;

    let checkInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadGoogleMapsScript = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('Google Maps already loaded, initializing autocomplete for:', id);
        initAutocomplete();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script already in DOM, checking if loaded for:', id);
        checkInterval = setInterval(() => {
          if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            console.log('Google Maps now available for:', id);
            if (checkInterval) clearInterval(checkInterval);
            if (timeoutId) clearTimeout(timeoutId);
            initAutocomplete();
          }
        }, 100);

        timeoutId = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
          console.error('Timeout waiting for Google Maps to load for:', id);
        }, 10000);
        return;
      }

      console.log('Loading Google Maps script with key:', apiKey);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=FR`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        initAutocomplete();
      };
      script.onerror = (error) => {
        console.error('Error loading Google Maps script:', error);
      };
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!inputRef.current) {
        console.log('No input ref available for:', id);
        return;
      }

      if (autocompleteRef.current) {
        console.log('Autocomplete already initialized for:', id);
        return;
      }

      try {
        console.log('Initializing Google Maps Autocomplete for:', id);
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: ['fr', 'be', 'ch', 'lu'] },
          fields: ['address_components', 'formatted_address', 'geometry'],
          types: ['address']
        });

        autocomplete.addListener('place_changed', () => {
          console.log('Place changed event triggered for:', id);
          const place = autocomplete.getPlace();
          console.log('Selected place:', place);

          if (!place.address_components) {
            console.log('No address components found');
            return;
          }

          let street = '';
          let city = '';
          let postalCode = '';
          let country = '';

          place.address_components.forEach((component) => {
            const types = component.types;

            if (types.includes('street_number')) {
              street = component.long_name + ' ';
            }
            if (types.includes('route')) {
              street += component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('postal_code')) {
              postalCode = component.long_name;
            }
            if (types.includes('country')) {
              country = component.short_name;
            }
          });

          if (!street) {
            street = place.formatted_address?.split(',')[0] || '';
          }

          const addressData = {
            fullAddress: place.formatted_address || '',
            street: street.trim(),
            city: city,
            postalCode: postalCode,
            country: country,
            latitude: place.geometry?.location?.lat(),
            longitude: place.geometry?.location?.lng()
          };

          console.log('Address data extracted:', addressData);
          
          // Mark that user has selected an address from autocomplete
          hasSelectedAddressRef.current = true;
          selectedAddressRef.current = place.formatted_address || '';
          
          setInputValue(place.formatted_address || '');
          onAddressSelectRef.current(addressData);
        });

        autocompleteRef.current = autocomplete;
        isInitializedRef.current = true;
        console.log('Autocomplete initialized successfully for:', id);
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    loadGoogleMapsScript();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (autocompleteRef.current) {
        try {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          console.error('Error clearing listeners:', error);
        }
      }
    };
  }, [id]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            // When user manually types, reset the selected address flag
            hasSelectedAddressRef.current = false;
            selectedAddressRef.current = '';
            setInputValue(e.target.value);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-2 text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
