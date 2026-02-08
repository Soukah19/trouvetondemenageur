export interface DistanceResult {
  distance: number;
  distanceText: string;
  duration: number;
  durationText: string;
}

export async function calculateRealDistance(
  fromAddress: string,
  fromCity: string,
  fromPostalCode: string,
  toAddress: string,
  toCity: string,
  toPostalCode: string
): Promise<DistanceResult | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-distance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          fromAddress,
          fromCity,
          fromPostalCode,
          toAddress,
          toCity,
          toPostalCode,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      return {
        distance: data.distance,
        distanceText: data.distanceText,
        duration: data.duration,
        durationText: data.durationText,
      };
    }

    console.error('Distance calculation failed:', data.error);
    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
