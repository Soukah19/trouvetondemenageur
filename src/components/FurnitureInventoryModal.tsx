import { X, Download, Package, Camera, Armchair } from 'lucide-react';
import type { FurnitureInventory } from './VolumeCalculator';

type FurnitureInventoryModalProps = {
  inventory: FurnitureInventory | null;
  onClose: () => void;
  requestInfo?: {
    from_city?: string;
    to_city?: string;
    moving_date?: string;
    volume_m3?: number | null;
  };
};

export function FurnitureInventoryModal({ inventory, onClose, requestInfo }: FurnitureInventoryModalProps) {
  if (!inventory) return null;

  const getTotalVolume = () => {
    let total = 0;

    Object.entries(inventory.selectedItems).forEach(([_, count]) => {
      total += count;
    });

    inventory.customFurniture.forEach(item => {
      total += item.volume * item.count;
    });

    return total;
  };

  const handleDownload = () => {
    const items: string[] = [];

    items.push('INVENTAIRE MOBILIER DETAILLE');
    items.push('================================\n');

    if (requestInfo) {
      if (requestInfo.from_city && requestInfo.to_city) {
        items.push(`Trajet: ${requestInfo.from_city} → ${requestInfo.to_city}`);
      }
      if (requestInfo.moving_date) {
        items.push(`Date: ${new Date(requestInfo.moving_date).toLocaleDateString('fr-FR')}`);
      }
      if (requestInfo.volume_m3) {
        items.push(`Volume total: ${requestInfo.volume_m3} m³`);
      }
      items.push('\n');
    }

    const selectedCount = Object.keys(inventory.selectedItems).length;
    const customCount = inventory.customFurniture.length;
    const totalItems = selectedCount + customCount;

    items.push(`Total meubles: ${totalItems} types différents\n`);

    if (selectedCount > 0) {
      items.push('MEUBLES STANDARDS');
      items.push('------------------\n');

      Object.entries(inventory.selectedItems).forEach(([name, count]) => {
        items.push(`${name} x ${count}`);
      });
      items.push('\n');
    }

    if (customCount > 0) {
      items.push('MEUBLES PERSONNALISES (Analyse IA)');
      items.push('-----------------------------------\n');

      inventory.customFurniture.forEach(item => {
        items.push(`${item.name} x ${item.count} (${item.volume} m³ chacun = ${(item.volume * item.count).toFixed(1)} m³ total)`);
      });
      items.push('\n');
    }

    items.push('================================');
    items.push(`Date d'export: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`);
    items.push('TrouveTonDemenageur.fr');

    const content = items.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventaire-mobilier-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedItemsArray = Object.entries(inventory.selectedItems);
  const hasSelectedItems = selectedItemsArray.length > 0;
  const hasCustomFurniture = inventory.customFurniture.length > 0;

  if (!hasSelectedItems && !hasCustomFurniture) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Aucun inventaire disponible
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Le client n'a pas encore utilisé le calculateur de volume détaillé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 relative shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Inventaire du mobilier
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Liste détaillée des meubles et objets à déménager
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Télécharger</span>
            </button>
          </div>

          {requestInfo && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {requestInfo.from_city && requestInfo.to_city && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <span className="text-gray-600 dark:text-gray-400">Trajet</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {requestInfo.from_city} → {requestInfo.to_city}
                  </div>
                </div>
              )}
              {requestInfo.moving_date && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <span className="text-gray-600 dark:text-gray-400">Date</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {new Date(requestInfo.moving_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
              {requestInfo.volume_m3 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <span className="text-gray-600 dark:text-gray-400">Volume total</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {requestInfo.volume_m3} m³
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {hasSelectedItems && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Armchair className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Meubles standards
                </h3>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                  {selectedItemsArray.length} types
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedItemsArray.map(([name, count]) => (
                  <div
                    key={name}
                    className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {name}
                        </h4>
                      </div>
                      <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold ml-3 flex-shrink-0">
                        {count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasCustomFurniture && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Meubles personnalisés (Analyse IA)
                </h3>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-semibold">
                  {inventory.customFurniture.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.customFurniture.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h4>
                      </div>
                      <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {item.count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.volume} m³ × {item.count}
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        = {(item.volume * item.count).toFixed(1)} m³
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total des éléments</p>
                <p className="text-3xl font-bold">
                  {selectedItemsArray.length + inventory.customFurniture.length} types de meubles
                </p>
              </div>
              <Package className="w-16 h-16 opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
