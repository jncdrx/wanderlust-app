import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

let toastId = 0;
let addToastListener: ((toast: ToastMessage) => void) | null = null;

// Custom toast function to replace sonner's toast
export const centeredToast = {
  success: (title: string, options?: { description?: string }) => {
    if (addToastListener) {
      addToastListener({ id: ++toastId, type: 'success', title, description: options?.description });
    }
  },
  error: (title: string, options?: { description?: string }) => {
    if (addToastListener) {
      addToastListener({ id: ++toastId, type: 'error', title, description: options?.description });
    }
  },
  warning: (title: string, options?: { description?: string }) => {
    if (addToastListener) {
      addToastListener({ id: ++toastId, type: 'warning', title, description: options?.description });
    }
  },
  info: (title: string, options?: { description?: string }) => {
    if (addToastListener) {
      addToastListener({ id: ++toastId, type: 'info', title, description: options?.description });
    }
  },
};

interface CenteredToastProviderProps {
  darkMode?: boolean;
}

export function CenteredToastProvider({ darkMode = false }: CenteredToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastListener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };

    return () => {
      addToastListener = null;
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 2147483647 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 pointer-events-auto animate-in fade-in duration-200"
        onClick={() => toasts.length > 0 && removeToast(toasts[0].id)}
      />
      
      {/* Toast */}
      {toasts.slice(0, 1).map((toast) => (
        <div
          key={toast.id}
          className={`
            relative pointer-events-auto
            flex items-center gap-3
            px-5 py-4 rounded-2xl
            min-w-[280px] max-w-[90vw]
            animate-in zoom-in-95 fade-in duration-200
            ${darkMode 
              ? 'bg-slate-800/95 border border-white/10' 
              : 'bg-white/95 border border-black/5'
            }
          `}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: darkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Icon */}
          {getIcon(toast.type)}
          
          {/* Content */}
          <div className="flex-1">
            <p className={`font-medium text-[15px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {toast.title}
            </p>
            {toast.description && (
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {toast.description}
              </p>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={() => removeToast(toast.id)}
            className={`p-1 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-white/10 text-white/60' 
                : 'hover:bg-black/5 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

