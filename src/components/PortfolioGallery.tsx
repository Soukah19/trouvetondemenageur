import { useState, useEffect } from 'react';
import { X, Plus, Calendar, ImagePlus, Trash2, Upload, Camera, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { LoadingSpinner } from './LoadingSpinner';

interface PortfolioItem {
  id: string;
  photo_url: string;
  description: string;
  project_date: string;
  created_at: string;
}

interface PortfolioGalleryProps {
  moverId: string;
  isOwner?: boolean;
}

export default function PortfolioGallery({ moverId, isOwner = false }: PortfolioGalleryProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    description: '',
    project_date: ''
  });
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, [moverId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadPortfolio() {
    try {
      const { data, error } = await supabase
        .from('mover_portfolio')
        .select('*')
        .eq('mover_id', moverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner une image', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("L'image ne doit pas dépasser 5 MB", 'error');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUploadConfirm() {
    if (!previewFile) {
      showToast('Veuillez sélectionner une image', 'error');
      return;
    }

    setUploading(true);

    try {
      const fileExt = previewFile.name.split('.').pop();
      const fileName = `portfolio/${moverId}/${Date.now()}.${fileExt}`;

      // Upload to identity-documents bucket which has proper RLS policies
      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, previewFile);

      if (uploadError) throw uploadError;

      // Get a long-lived signed URL
      const { data: signedData } = await supabase.storage
        .from('identity-documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      const photoUrl = signedData?.signedUrl || fileName;

      const { error: insertError } = await supabase
        .from('mover_portfolio')
        .insert({
          mover_id: moverId,
          photo_url: photoUrl,
          description: uploadData.description,
          project_date: uploadData.project_date || null
        });

      if (insertError) throw insertError;

      showToast('Photo ajoutée au portfolio', 'success');
      closeUploadModal();
      loadPortfolio();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      showToast(error?.message || "Erreur lors de l'upload", 'error');
    } finally {
      setUploading(false);
    }
  }

  function closeUploadModal() {
    setShowUploadModal(false);
    setUploadData({ description: '', project_date: '' });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Supprimer cette photo du portfolio ?')) return;

    try {
      const { error } = await supabase
        .from('mover_portfolio')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      showToast('Photo supprimée', 'success');
      setItems(items.filter(item => item.id !== itemId));
      setSelectedImage(null);
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  function navigateImage(direction: 'prev' | 'next') {
    if (!selectedImage) return;
    const currentIndex = items.findIndex(i => i.id === selectedImage.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedImage(items[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < items.length - 1) {
      setSelectedImage(items[currentIndex + 1]);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Portfolio</h3>
          <p className="text-sm text-gray-500 mt-1">{items.length} photo{items.length !== 1 ? 's' : ''}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Ajouter une photo
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImagePlus className="h-10 w-10 text-blue-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">
            {isOwner ? 'Votre portfolio est vide' : 'Aucune photo de travaux disponible'}
          </p>
          {isOwner && (
            <>
              <p className="text-gray-400 text-sm mb-6">Ajoutez des photos de vos travaux pour montrer votre expertise</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Ajouter votre première photo
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
              onClick={() => setSelectedImage(item)}
            >
              <img
                src={item.photo_url}
                alt={item.description || 'Portfolio'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                <div className="p-4 text-white w-full">
                  {item.description && (
                    <p className="text-sm font-medium truncate">{item.description}</p>
                  )}
                  {item.project_date && (
                    <p className="text-xs flex items-center gap-1 mt-1 text-white/80">
                      <Calendar size={12} />
                      {new Date(item.project_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Image Viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition bg-white/10 rounded-full p-2 backdrop-blur-sm"
          >
            <X size={24} />
          </button>

          {items.findIndex(i => i.id === selectedImage.id) > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-sm transition"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {items.findIndex(i => i.id === selectedImage.id) < items.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-sm transition"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.photo_url}
              alt={selectedImage.description || 'Portfolio'}
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
            />
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-5">
              {selectedImage.description && (
                <p className="text-white font-medium text-lg mb-2">{selectedImage.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-white/70">
                  {selectedImage.project_date && (
                    <span className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(selectedImage.project_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                  <span className="text-white/40">
                    {items.findIndex(i => i.id === selectedImage.id) + 1} / {items.length}
                  </span>
                </div>
                {isOwner && (
                  <button
                    onClick={() => deleteItem(selectedImage.id)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Ajouter au portfolio</h3>
                  <p className="text-blue-100 text-sm mt-1">Montrez vos réalisations</p>
                </div>
                <button
                  onClick={closeUploadModal}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-gray-100 border-2 border-blue-200">
                  <img src={previewUrl} alt="Aperçu" className="w-full h-56 object-cover" />
                  <button
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition shadow-lg"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Image size={12} />
                    {previewFile?.name}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                      <Upload className="w-7 h-7 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Télécharger</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition">
                      <Camera className="w-7 h-7 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Prendre une photo</span>
                    <span className="text-xs text-gray-400 mt-1">Utiliser la caméra</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Ex: Déménagement 3 pièces à Paris"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date du projet <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="date"
                  value={uploadData.project_date}
                  onChange={(e) => setUploadData({ ...uploadData, project_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition"
                />
              </div>

              <p className="text-xs text-gray-400 text-center">Max 5 MB • Formats : JPG, PNG, WEBP</p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeUploadModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUploadConfirm}
                  disabled={!previewFile || uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner />
                      Upload...
                    </span>
                  ) : (
                    'Ajouter au portfolio'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
