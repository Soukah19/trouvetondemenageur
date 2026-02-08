import { useState, useEffect } from 'react';
import { MapPin, Clock, Loader } from 'lucide-react';
import { calculateRealDistance, formatDistance } from '../utils/distanceCalculator';

interface DistanceDisplayProps {
  fromAddress: string;
  fromCity: string;
  fromPostalCode: string;
  toAddress: string;
  toCity: string;
  toPostalCode: string;
  showDuration?: boolean;
  className?: string;
}

export function DistanceDisplay({
  fromAddress,
  fromCity,
  fromPostalCode,
  toAddress,
  toCity,
  toPostalCode,
  showDuration = false,
  className = '',
}: DistanceDisplayProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [durationText, setDurationText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDistance = async () => {
      setLoading(true);
      setError(false);

      const result = await calculateRealDistance(
        fromAddress,
        fromCity,
        fromPostalCode,
        toAddress,
        toCity,
        toPostalCode
      );

      if (result) {
        setDistance(result.distance);
        setDistanceText(result.distanceText);
        setDuration(result.duration);
        setDurationText(result.durationText);
      } else {
        setError(true);
      }

      setLoading(false);
    };

    if (fromAddress && fromCity && toAddress && toCity) {
      fetchDistance();
    }
  }, [fromAddress, fromCity, fromPostalCode, toAddress, toCity, toPostalCode]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-slate-500 ${className}`}>
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Calcul distance...</span>
      </div>
    );
  }

  if (error || !distance) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-slate-700">
        <MapPin className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">{distanceText || formatDistance(distance)}</span>
      </div>
      {showDuration && duration && (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Clock className="w-4 h-4 text-green-600" />
          <span className="text-sm">{durationText}</span>
        </div>
      )}
    </div>
  );
}
