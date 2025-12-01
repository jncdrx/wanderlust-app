import { LogOut, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  darkMode?: boolean;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm, darkMode = false }: LogoutConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modal = modalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus the cancel button first (safer option)
      firstElement?.focus();

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      modal.addEventListener('keydown', handleTab);
      return () => modal.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
          className={`w-full max-w-xs rounded-2xl overflow-hidden ${
            darkMode
              ? 'bg-[#1a1a2e] border border-white/10'
              : 'bg-white border border-black/5'
          }`}
          style={{
            boxShadow: darkMode
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          aria-describedby="logout-description"
        >
          {/* Content */}
          <div className="p-5 text-center">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.2) 0%, rgba(255, 85, 85, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(239, 68, 68, 0.15) 100%)',
              }}
            >
              <LogOut size={20} className={darkMode ? 'text-[#ff79c6]' : 'text-red-500'} />
            </div>

            {/* Title */}
            <h2
              id="logout-title"
              className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Log out of Wanderlust?
            </h2>

            {/* Description */}
            <p
              id="logout-description"
              className={`text-sm ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}
            >
              You'll need to sign in again to access your trips and photos.
            </p>
          </div>

          {/* Actions */}
          <div className={`px-5 pb-5 flex gap-3`}>
            <motion.button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                  : 'bg-black/5 text-[#1a1a2e] hover:bg-black/10 border border-black/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                darkMode
                  ? 'bg-[#ff79c6] text-[#0f0f1a] hover:bg-[#ff79c6]/90'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              style={{
                boxShadow: darkMode
                  ? '0 4px 14px rgba(255, 121, 198, 0.3)'
                  : '0 4px 14px rgba(239, 68, 68, 0.3)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut size={14} />
              Log out
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

