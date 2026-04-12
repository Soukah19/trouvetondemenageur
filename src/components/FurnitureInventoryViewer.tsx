import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FurnitureInventoryModal } from './FurnitureInventoryModal';
import { LoadingSpinner } from './LoadingSpinner';
import type { FurnitureInventory } from './VolumeCalculator';

interface FurnitureInventoryViewerProps {
  quoteRequestId: string;
  onClose: () => void;
}

export function FurnitureInventoryViewer({ quoteRequestId, onClose }: FurnitureInventoryViewerProps) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<FurnitureInventory | null>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);

  useEffect(() => {
    loadInventory();
  }, [quoteRequestId]);

  async function loadInventory() {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('furniture_inventory, from_city, to_city, moving_date, volume_m3')
        .eq('id', quoteRequestId)
        .single();

      if (error) throw error;

      setInventory(data.furniture_inventory);
      setRequestInfo({
        from_city: data.from_city,
        to_city: data.to_city,
        moving_date: data.moving_date,
        volume_m3: data.volume_m3
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Chargement de l'inventaire...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun inventaire</h3>
          <p className="text-gray-600 mb-4">
            Le client n'a pas encore rempli l'inventaire de son mobilier pour cette demande.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <FurnitureInventoryModal
      inventory={inventory}
      onClose={onClose}
      requestInfo={requestInfo}
    />
  );
}
