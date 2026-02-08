import { useState, useEffect } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Photo {
  id: string;
  storage_path: string;
  photo_type: 'before_departure' | 'loading' | 'unloading';
  created_at: string;
  metadata?: {
    original_name?: string;
  };
}

interface PhotoGalleryProps {
  quoteRequestId: string;
  photoType?: 'before_departure' | 'loading' | 'unloading';
  showTitle?: boolean;
}

export default function PhotoGallery({
  quoteRequestId,
  photoType,
  showTitle = true
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [quoteRequestId, photoType]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('moving_photos')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('created_at', { ascending: true });

      if (photoType) {
        query = query.eq('photo_type', photoType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('moving-photos')
      .getPublicUrl(storagePath);
    return publicUrl;
  };

  const getPhaseLabel = (type: string) => {
    switch (type) {
      case 'before_departure':
        return 'Avant le départ';
      case 'loading':
        return 'Au chargement';
      case 'unloading':
        return 'Au déchargement';
      default:
        return type;
    }
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.photo_type]) {
      acc[photo.photo_type] = [];
    }
    acc[photo.photo_type].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  const handlePrevious = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1);
    }
  };

  const handleNext = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedPhoto === null) return;

    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setSelectedPhoto(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Aucune photo disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
        <div key={type} className="space-y-3">
          {showTitle && (
            <h3 className="text-lg font-semibold text-gray-900">
              {getPhaseLabel(type)} ({typePhotos.length})
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {typePhotos.map((photo, index) => {
              const globalIndex = photos.indexOf(photo);
              return (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(globalIndex)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition group"
                >
                  <img
                    src={getPhotoUrl(photo.storage_path)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedPhoto !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>

          {selectedPhoto > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {selectedPhoto < photos.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <div className="max-w-5xl max-h-full flex flex-col items-center">
            <img
              src={getPhotoUrl(photos[selectedPhoto].storage_path)}
              alt={`Photo ${selectedPhoto + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-white text-center">
              <p className="font-medium">
                {getPhaseLabel(photos[selectedPhoto].photo_type)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedPhoto + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
