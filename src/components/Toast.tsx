import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastProps = {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
};

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(prev - 100 / (duration / 100), 0));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      progressBar: 'bg-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: XCircle,
      iconColor: 'text-red-600',
      progressBar: 'bg-red-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      progressBar: 'bg-amber-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
      progressBar: 'bg-blue-600',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg border overflow-hidden transition-all-smooth ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${config.bg} ${config.border}`}
    >
      <div className="p-4 flex items-start space-x-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <p className={`flex-1 text-sm font-medium ${config.text}`}>{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 bg-gray-200">
        <div
          className={`h-full transition-all ease-linear ${config.progressBar}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
