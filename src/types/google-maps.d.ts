declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      fitBounds(bounds: LatLngBounds): void;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
    }

    class LatLng {
      constructor(lat: number, lng: number);
    }

    class LatLngBounds {
      constructor();
      extend(point: LatLng): void;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: string) => void
      ): void;
    }

    class DirectionsService {
      route(
        request: DirectionsRequest,
        callback: (result: DirectionsResult | null, status: string) => void
      ): void;
    }

    class DirectionsRenderer {
      constructor(opts?: DirectionsRendererOptions);
      setDirections(directions: DirectionsResult): void;
    }

    interface MapOptions {
      zoom?: number;
      center?: LatLng;
      mapTypeId?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng;
      map?: Map;
      title?: string;
      icon?: string | { url: string };
      label?: string | { text: string; color: string; fontWeight: string };
    }

    interface GeocoderRequest {
      address: string;
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng;
      };
    }

    interface DirectionsRequest {
      origin: LatLng;
      destination: LatLng;
      travelMode: TravelMode;
    }

    interface DirectionsResult {
      routes: any[];
    }

    interface DirectionsRendererOptions {
      map?: Map;
      suppressMarkers?: boolean;
      polylineOptions?: {
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
      };
    }

    enum TravelMode {
      DRIVING = 'DRIVING',
    }
  }
}

export {};
