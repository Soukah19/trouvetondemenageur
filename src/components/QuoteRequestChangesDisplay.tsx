import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangeData {
  old: any;
  new: any;
}

interface QuoteRequestChange {
  id: string;
  quote_request_id: string;
  changed_fields: Record<string, ChangeData>;
  changed_at: string;
}

interface QuoteRequestChangesDisplayProps {
  quoteRequestId: string;
  className?: string;
}

const fieldLabels: Record<string, string> = {
  from_address: 'Adresse de départ',
  from_city: 'Ville de départ',
  from_postal_code: 'Code postal de départ',
  to_address: "Adresse d'arrivée",
  to_city: "Ville d'arrivée",
  to_postal_code: "Code postal d'arrivée",
  moving_date: 'Date de déménagement',
  from_home_size: 'Taille logement départ',
  from_home_type: 'Type logement départ',
  to_home_size: "Taille logement arrivée",
  to_home_type: "Type logement arrivée",
  volume_m3: 'Volume estimé (m³)',
  from_surface_m2: 'Surface départ (m²)',
  to_surface_m2: 'Surface arrivée (m²)',
  floor_from: 'Étage départ',
  floor_to: 'Étage arrivée',
  elevator_from: 'Ascenseur départ',
  elevator_to: 'Ascenseur arrivée',
  services_needed: 'Services demandés',
  furniture_lift_needed_departure: 'Monte-meuble départ',
  furniture_lift_needed_arrival: 'Monte-meuble arrivée',
};

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Non spécifié';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function QuoteRequestChangesDisplay({ quoteRequestId, className = '' }: QuoteRequestChangesDisplayProps) {
  const [changes, setChanges] = useState<QuoteRequestChange | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChanges();
  }, [quoteRequestId]);

  async function loadChanges() {
    try {
      const { data, error } = await supabase
        .from('quote_request_changes')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('changed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setChanges(data);
    } catch (error) {
      console.error('Erreur lors du chargement des changements:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  if (!changes || Object.keys(changes.changed_fields).length === 0) {
    return null;
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 mb-2">
            Demande modifiée récemment
          </h3>
          <p className="text-xs text-red-700 mb-3">
            Le client a modifié certains détails de sa demande. Veuillez vérifier les changements ci-dessous et ajuster votre devis si nécessaire.
          </p>
          <div className="space-y-2">
            {Object.entries(changes.changed_fields).map(([field, change]) => (
              <div key={field} className="bg-white rounded-md p-3 border border-red-100">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  {fieldLabels[field] || field}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Ancien :</span>{' '}
                    <span className="line-through text-gray-600">{formatValue(change.old)}</span>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Nouveau :</span>{' '}
                    <span className="text-red-900 font-semibold">{formatValue(change.new)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Modifié le {new Date(changes.changed_at).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function getChangedFields(quoteRequestId: string): Promise<Record<string, ChangeData> | null> {
  return supabase
    .from('quote_request_changes')
    .select('changed_fields')
    .eq('quote_request_id', quoteRequestId)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .then(({ data }) => data?.changed_fields || null);
}
