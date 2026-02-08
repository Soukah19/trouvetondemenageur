import { ToastType } from '../components/Toast';

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
};

let toastListeners: ((toast: ToastMessage) => void)[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  const toast: ToastMessage = {
    id: Math.random().toString(36).substr(2, 9),
    message,
    type,
  };

  toastListeners.forEach((listener) => listener(toast));
}

export function subscribeToToasts(listener: (toast: ToastMessage) => void) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter((l) => l !== listener);
  };
}

export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
  warning: (message: string) => showToast(message, 'warning'),
  info: (message: string) => showToast(message, 'info'),
};
