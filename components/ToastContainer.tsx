import React, { memo } from 'react';
import { useToast } from '../contexts/ToastContext';
import { CheckCircleIcon, XMarkIcon } from './icons/index';

export const ToastContainer: React.FC = memo(() => {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  const iconMap = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    error: <XMarkIcon className="w-6 h-6 text-red-500" />,
    info: <CheckCircleIcon className="w-6 h-6 text-blue-500" />,
  };

  return (
    <div className="fixed top-24 right-6 z-modal space-y-3 w-full max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-white rounded-lg shadow-2xl p-4 flex items-start gap-3 animate-fade-in-right pointer-events-auto border border-gray-100"
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">
            {iconMap[toast.type]}
          </div>
          <div className="flex-grow text-brand-charcoal font-medium text-sm">
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';
