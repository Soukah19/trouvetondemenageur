import { X, AlertTriangle, CheckCircle } from 'lucide-react';

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  isOpen,
  title,
  message,
  type = 'info',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      IconComponent: CheckCircle,
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
      IconComponent: AlertTriangle,
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      IconComponent: AlertTriangle,
    },
    success: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      IconComponent: CheckCircle,
    },
  };

  const style = typeStyles[type];
  const IconComponent = style.IconComponent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className={`w-6 h-6 ${style.icon}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition font-medium ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
