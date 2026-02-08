import { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';

interface DocumentUploadInputProps {
  label: string;
  description?: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
  id: string;
}

export function DocumentUploadInput({
  label,
  description,
  required = false,
  value,
  onChange,
  id
}: DocumentUploadInputProps) {
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
            const file = new File([blob], `${id}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onChange(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType) {
        alert('Veuillez sélectionner un fichier valide (JPG, PNG ou PDF uniquement)');
        return;
      }
      onChange(file);
    }
  };

  const removeFile = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        </div>
      </div>

      {!value && !showCamera && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <Camera className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Prendre une photo</span>
            <span className="text-xs text-gray-500 mt-1">Utiliser la caméra</span>
          </button>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
            <Upload className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Télécharger</span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG ou PDF</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id={id}
            />
          </label>
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

      {value && !showCamera && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                {value.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(value)}
                    alt="Aperçu"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{value.name}</p>
                <p className="text-xs text-gray-500">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-red-600 hover:text-red-700 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
