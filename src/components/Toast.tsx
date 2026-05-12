import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-3 p-4 pr-12
        min-w-[320px] max-w-md
        border-l-4 rounded-lg shadow-lg
        animate-slide-in-right
        ${getStyles()}
      `}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1">
        <p className={`text-sm font-medium ${getTextColor()}`}>
          {message}
        </p>
      </div>

      <button
        onClick={onClose}
        className={`
          absolute top-2 right-2
          p-1 rounded-lg
          hover:bg-black/5 dark:hover:bg-white/5
          transition-colors
          ${getTextColor()}
        `}
      >
        <XMarkIcon className="w-5 h-5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
