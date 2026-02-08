import { useState, useEffect } from 'react';
import { X, MapPin, Home, Calendar, Package, FileText, AlertCircle, Save, Loader, Navigation, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import AddressAutocomplete from '../AddressAutocomplete';
import { FurnitureInventoryModal } from '../FurnitureInventoryModal';
import { DistanceDisplay } from '../DistanceDisplay';
import { VolumeCalculator, type FurnitureInventory } from '../VolumeCalculator';
import { QuoteRequestChangesDisplay } from '../QuoteRequestChangesDisplay';

interface QuoteRequestDetailModalProps {
  quoteRequestId: string;
  onClose: () => void;
  onSave?: () => void;
  readOnly?: boolean;
}

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

export default function QuoteRequestDetailModal({ quoteRequestId, onClose, onSave, readOnly = false }: QuoteRequestDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showVolumeCalculator, setShowVolumeCalculator] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = !readOnly || isEditing;

  useEffect(() => {
    loadQuoteRequest();
  }, [quoteRequestId]);

  const loadQuoteRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteRequestId)
        .single();

      if (error) throw error;

      const loadedData = {
        ...data,
        services_needed: data.services_needed || [],
        moving_date: data.moving_date ? new Date(data.moving_date).toISOString().split('T')[0] : '',
      };
      setFormData(loadedData);

      if (loadedData.from_address && loadedData.to_address) {
        calculateDistance(loadedData.from_address, loadedData.from_city, loadedData.from_postal_code, loadedData.to_address, loadedData.to_city, loadedData.to_postal_code);
      }
    } catch (error) {
      console.error('Error loading quote request:', error);
      showToast('Erreur lors du chargement de la demande', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async (fromAddress: string, fromCity: string, fromPostal: string, toAddress: string, toCity: string, toPostal: string) => {
    if (!fromAddress || !toAddress) return;

    const fromFull = `${fromAddress}, ${fromCity} ${fromPostal}`;
    const toFull = `${toAddress}, ${toCity} ${toPostal}`;

    try {
      const service = new google.maps.DistanceMatrixService();
      const result = await service.getDistanceMatrix({
        origins: [fromFull],
        destinations: [toFull],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      });

      if (result.rows[0]?.elements[0]?.distance) {
        const distanceInKm = Math.round(result.rows[0].elements[0].distance.value / 1000);
        setDistance(distanceInKm);
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
    }
  };

  const handleInventoryUpdate = (volume: number, inventory: FurnitureInventory) => {
    setFormData({
      ...formData,
      volume_m3: volume,
      furniture_inventory: inventory
    });
    setShowVolumeCalculator(false);
    showToast('Inventaire mis à jour', 'success');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        from_address: formData.from_address,
        from_city: formData.from_city,
        from_postal_code: formData.from_postal_code,
        from_home_size: formData.from_home_size,
        from_home_type: formData.from_home_type,
        from_surface_m2: formData.from_surface_m2,
        to_address: formData.to_address,
        to_city: formData.to_city,
        to_postal_code: formData.to_postal_code,
        to_home_size: formData.to_home_size,
        to_home_type: formData.to_home_type,
        to_surface_m2: formData.to_surface_m2,
        moving_date: formData.moving_date,
        date_flexibility_days: formData.date_flexibility_days,
        floor_from: formData.floor_from,
        floor_to: formData.floor_to,
        elevator_from: formData.elevator_from,
        elevator_to: formData.elevator_to,
        elevator_capacity_from: formData.elevator_capacity_from,
        elevator_capacity_to: formData.elevator_capacity_to,
        furniture_lift_needed_departure: formData.furniture_lift_needed_departure,
        furniture_lift_needed_arrival: formData.furniture_lift_needed_arrival,
        volume_m3: formData.volume_m3,
        furniture_inventory: formData.furniture_inventory,
        services_needed: formData.services_needed,
        additional_info: formData.additional_info,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('quote_requests')
        .update(updateData)
        .eq('id', quoteRequestId);

      if (error) throw error;

      await supabase
        .from('quotes')
        .update({ status: 'expired' })
        .eq('quote_request_id', quoteRequestId)
        .eq('status', 'pending');

      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id, mover_id, price, status')
        .eq('quote_request_id', quoteRequestId);

      if (quotesData && quotesData.length > 0) {
        const moverIds = quotesData.map(q => q.mover_id);

        const { data: moversData } = await supabase
          .from('movers')
          .select('id, user_id, email, company_name')
          .in('id', moverIds);

        if (moversData && moversData.length > 0) {
          const notifications = moversData.map(mover => ({
            user_id: mover.user_id,
            user_type: 'mover',
            title: 'Demande de déménagement modifiée',
            message: 'Un administrateur a modifié la demande de déménagement. Veuillez vérifier et ajuster votre devis si nécessaire.',
            type: 'quote_update',
            related_id: quoteRequestId,
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
                    modifiedBy: 'admin',
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

      const { data: adminsData } = await supabase
        .from('admins')
        .select('user_id, email, username');

      if (adminsData && adminsData.length > 0) {
        const adminNotifications = adminsData.map(admin => ({
          user_id: admin.user_id,
          user_type: 'admin',
          title: 'Demande de déménagement modifiée',
          message: `La demande ${formData.from_city} → ${formData.to_city} a été modifiée par un administrateur.`,
          type: 'quote_update',
          related_id: quoteRequestId,
          read: false,
          created_at: new Date().toISOString()
        }));

        await supabase.from('notifications').insert(adminNotifications);
      }

      showToast('Demande mise à jour avec succès', 'success');
      onSave?.();

      if (readOnly && isEditing) {
        setIsEditing(false);
        await loadQuoteRequest();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error updating quote request:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData((prev: any) => ({
      ...prev,
      services_needed: prev.services_needed.includes(service)
        ? prev.services_needed.filter((s: string) => s !== service)
        : [...prev.services_needed, service]
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Détails de la demande</h2>
              <p className="text-sm text-gray-500 mt-1">
                Créée le {new Date(formData.created_at).toLocaleDateString('fr-FR')} à {new Date(formData.created_at).toLocaleTimeString('fr-FR')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {formData.furniture_inventory && (
                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Voir inventaire</span>
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setShowVolumeCalculator(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier inventaire</span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <QuoteRequestChangesDisplay quoteRequestId={quoteRequestId} />

          {readOnly && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
            >
              <Edit className="w-5 h-5" />
              Modifier la demande
            </button>
          )}

          {canEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Information Admin</p>
                  <p>Vous pouvez corriger les informations saisies par le client si nécessaire (fautes, erreurs d'adresse, etc.)</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations Client</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={formData.client_name || ''}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.client_email || ''}
                  disabled={!canEdit}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.client_phone || ''}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Adresse de Départ</h3>
            </div>
            <div className="space-y-4">
              {readOnly ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    {`${formData.from_address}${formData.from_city ? ', ' + formData.from_city : ''}${formData.from_postal_code ? ' ' + formData.from_postal_code : ''}`}
                  </div>
                </div>
              ) : (
                <AddressAutocomplete
                  id="admin-from-address"
                  value={`${formData.from_address}${formData.from_city ? ', ' + formData.from_city : ''}${formData.from_postal_code ? ' ' + formData.from_postal_code : ''}`}
                  onAddressSelect={(address) => {
                    setFormData({
                      ...formData,
                      from_address: address.street,
                      from_city: address.city,
                      from_postal_code: address.postalCode
                    });
                  }}
                  placeholder="Adresse de départ..."
                  label="Adresse complète"
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Étage</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.floor_from || 0}
                    onChange={(e) => setFormData({ ...formData, floor_from: Number(e.target.value) })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taille</label>
                  <select
                    value={formData.from_home_size || ''}
                    onChange={(e) => setFormData({ ...formData, from_home_size: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionner</option>
                    {homeSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.from_home_type || ''}
                    onChange={(e) => setFormData({ ...formData, from_home_type: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionner</option>
                    {homeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surface (m²)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.from_surface_m2 || ''}
                    onChange={(e) => setFormData({ ...formData, from_surface_m2: e.target.value ? Number(e.target.value) : null })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.elevator_from || false}
                    onChange={(e) => setFormData({ ...formData, elevator_from: e.target.checked })}
                    disabled={!canEdit}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Ascenseur</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.furniture_lift_needed_departure || false}
                    onChange={(e) => setFormData({ ...formData, furniture_lift_needed_departure: e.target.checked })}
                    disabled={!canEdit}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Monte-meuble</span>
                </label>
              </div>
            </div>
          </div>

          {formData.from_address && formData.to_address && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <DistanceDisplay
                fromAddress={formData.from_address}
                fromCity={formData.from_city}
                fromPostalCode={formData.from_postal_code}
                toAddress={formData.to_address}
                toCity={formData.to_city}
                toPostalCode={formData.to_postal_code}
                showDuration={true}
                className="text-base font-semibold"
              />
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Adresse d'Arrivée</h3>
            </div>
            <div className="space-y-4">
              {readOnly ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    {`${formData.to_address}${formData.to_city ? ', ' + formData.to_city : ''}${formData.to_postal_code ? ' ' + formData.to_postal_code : ''}`}
                  </div>
                </div>
              ) : (
                <AddressAutocomplete
                  id="admin-to-address"
                  value={`${formData.to_address}${formData.to_city ? ', ' + formData.to_city : ''}${formData.to_postal_code ? ' ' + formData.to_postal_code : ''}`}
                  onAddressSelect={(address) => {
                    setFormData({
                      ...formData,
                      to_address: address.street,
                      to_city: address.city,
                      to_postal_code: address.postalCode
                    });
                  }}
                  placeholder="Adresse d'arrivée..."
                  label="Adresse complète"
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Étage</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.floor_to || 0}
                    onChange={(e) => setFormData({ ...formData, floor_to: Number(e.target.value) })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taille</label>
                  <select
                    value={formData.to_home_size || ''}
                    onChange={(e) => setFormData({ ...formData, to_home_size: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionner</option>
                    {homeSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.to_home_type || ''}
                    onChange={(e) => setFormData({ ...formData, to_home_type: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionner</option>
                    {homeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surface (m²)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.to_surface_m2 || ''}
                    onChange={(e) => setFormData({ ...formData, to_surface_m2: e.target.value ? Number(e.target.value) : null })}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.elevator_to || false}
                    onChange={(e) => setFormData({ ...formData, elevator_to: e.target.checked })}
                    disabled={!canEdit}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Ascenseur</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.furniture_lift_needed_arrival || false}
                    onChange={(e) => setFormData({ ...formData, furniture_lift_needed_arrival: e.target.checked })}
                    disabled={!canEdit}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Monte-meuble</span>
                </label>
              </div>
            </div>
          </div>

          {distance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Distance estimée</p>
                  <p className="text-2xl font-bold text-blue-600">{distance} km</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Date et Volume</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de déménagement</label>
                <input
                  type="date"
                  value={formData.moving_date || ''}
                  onChange={(e) => setFormData({ ...formData, moving_date: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flexibilité (jours)</label>
                <select
                  value={formData.date_flexibility_days || 0}
                  onChange={(e) => setFormData({ ...formData, date_flexibility_days: Number(e.target.value) })}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={0}>Date fixe</option>
                  <option value={1}>± 1 jour</option>
                  <option value={2}>± 2 jours</option>
                  <option value={3}>± 3 jours</option>
                  <option value={7}>± 1 semaine</option>
                  <option value={14}>± 2 semaines</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volume (m³)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.volume_m3 || ''}
                  onChange={(e) => setFormData({ ...formData, volume_m3: e.target.value ? Number(e.target.value) : null })}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Services demandés</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map(service => (
                <label
                  key={service}
                  className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={formData.services_needed?.includes(service)}
                    onChange={() => toggleService(service)}
                    disabled={!canEdit}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="ml-3 text-sm text-gray-700">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations complémentaires</h3>
            </div>
            <textarea
              value={formData.additional_info || ''}
              onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
              rows={4}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Informations supplémentaires..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          {!canEdit ? (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Fermer
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (readOnly && isEditing) {
                    setIsEditing(false);
                    loadQuoteRequest();
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {showInventoryModal && (
        <FurnitureInventoryModal
          inventory={formData.furniture_inventory as FurnitureInventory}
          onClose={() => setShowInventoryModal(false)}
          requestInfo={{
            from_city: formData.from_city,
            to_city: formData.to_city,
            moving_date: formData.moving_date,
            volume_m3: formData.volume_m3
          }}
        />
      )}

      {showVolumeCalculator && (
        <VolumeCalculator
          onClose={() => setShowVolumeCalculator(false)}
          onCalculated={handleInventoryUpdate}
          initialInventory={formData.furniture_inventory as FurnitureInventory}
        />
      )}
    </div>
  );
}
