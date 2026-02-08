import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { LoadingSpinner } from './LoadingSpinner';

interface InventoryItem {
  id: string;
  room: string;
  item_name: string;
  quantity: number;
  volume_m3: number | null;
  is_fragile: boolean;
  photo_url: string | null;
  notes: string | null;
}

interface InventoryManagerProps {
  quoteRequestId: string;
  userId: string;
  readOnly?: boolean;
}

const commonRooms = [
  'Salon',
  'Cuisine',
  'Chambre',
  'Salle de bain',
  'Bureau',
  'Garage',
  'Cave',
  'Grenier',
  'Autre'
];

export default function InventoryManager({ quoteRequestId, userId, readOnly = false }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    room: '',
    item_name: '',
    quantity: 1,
    volume_m3: '',
    is_fragile: false,
    notes: ''
  });

  useEffect(() => {
    loadInventory();
  }, [quoteRequestId]);

  async function loadInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('room', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    if (!newItem.room || !newItem.item_name) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          quote_request_id: quoteRequestId,
          user_id: userId,
          room: newItem.room,
          item_name: newItem.item_name,
          quantity: newItem.quantity,
          volume_m3: newItem.volume_m3 ? parseFloat(newItem.volume_m3) : null,
          is_fragile: newItem.is_fragile,
          notes: newItem.notes || null
        });

      if (error) throw error;

      showToast('Article ajouté à l\'inventaire', 'success');
      setShowAddModal(false);
      setNewItem({
        room: '',
        item_name: '',
        quantity: 1,
        volume_m3: '',
        is_fragile: false,
        notes: ''
      });
      loadInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      showToast('Article supprimé', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Erreur', 'error');
    }
  }

  if (loading) return <LoadingSpinner />;

  const totalVolume = items.reduce((sum, item) => sum + (item.volume_m3 || 0), 0);
  const fragileCount = items.filter(item => item.is_fragile).length;
  const roomGroups = items.reduce((acc, item) => {
    if (!acc[item.room]) acc[item.room] = [];
    acc[item.room].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Inventaire de déménagement</h3>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span>{items.length} articles</span>
              {totalVolume > 0 && <span>Volume: {totalVolume.toFixed(2)} m³</span>}
              {fragileCount > 0 && <span>{fragileCount} objets fragiles</span>}
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {readOnly
              ? 'Aucun article dans l\'inventaire'
              : 'Commencez à lister les articles à déménager'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(roomGroups).map(([room, roomItems]) => (
            <div key={room} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {room} ({roomItems.length} articles)
                </h4>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {roomItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {item.item_name}
                          </h5>
                          {item.is_fragile && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle size={12} />
                              Fragile
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>Quantité: {item.quantity}</span>
                          {item.volume_m3 && <span>Volume: {item.volume_m3} m³</span>}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-gray-400 hover:text-red-600 transition ml-4"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ajouter un article</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pièce *
                </label>
                <select
                  value={newItem.room}
                  onChange={(e) => setNewItem({ ...newItem, room: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner une pièce</option>
                  {commonRooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'article *
                </label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Ex: Canapé 3 places"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.volume_m3}
                    onChange={(e) => setNewItem({ ...newItem, volume_m3: e.target.value })}
                    placeholder="0.5"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.is_fragile}
                    onChange={(e) => setNewItem({ ...newItem, is_fragile: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Article fragile
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={2}
                  placeholder="Informations complémentaires..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white"
              >
                Annuler
              </button>
              <button
                onClick={addItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
