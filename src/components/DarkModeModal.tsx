import { X, Moon, Sun, Palette, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../api/client';
import { centeredToast } from './CenteredToast';

interface DarkModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggle: (enabled: boolean) => void;
  currentUser?: {
    id: string;
  };
}

export function DarkModeModal({ isOpen, onClose, darkMode, onToggle, currentUser }: DarkModeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const themes = [
    {
      id: 'light',
      name: 'Light Mode',
      description: 'Bright and colorful theme',
      icon: Sun,
      preview: 'bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500',
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Easy on the eyes',
      icon: Moon,
      preview: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    },
  ];

  const handleThemeSelect = async (themeId: string) => {
    const isDark = themeId === 'dark';
    
    // Update local state immediately for responsiveness
    onToggle(isDark);

    // Save to database if user is logged in
    if (currentUser?.id) {
      setIsLoading(true);
      try {
        const settingsPayload = { darkMode: isDark };
        await apiClient.updateUserSettings(currentUser.id, settingsPayload);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Theme preference not saved to server:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Allow body scrolling on mobile - don't lock it
      // This allows both modal and background to scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modal = modalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{
              background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              if (!isLoading) {
                onClose();
              }
            }}
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
            style={{
              zIndex: 10000,
              pointerEvents: 'none',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingTop: '2rem',
              paddingBottom: '2rem',
            }}
            data-modal-content
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden flex flex-col ${
                darkMode
                  ? 'bg-[#0f172a] border border-white/30'
                  : 'bg-white border border-black/10'
              }`}
              style={{
                boxShadow: darkMode
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'auto',
                maxHeight: '90dvh',
                margin: 'auto',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="theme-settings-title"
              onClick={(e) => e.stopPropagation()}
            >
        {/* Header */}
              <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
                <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        background: darkMode
                          ? 'linear-gradient(135deg, rgba(80, 250, 123, 0.2) 0%, rgba(139, 233, 253, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(102, 126, 234, 0.15) 100%)',
                      }}
                    >
                      <Palette size={18} className={darkMode ? 'text-[#50fa7b]' : 'text-[#4ecdc4]'} />
                    </div>
                    <div>
                      <h2
                        id="theme-settings-title"
                        className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Theme Settings
                      </h2>
            </div>
          </div>
                  <motion.button
            onClick={onClose}
            disabled={isLoading}
                    className={`p-2 rounded-xl transition-all ${
                      darkMode
                        ? 'hover:bg-white/10 disabled:opacity-50'
                        : 'hover:bg-black/5 disabled:opacity-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
          >
                    <X size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
                  </motion.button>
                </div>
        </div>

              {/* Content */}
              <div className={`px-5 py-5 space-y-5 overflow-y-auto flex-1 min-h-0 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  touchAction: 'pan-y',
                }}
                onTouchStart={(e) => {
                  // Allow touch events to propagate for proper scrolling
                  e.stopPropagation();
                }}
              >
        {/* Theme Options */}
                <div className="space-y-3">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isActive = darkMode ? theme.id === 'dark' : theme.id === 'light';
            
            return (
                      <motion.button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={isLoading}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                  isActive
                            ? darkMode
                              ? 'bg-white/10 border-white/30'
                              : 'bg-[#4ecdc4]/10 border-[#4ecdc4]/40'
                            : darkMode
                              ? 'bg-white/5 border-white/10 hover:bg-white/8'
                              : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
                        } disabled:opacity-50`}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center gap-4">
                          {/* Theme Preview Icon */}
                          <div className={`w-14 h-14 rounded-xl ${theme.preview} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="text-white" size={24} />
                  </div>

                  {/* Theme Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold mb-0.5 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                              {theme.name}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                              {theme.description}
                            </p>
                  </div>

                          {/* Checkmark */}
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  darkMode
                                    ? 'bg-gradient-to-br from-[#50fa7b] to-[#8be9fd]'
                                    : 'bg-gradient-to-br from-[#4ecdc4] to-[#667eea]'
                                }`}
                        >
                                <CheckCircle2 size={18} className="text-white" />
                              </motion.div>
                    )}
                  </div>
                </div>
                      </motion.button>
            );
          })}
        </div>

                {/* App Settings Info */}
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-start gap-3">
                    <Moon 
                      size={18} 
                      className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`} 
                    />
                    <p className={`text-sm ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
            {darkMode
                        ? 'Dark mode is active. The app will use darker colors to reduce eye strain.'
                        : 'Light mode is active. The app will use bright, vibrant colors.'}
          </p>
                  </div>
                </div>
        </div>

              {/* Footer */}
              <div className={`px-5 py-4 border-t ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
                <motion.button
          onClick={onClose}
          disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] text-[#0f0f1a] hover:from-[#50fa7b]/90 hover:to-[#8be9fd]/90'
                      : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:from-[#4ecdc4]/90 hover:to-[#667eea]/90'
                  } disabled:opacity-50 flex items-center justify-center gap-2`}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Done'
          )}
                </motion.button>
              </div>
            </motion.div>
    </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
