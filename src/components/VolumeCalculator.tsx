import { useState } from 'react';
import { X, Plus, Minus, Calculator, Package, ChevronRight, Home, ArrowLeft, Upload, Camera, AlertTriangle, CheckCircle, Loader, Armchair, Sofa, Bed, Bath, Refrigerator, Tv, Lamp, BookOpen, Shirt, Table, UtensilsCrossed, WashingMachine, Microwave, Wind, Coffee, Box, BedDouble, Archive, DoorOpen, Frame, Flower2, Bike, Wrench, Wine, Gift, Luggage, TreePine, Umbrella, Sprout, Drama, Monitor, Printer, Ruler, Warehouse, type LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export interface FurnitureInventory {
  selectedItems: Record<string, number>;
  customFurniture: Array<{
    name: string;
    volume: number;
    count: number;
  }>;
}

type VolumeCalculatorProps = {
  onClose: () => void;
  onCalculated: (volume: number, inventory: FurnitureInventory) => void;
  initialInventory?: FurnitureInventory;
};

interface FurnitureItem {
  name: string;
  volume: number;
  icon: LucideIcon;
}

interface RoomType {
  id: string;
  name: string;
  image: string;
  allowMultiple?: boolean;
}

const rooms: RoomType[] = [
  {
    id: 'entree',
    name: 'Entrée',
    image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'salon',
    name: 'Salon',
    image: 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'salle_manger',
    name: 'Salle à Manger',
    image: 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    image: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'chambre',
    name: 'Chambre',
    image: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: true
  },
  {
    id: 'salle_bain',
    name: 'Salle de Bain',
    image: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'bureau',
    name: 'Bureau',
    image: 'https://images.pexels.com/photos/667838/pexels-photo-667838.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'garage',
    name: 'Garage',
    image: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'cave',
    name: 'Cave',
    image: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'grenier',
    name: 'Grenier',
    image: 'https://images.pexels.com/photos/584399/living-room-couch-interior-room-584399.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  },
  {
    id: 'jardin',
    name: 'Jardin/Terrasse',
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
    allowMultiple: false
  }
];

const roomFurniture: Record<string, FurnitureItem[]> = {
  'entree': [
    { name: 'Meuble à chaussures', volume: 0.4, icon: Archive },
    { name: 'Porte-manteau', volume: 0.2, icon: Shirt },
    { name: 'Miroir', volume: 0.15, icon: Frame },
    { name: 'Console d\'entrée', volume: 0.5, icon: Table },
    { name: 'Banc', volume: 0.3, icon: Armchair }
  ],
  'salon': [
    { name: 'Canapé 2 places', volume: 1.5, icon: Sofa },
    { name: 'Canapé 3 places', volume: 2.0, icon: Sofa },
    { name: 'Canapé d\'angle', volume: 3.0, icon: Sofa },
    { name: 'Fauteuil', volume: 0.8, icon: Armchair },
    { name: 'Pouf', volume: 0.2, icon: Armchair },
    { name: 'Table basse', volume: 0.5, icon: Table },
    { name: 'Meuble TV', volume: 0.8, icon: Archive },
    { name: 'Bibliothèque', volume: 1.2, icon: BookOpen },
    { name: 'Étagère murale', volume: 0.3, icon: Archive },
    { name: 'TV < 40"', volume: 0.2, icon: Tv },
    { name: 'TV 40-55"', volume: 0.3, icon: Tv },
    { name: 'TV > 55"', volume: 0.5, icon: Tv },
    { name: 'Lampadaire', volume: 0.2, icon: Lamp },
    { name: 'Plante (grande)', volume: 0.3, icon: Flower2 },
    { name: 'Tapis roulé', volume: 0.3, icon: Drama }
  ],
  'salle_manger': [
    { name: 'Table (4 personnes)', volume: 1.0, icon: Table },
    { name: 'Table (6 personnes)', volume: 1.5, icon: Table },
    { name: 'Table (8+ personnes)', volume: 2.0, icon: Table },
    { name: 'Chaise', volume: 0.3, icon: Armchair },
    { name: 'Chaise haute (bébé)', volume: 0.4, icon: Armchair },
    { name: 'Buffet', volume: 1.5, icon: Archive },
    { name: 'Vaisselier', volume: 1.8, icon: Archive },
    { name: 'Desserte', volume: 0.4, icon: Table },
    { name: 'Lustre/Suspension', volume: 0.1, icon: Lamp }
  ],
  'cuisine': [
    { name: 'Réfrigérateur simple', volume: 1.2, icon: Refrigerator },
    { name: 'Réfrigérateur américain', volume: 2.0, icon: Refrigerator },
    { name: 'Congélateur', volume: 1.0, icon: Refrigerator },
    { name: 'Lave-vaisselle', volume: 0.8, icon: WashingMachine },
    { name: 'Lave-linge', volume: 0.8, icon: WashingMachine },
    { name: 'Sèche-linge', volume: 0.8, icon: Wind },
    { name: 'Four/Cuisinière', volume: 0.6, icon: UtensilsCrossed },
    { name: 'Micro-ondes', volume: 0.1, icon: Microwave },
    { name: 'Hotte aspirante', volume: 0.2, icon: Wind },
    { name: 'Table de cuisine', volume: 0.8, icon: Table },
    { name: 'Chaise de cuisine', volume: 0.3, icon: Armchair },
    { name: 'Meuble bas (par élément)', volume: 0.5, icon: Archive },
    { name: 'Meuble haut (par élément)', volume: 0.3, icon: Archive },
    { name: 'Îlot central', volume: 1.5, icon: Table },
    { name: 'Robot de cuisine', volume: 0.05, icon: Coffee },
    { name: 'Cartons vaisselle (petit)', volume: 0.05, icon: Box }
  ],
  'chambre': [
    { name: 'Lit simple (90cm)', volume: 1.5, icon: Bed },
    { name: 'Lit double (140cm)', volume: 2.0, icon: BedDouble },
    { name: 'Lit double (160cm)', volume: 2.5, icon: BedDouble },
    { name: 'Lit King size (180cm)', volume: 3.0, icon: BedDouble },
    { name: 'Matelas simple', volume: 0.5, icon: Bed },
    { name: 'Matelas double', volume: 0.8, icon: BedDouble },
    { name: 'Sommier', volume: 0.6, icon: Bed },
    { name: 'Armoire 2 portes', volume: 1.8, icon: DoorOpen },
    { name: 'Armoire 3 portes', volume: 2.5, icon: DoorOpen },
    { name: 'Armoire 4+ portes', volume: 3.5, icon: DoorOpen },
    { name: 'Dressing/Penderie', volume: 2.0, icon: Shirt },
    { name: 'Commode', volume: 0.8, icon: Archive },
    { name: 'Table de chevet', volume: 0.2, icon: Table },
    { name: 'Coiffeuse', volume: 0.6, icon: Frame },
    { name: 'Miroir', volume: 0.15, icon: Frame },
    { name: 'Lampe de chevet', volume: 0.05, icon: Lamp },
    { name: 'Carton penderie', volume: 0.3, icon: Box },
    { name: 'Carton standard', volume: 0.1, icon: Box }
  ],
  'salle_bain': [
    { name: 'Meuble vasque', volume: 0.6, icon: Bath },
    { name: 'Colonne de rangement', volume: 0.8, icon: Archive },
    { name: 'Miroir', volume: 0.15, icon: Frame },
    { name: 'Armoire de toilette', volume: 0.3, icon: DoorOpen },
    { name: 'Lave-linge', volume: 0.8, icon: WashingMachine },
    { name: 'Sèche-linge', volume: 0.8, icon: Wind },
    { name: 'Panier à linge', volume: 0.1, icon: Box },
    { name: 'Étagère murale', volume: 0.2, icon: Archive }
  ],
  'bureau': [
    { name: 'Bureau', volume: 1.0, icon: Table },
    { name: 'Chaise de bureau', volume: 0.4, icon: Armchair },
    { name: 'Fauteuil de bureau', volume: 0.6, icon: Armchair },
    { name: 'Bibliothèque', volume: 1.2, icon: BookOpen },
    { name: 'Étagère', volume: 0.5, icon: Archive },
    { name: 'Caisson de rangement', volume: 0.4, icon: Archive },
    { name: 'Ordinateur de bureau', volume: 0.2, icon: Monitor },
    { name: 'Écran', volume: 0.1, icon: Monitor },
    { name: 'Imprimante', volume: 0.1, icon: Printer },
    { name: 'Lampe de bureau', volume: 0.05, icon: Lamp },
    { name: 'Carton livres', volume: 0.05, icon: Box }
  ],
  'garage': [
    { name: 'Vélo', volume: 0.5, icon: Bike },
    { name: 'Moto/Scooter', volume: 2.0, icon: Bike },
    { name: 'Établi', volume: 1.5, icon: Wrench },
    { name: 'Étagère de rangement', volume: 1.0, icon: Archive },
    { name: 'Armoire métallique', volume: 1.2, icon: DoorOpen },
    { name: 'Tondeuse', volume: 0.4, icon: Wrench },
    { name: 'Outils (carton)', volume: 0.1, icon: Wrench },
    { name: 'Pneus (set de 4)', volume: 0.3, icon: Package },
    { name: 'Aspirateur', volume: 0.2, icon: Wind }
  ],
  'cave': [
    { name: 'Étagère métallique', volume: 1.0, icon: Archive },
    { name: 'Cave à vin', volume: 0.8, icon: Wine },
    { name: 'Congélateur', volume: 1.0, icon: Refrigerator },
    { name: 'Armoire de rangement', volume: 1.5, icon: DoorOpen },
    { name: 'Carton standard', volume: 0.1, icon: Box },
    { name: 'Valises/Bagages', volume: 0.2, icon: Luggage }
  ],
  'grenier': [
    { name: 'Carton standard', volume: 0.1, icon: Box },
    { name: 'Malle/Coffre', volume: 0.5, icon: Archive },
    { name: 'Valises', volume: 0.2, icon: Luggage },
    { name: 'Décoration de Noël', volume: 0.3, icon: Gift },
    { name: 'Étagère de rangement', volume: 1.0, icon: Archive }
  ],
  'jardin': [
    { name: 'Table de jardin', volume: 0.8, icon: Table },
    { name: 'Chaise de jardin', volume: 0.3, icon: Armchair },
    { name: 'Transat', volume: 0.4, icon: Armchair },
    { name: 'Parasol', volume: 0.2, icon: Umbrella },
    { name: 'Barbecue', volume: 0.6, icon: UtensilsCrossed },
    { name: 'Salon de jardin complet', volume: 2.5, icon: Sofa },
    { name: 'Balancelle', volume: 1.5, icon: Armchair },
    { name: 'Tonnelle/Pergola', volume: 3.0, icon: Warehouse },
    { name: 'Pot de fleurs (grand)', volume: 0.2, icon: Flower2 },
    { name: 'Coffre de rangement', volume: 0.8, icon: Archive },
    { name: 'Tondeuse', volume: 0.4, icon: Wrench }
  ]
};

export function VolumeCalculator({ onClose, onCalculated, initialInventory }: VolumeCalculatorProps) {
  const [step, setStep] = useState<'rooms' | 'furniture'>('rooms');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const initializeSelectedItems = () => {
    const map = new Map<string, number>();
    if (initialInventory?.selectedItems) {
      Object.entries(initialInventory.selectedItems).forEach(([key, value]) => {
        map.set(key, value);
      });
    }
    return map;
  };

  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(initializeSelectedItems());
  const [customFurniture, setCustomFurniture] = useState<Array<{
    name: string;
    volume: number;
    count: number;
  }>>(initialInventory?.customFurniture || []);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<{
    furniture_type: string;
    estimated_volume: number;
    description: string;
  } | null>(null);

  const handleRoomClick = (roomId: string) => {
    if (!selectedRooms.includes(roomId)) {
      setSelectedRooms([...selectedRooms, roomId]);
    }
    setCurrentRoom(roomId);
    setStep('furniture');
  };

  const addItem = (itemName: string) => {
    const newMap = new Map(selectedItems);
    newMap.set(itemName, (newMap.get(itemName) || 0) + 1);
    setSelectedItems(newMap);
  };

  const removeItem = (itemName: string) => {
    const newMap = new Map(selectedItems);
    const currentCount = newMap.get(itemName) || 0;
    if (currentCount > 1) {
      newMap.set(itemName, currentCount - 1);
    } else {
      newMap.delete(itemName);
    }
    setSelectedItems(newMap);
  };

  const getTotalVolume = () => {
    let total = 0;

    // Volume des meubles prédéfinis
    selectedItems.forEach((count, itemName) => {
      Object.values(roomFurniture).forEach(category => {
        const item = category.find(i => i.name === itemName);
        if (item) {
          total += item.volume * count;
        }
      });
    });

    // Volume des meubles personnalisés (analysés par IA)
    customFurniture.forEach(item => {
      total += item.volume * item.count;
    });

    return Math.round(total * 10) / 10;
  };

  const goBackToRooms = () => {
    setStep('rooms');
    setCurrentRoom(null);
  };

  const handleFinish = () => {
    const volume = getTotalVolume();

    const selectedItemsRecord: Record<string, number> = {};
    selectedItems.forEach((count, itemName) => {
      selectedItemsRecord[itemName] = count;
    });

    const inventory: FurnitureInventory = {
      selectedItems: selectedItemsRecord,
      customFurniture: customFurniture
    };

    onCalculated(volume, inventory);
    onClose();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner une image', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La taille de l\'image ne doit pas dépasser 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    setPhotoAnalysis(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          showToast('Vous devez être connecté', 'error');
          setUploadingPhoto(false);
          return;
        }

        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-furniture-photo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_base64: base64Data }),
          }
        );

        const result = await response.json();

        if (result.blocked) {
          showToast(result.reason || 'Image bloquée pour des raisons de sécurité', 'error');
          setUploadingPhoto(false);
          return;
        }

        if (!result.success) {
          showToast(result.reason || 'Erreur lors de l\'analyse de l\'image', 'error');
          setUploadingPhoto(false);
          return;
        }

        setPhotoAnalysis({
          furniture_type: result.furniture_type,
          estimated_volume: result.estimated_volume,
          description: result.description,
        });

        showToast('Photo analysée avec succès !', 'success');
        setUploadingPhoto(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Erreur lors de l\'upload de la photo', 'error');
      setUploadingPhoto(false);
    }
  };

  const addAnalyzedFurniture = () => {
    if (!photoAnalysis) return;

    const existingItem = customFurniture.find(
      item => item.name === photoAnalysis.furniture_type && item.volume === photoAnalysis.estimated_volume
    );

    if (existingItem) {
      setCustomFurniture(
        customFurniture.map(item =>
          item.name === photoAnalysis.furniture_type && item.volume === photoAnalysis.estimated_volume
            ? { ...item, count: item.count + 1 }
            : item
        )
      );
    } else {
      setCustomFurniture([
        ...customFurniture,
        {
          name: photoAnalysis.furniture_type,
          volume: photoAnalysis.estimated_volume,
          count: 1,
        },
      ]);
    }

    showToast(`${photoAnalysis.furniture_type} ajouté(e) avec ${photoAnalysis.estimated_volume} m³`, 'success');
    setPhotoAnalysis(null);
    setShowPhotoUpload(false);
  };

  const currentRoomData = currentRoom ? rooms.find(r => r.id === currentRoom) : null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-5xl mx-auto px-2 sm:px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full relative shadow-2xl max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="sticky top-4 right-4 z-20 float-right text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg transition-all hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-4 sm:p-6 lg:p-8">
          {step === 'rooms' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sélectionnez vos pièces</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Cliquez sur une pièce pour accéder au mobilier</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {rooms.map(room => {
                  const isSelected = selectedRooms.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleRoomClick(room.id)}
                      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'ring-4 ring-green-500 shadow-2xl'
                          : 'shadow-lg hover:shadow-2xl hover:scale-105'
                      }`}
                    >
                      <div className="relative h-56 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                            const div = document.createElement('div');
                            div.className = 'text-6xl';
                            div.textContent = room.id === 'salon' ? '🛋️' : room.id === 'salle_manger' ? '🍽️' : room.id === 'cuisine' ? '🍳' : room.id === 'chambre' ? '🛏️' : room.id === 'bureau' ? '💼' : room.id === 'salle_bain' ? '🚿' : room.id === 'garage' ? '🚗' : room.id === 'cave' ? '📦' : room.id === 'grenier' ? '🏠' : room.id === 'jardin' ? '🌿' : '🏠';
                            target.parentElement!.appendChild(div);
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                            <Package className="w-6 h-6" />
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="font-bold text-2xl mb-2">{room.name}</h3>
                          <p className="text-sm text-blue-100">
                            {isSelected ? 'Configurée - Cliquez pour modifier' : 'Cliquez pour configurer'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRooms.length > 0 && (
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-6 rounded-b-3xl -mx-8 -mb-8">
                  <button
                    onClick={handleFinish}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-xl shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                  >
                    <span>Valider le cubage - {getTotalVolume()} m³</span>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </>
          ) : currentRoom && roomFurniture[currentRoom] ? (
            <>
              <div className="mb-4 flex items-center space-x-3">
                <button
                  onClick={goBackToRooms}
                  className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{currentRoomData?.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Sélectionnez vos meubles et objets</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
                {roomFurniture[currentRoom].map(item => {
                  const count = selectedItems.get(item.name) || 0;
                  return (
                    <div
                      key={item.name}
                      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 bg-white dark:bg-gray-700 ${
                        count > 0
                          ? 'ring-2 ring-blue-500 shadow-xl'
                          : 'shadow-md hover:shadow-xl hover:scale-102'
                      }`}
                    >
                      <div className="relative">
                        <div className="h-16 overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                          <item.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                        </div>

                        {count > 0 && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                            {count}
                          </div>
                        )}

                        <div className="p-2 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
                          <h4 className="font-semibold text-xs mb-1 text-gray-900 dark:text-white">{item.name}</h4>
                          <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400">
                            <Package className="w-3 h-3" />
                            <span className="text-xs font-medium">{item.volume} m³</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-2">
                        <div className="flex items-center justify-between space-x-2">
                          {count > 0 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.name)}
                              className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition-all font-semibold flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => addItem(item.name)}
                            className={`${count > 0 ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold flex items-center justify-center`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Affichage des meubles personnalisés */}
              {customFurniture.length > 0 && (
                <div className="mt-6 mb-6">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Camera className="w-6 h-6" />
                    <span>Mobilier analysé par IA</span>
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {customFurniture.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </span>
                          </div>
                          <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            {item.count}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            {item.volume} m³ × {item.count}
                          </span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {(item.volume * item.count).toFixed(1)} m³
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.count > 1) {
                              setCustomFurniture(
                                customFurniture.map((f, i) =>
                                  i === index ? { ...f, count: f.count - 1 } : f
                                )
                              );
                            } else {
                              setCustomFurniture(customFurniture.filter((_, i) => i !== index));
                            }
                          }}
                          className="mt-3 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-all text-sm font-semibold flex items-center justify-center space-x-1"
                        >
                          <Minus className="w-4 h-4" />
                          <span>Retirer</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Informations complémentaires */}
              <div className="mt-8 mb-8">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Camera className="w-6 h-6" />
                    <span>Mobilier non trouvé dans la liste ?</span>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Prenez une photo de votre mobilier et notre IA l'analysera pour estimer automatiquement son volume.
                  </p>

                  {!showPhotoUpload && (
                    <button
                      onClick={() => setShowPhotoUpload(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold flex items-center justify-center space-x-3"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Ajouter une photo de mobilier</span>
                    </button>
                  )}

                  {showPhotoUpload && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="hidden"
                          id="furniture-photo-upload"
                        />
                        <label
                          htmlFor="furniture-photo-upload"
                          className={`cursor-pointer ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex flex-col items-center space-y-3">
                            {uploadingPhoto ? (
                              <>
                                <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                                <p className="text-gray-600 dark:text-gray-300">Analyse en cours...</p>
                              </>
                            ) : (
                              <>
                                <Camera className="w-12 h-12 text-gray-400" />
                                <p className="text-gray-600 dark:text-gray-300 font-medium">
                                  Cliquez pour prendre ou sélectionner une photo
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Format: JPG, PNG (max 5MB)
                                </p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>

                      {photoAnalysis && (
                        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6">
                          <div className="flex items-start space-x-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                Analyse terminée !
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Type:</span> {photoAnalysis.furniture_type}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Volume estimé:</span> {photoAnalysis.estimated_volume} m³
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Description:</span> {photoAnalysis.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={addAnalyzedFurniture}
                            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all font-semibold flex items-center justify-center space-x-2"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Ajouter au cubage</span>
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoUpload(false);
                          setPhotoAnalysis(null);
                        }}
                        className="w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-semibold"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 rounded-b-3xl -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8">
                <div className="flex space-x-2 sm:space-x-4">
                  <button
                    onClick={goBackToRooms}
                    className="flex-1 bg-gray-500 text-white py-3 sm:py-4 lg:py-5 rounded-xl hover:bg-gray-600 transition-all font-bold text-sm sm:text-base lg:text-xl shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Autres pièces</span>
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 lg:py-5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-sm sm:text-base lg:text-xl shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span>Terminer - {getTotalVolume()} m³</span>
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}