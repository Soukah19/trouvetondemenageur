import { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, FileImage } from 'lucide-react';

interface MultiDocumentUploadInputProps {
  label: string;
  description?: string;
  required?: boolean;
  value: File[];
  onChange: (files: File[]) => void;
  id: string;
  maxFiles?: number;
}

export function MultiDocumentUploadInput({
  label,
  description,
  required = false,
  value = [],  // Add default empty array
  onChange,
  id,
  maxFiles = 10
}: MultiDocumentUploadInputProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const pageNumber = value.length + 1;
            const cleanLabel = label.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
            const file = new File([blob], `${cleanLabel}_page-${String(pageNumber).padStart(4, '0')}.jpg`, { type: 'image/jpeg' });
            onChange([...value, file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType) {
        alert(`Le fichier ${file.name} n'est pas valide. Seuls JPG, PNG et PDF sont acceptés.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const remainingSlots = maxFiles - value.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      if (filesToAdd.length < validFiles.length) {
        alert(`Maximum ${maxFiles} fichiers autorisés. Seulement ${filesToAdd.length} fichiers seront ajoutés.`);
      }

      const renamedFiles = filesToAdd.map((file, index) => {
        const pageNumber = value.length + index + 1;
        const cleanLabel = label.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
        return new File([file], `${cleanLabel}_page-${String(pageNumber).padStart(4, '0')}.jpg`, { type: file.type });
      });

      onChange([...value, ...renamedFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const canAddMore = value.length < maxFiles;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 mb-3">{description}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Formats acceptés</p>
          <p>JPG, JPEG, PNG ou PDF</p>
          <p className="font-medium mt-2">Plusieurs pages acceptées ({value.length}/{maxFiles})</p>
          <p>Vous pouvez ajouter jusqu'à {maxFiles} pages pour ce document.</p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Pages ajoutées : {value.length}/{maxFiles}
          </p>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {value.map((file, index) => (
              <div
                key={index}
                className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Page ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <FileImage className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Page {index + 1} · {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700 p-2 ml-2 flex-shrink-0"
                  aria-label={`Supprimer page ${index + 1}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canAddMore && !showCamera && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <Camera className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {value.length === 0 ? 'Prendre une photo' : 'Ajouter une page'}
            </span>
            <span className="text-xs text-gray-500 mt-1">Utiliser la caméra</span>
          </button>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
            <Upload className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {value.length === 0 ? 'Télécharger' : 'Ajouter page(s)'}
            </span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG ou PDF</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileSelect}
              multiple
              className="hidden"
              id={id}
            />
          </label>
        </div>
      )}

      {!canAddMore && !showCamera && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Limite de {maxFiles} pages atteinte. Supprimez une page pour en ajouter une nouvelle.
        </div>
      )}

      {showCamera && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Capturer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
