import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PhotoUploadProps {
  quoteRequestId: string;
  photoType: 'before_departure' | 'loading' | 'unloading';
  onPhotoUploaded?: (photoId: string, photoUrl: string) => void;
  maxPhotos?: number;
}

interface UploadedPhoto {
  id: string;
  url: string;
  uploading: boolean;
}

export default function PhotoUpload({
  quoteRequestId,
  photoType,
  onPhotoUploaded,
  maxPhotos = 20
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getPhaseLabel = () => {
    switch (photoType) {
      case 'before_departure':
        return 'Avant le départ';
      case 'loading':
        return 'Au chargement';
      case 'unloading':
        return 'Au déchargement';
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempUrl = URL.createObjectURL(file);

      setPhotos(prev => [...prev, { id: tempId, url: tempUrl, uploading: true }]);

      const fileExt = file.name.split('.').pop();
      const fileName = `${quoteRequestId}/${photoType}/${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `moving-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('moving-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('moving-photos')
        .getPublicUrl(filePath);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: photoData, error: insertError } = await supabase
        .from('moving_photos')
        .insert({
          quote_request_id: quoteRequestId,
          uploaded_by: user.user.id,
          photo_type: photoType,
          storage_path: filePath,
          metadata: {
            original_name: file.name,
            size: file.size,
            type: file.type
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPhotos(prev => prev.map(p =>
        p.id === tempId
          ? { id: photoData.id, url: publicUrl, uploading: false }
          : p
      ));

      if (onPhotoUploaded) {
        onPhotoUploaded(photoData.id, publicUrl);
      }

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors de l\'upload de la photo. Veuillez réessayer.');
      setPhotos(prev => prev.filter(p => !p.uploading));
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Vous ne pouvez uploader que ${maxPhotos} photos maximum.`);
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      await uploadPhoto(files[i]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId: string, storagePath?: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('moving_photos')
        .delete()
        .eq('id', photoId);

      if (deleteError) throw deleteError;

      if (storagePath) {
        await supabase.storage
          .from('moving-photos')
          .remove([storagePath]);
      }

      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erreur lors de la suppression de la photo.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos {getPhaseLabel()}
        </h3>
        <span className="text-sm text-gray-500">
          {photos.length} / {maxPhotos}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || photos.length >= maxPhotos}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Camera className="w-5 h-5" />
          Prendre une photo
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= maxPhotos}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Upload className="w-5 h-5" />
          Choisir des photos
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.url}
                  alt="Photo de déménagement"
                  className="w-full h-full object-cover"
                />
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              {!photo.uploading && (
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Aucune photo uploadée pour cette phase
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Prenez ou sélectionnez des photos pour commencer
          </p>
        </div>
      )}
    </div>
  );
}
