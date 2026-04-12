import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';

type FurniturePhotoUploadProps = {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
};

export function FurniturePhotoUpload({ photos, onPhotosChange, maxPhotos = 30 }: FurniturePhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      showToast(`Vous ne pouvez uploader que ${maxPhotos} photos maximum`, 'error');
      return;
    }

    if (!user) {
      showToast('Vous devez être connecté pour uploader des photos', 'error');
      return;
    }

    setUploading(true);
    const newPhotoUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          showToast(`Le fichier ${file.name} n'est pas une image`, 'error');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          showToast(`Le fichier ${file.name} est trop volumineux (max 5MB)`, 'error');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('furniture-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading photo:', error);
          showToast(`Erreur lors de l'upload de ${file.name}`, 'error');
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('furniture-photos')
          .getPublicUrl(data.path);

        newPhotoUrls.push(publicUrl);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (newPhotoUrls.length > 0) {
        onPhotosChange([...photos, ...newPhotoUrls]);
        showToast(`${newPhotoUrls.length} photo(s) uploadée(s) avec succès`, 'success');
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      showToast('Erreur lors de l\'upload des photos', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      const path = photoUrl.split('/furniture-photos/')[1];
      if (path) {
        await supabase.storage
          .from('furniture-photos')
          .remove([path]);
      }

      onPhotosChange(photos.filter(url => url !== photoUrl));
      showToast('Photo supprimée', 'success');
    } catch (err) {
      console.error('Error removing photo:', err);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Protection intelligente par IA
          </p>
          <p className="text-sm text-blue-800">
            Plus vous ajoutez de photos de votre mobilier, plus vous serez protégé par notre système d'IA en cas de sinistre lors du déménagement. Ces photos serviront de preuve de l'état de vos biens avant le transport.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{photos.length}</span> / {maxPhotos} photos
        </div>
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Upload en cours...' : 'Ajouter des photos'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Aucune photo ajoutée</p>
          <p className="text-sm text-gray-500">
            Ajoutez des photos de votre mobilier pour une meilleure protection
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={photoUrl}
                alt={`Mobilier ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(photoUrl)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length >= maxPhotos && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Vous avez atteint la limite de {maxPhotos} photos. Supprimez des photos pour en ajouter de nouvelles.
          </p>
        </div>
      )}
    </div>
  );
}
