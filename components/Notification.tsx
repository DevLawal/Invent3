import React, { useEffect } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, ClearIcon } from './Icons';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50 dark:bg-green-900/50' : 'bg-red-50 dark:bg-red-900/50';
  const borderColor = isSuccess ? 'border-green-400 dark:border-green-600' : 'border-red-400 dark:border-red-600';
  const textColor = isSuccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';

  return (
    <div
      className={`fixed top-5 right-5 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} animate-fade-in-down`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <CheckCircleIcon className={`w-6 h-6 ${iconColor}`} />
          ) : (
            <AlertTriangleIcon className={`w-6 h-6 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current`}
          >
            <span className="sr-only">Close</span>
            <ClearIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;
