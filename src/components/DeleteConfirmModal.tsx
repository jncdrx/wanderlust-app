import { AlertTriangle, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  darkMode?: boolean;
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName,
  itemType = 'trip',
  darkMode = false
}: DeleteConfirmModalProps) {
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

      // Focus the cancel button (last element, which is Cancel)
      lastElement?.focus();

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        } else {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
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

  // Format item type for display
  const formattedType = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{
          background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
          className={`w-full max-w-sm rounded-2xl overflow-hidden ${
            darkMode
              ? 'bg-[#0f172a] border border-white/30'
              : 'bg-white border border-black/10'
          }`}
          style={{
            boxShadow: darkMode
              ? '0 25px 50px -12px rgba(0, 0, 0, 1), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-7 text-center">
            {/* Warning Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.15) 100%)',
                border: darkMode ? '2px solid rgba(239, 68, 68, 0.4)' : '2px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertTriangle size={32} className={darkMode ? 'text-red-400' : 'text-red-500'} strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h2
              id="delete-title"
              className={`text-2xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Delete {formattedType}?
            </h2>

            {/* Warning Message */}
            <p
              id="delete-description"
              className={`text-base leading-relaxed mb-7 ${darkMode ? 'text-white/95' : 'text-[#1a1a2e]/80'}`}
            >
              {itemType === 'photo' 
                ? 'Delete this photo? This action can\'t be undone.'
                : `"${itemName}" will be permanently deleted. This can't be undone.`}
            </p>
          </div>

          {/* Actions */}
          <div className={`px-6 pb-6 flex flex-col gap-3`}>
            {/* Primary Destructive Button - Bold Red/Pink Pill */}
            <motion.button
              onClick={handleConfirm}
              className={`w-full py-3.5 px-6 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all ${
                darkMode
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
              }`}
              style={{
                boxShadow: darkMode
                  ? '0 6px 20px rgba(239, 68, 68, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 6px 20px rgba(239, 68, 68, 0.5)',
              }}
              whileHover={{ scale: 1.02, boxShadow: darkMode ? '0 8px 24px rgba(239, 68, 68, 0.7)' : '0 8px 24px rgba(239, 68, 68, 0.6)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={18} strokeWidth={2.5} />
              Delete {itemType === 'photo' ? 'photo' : formattedType.toLowerCase()}
            </motion.button>
            
            {/* Low-emphasis Cancel Button */}
            <motion.button
              onClick={onClose}
              className={`w-full py-3 text-sm font-medium transition-all ${
                darkMode
                  ? 'text-white/70 hover:text-white'
                  : 'text-[#1a1a2e]/70 hover:text-[#1a1a2e]'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render modal via portal to document.body to ensure it's always on top
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
