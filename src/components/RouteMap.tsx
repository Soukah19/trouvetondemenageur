import { useEffect, useRef } from 'react';

interface RouteMapProps {
  fromAddress: string;
  fromCity: string;
  fromPostalCode: string;
  toAddress: string;
  toCity: string;
  toPostalCode: string;
}

export default function RouteMap({
  fromAddress,
  fromCity,
  fromPostalCode,
  toAddress,
  toCity,
  toPostalCode,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    };

    const initializeMap = async () => {
      if (!mapRef.current) return;

      const geocoder = new google.maps.Geocoder();

      const fromFullAddress = `${fromAddress}, ${fromPostalCode} ${fromCity}, France`;
      const toFullAddress = `${toAddress}, ${toPostalCode} ${toCity}, France`;

      try {
        const [fromResult, toResult] = await Promise.all([
          geocodeAddress(geocoder, fromFullAddress),
          geocodeAddress(geocoder, toFullAddress),
        ]);

        if (fromResult && toResult) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(fromResult);
          bounds.extend(toResult);

          const map = new google.maps.Map(mapRef.current, {
            zoom: 8,
            mapTypeId: 'terrain',
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          mapInstanceRef.current = map;

          new google.maps.Marker({
            position: fromResult,
            map,
            title: `Départ: ${fromCity}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            },
            label: {
              text: 'A',
              color: 'white',
              fontWeight: 'bold',
            },
          });

          new google.maps.Marker({
            position: toResult,
            map,
            title: `Arrivée: ${toCity}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            },
            label: {
              text: 'B',
              color: 'white',
              fontWeight: 'bold',
            },
          });

          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#EF4444',
              strokeWeight: 4,
              strokeOpacity: 0.8,
            },
          });

          directionsService.route(
            {
              origin: fromResult,
              destination: toResult,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK' && result) {
                directionsRenderer.setDirections(result);
              } else {
                map.fitBounds(bounds);
              }
            }
          );
        }
      } catch (error) {
        console.error('Error geocoding addresses:', error);
      }
    };

    const geocodeAddress = (
      geocoder: google.maps.Geocoder,
      address: string
    ): Promise<google.maps.LatLng | null> => {
      return new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].geometry.location);
          } else {
            console.error(`Geocoding failed for ${address}: ${status}`);
            resolve(null);
          }
        });
      });
    };

    loadGoogleMaps();
  }, [fromAddress, fromCity, fromPostalCode, toAddress, toCity, toPostalCode]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg border border-slate-200"
      style={{ minHeight: '400px' }}
    />
  );
}
