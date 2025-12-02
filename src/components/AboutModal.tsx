import { X, FileText, Shield, HelpCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '../context/SessionContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

type AboutScreen = 'main' | 'privacy' | 'terms' | 'help';

export function AboutModal({ isOpen, onClose, darkMode: propDarkMode }: AboutModalProps) {
  const { darkMode: sessionDarkMode } = useSession();
  const darkMode = propDarkMode ?? sessionDarkMode;
  const [currentScreen, setCurrentScreen] = useState<AboutScreen>('main');
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset to main screen when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentScreen('main');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentScreen === 'main') {
          onClose();
        } else {
          setCurrentScreen('main');
        }
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
  }, [isOpen, currentScreen, onClose]);

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

  const renderMainScreen = () => (
    <>
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
              <Shield size={18} className={darkMode ? 'text-[#50fa7b]' : 'text-[#4ecdc4]'} />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                About
              </h2>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              darkMode
                ? 'hover:bg-white/10'
                : 'hover:bg-black/5'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 py-5 space-y-3 overflow-y-auto flex-1 min-h-0 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
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
      {/* Menu Items */}
        <motion.button
          onClick={() => setCurrentScreen('privacy')}
          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
            darkMode
              ? 'bg-white/5 border-white/10 hover:bg-white/10'
              : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <FileText className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} size={18} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Privacy Policy
            </span>
          </div>
          <ChevronRight className={darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'} size={18} />
        </motion.button>

        <motion.button
          onClick={() => setCurrentScreen('terms')}
          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
            darkMode
              ? 'bg-white/5 border-white/10 hover:bg-white/10'
              : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <Shield className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} size={18} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Terms of Service
            </span>
          </div>
          <ChevronRight className={darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'} size={18} />
        </motion.button>

        <motion.button
          onClick={() => setCurrentScreen('help')}
          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
            darkMode
              ? 'bg-white/5 border-white/10 hover:bg-white/10'
              : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} size={18} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Help & Support
            </span>
          </div>
          <ChevronRight className={darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'} size={18} />
        </motion.button>

        {/* App Settings Section */}
        <div className={`pt-3 mt-3 border-t ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
          }`}>
            App Settings
          </p>

      {/* Version */}
          <div className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
        <div className="flex items-center justify-between">
              <span className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}>Version</span>
              <span className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-4 border-t ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <motion.button
        onClick={onClose}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            darkMode
              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] text-[#0f0f1a] hover:from-[#50fa7b]/90 hover:to-[#8be9fd]/90'
              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:from-[#4ecdc4]/90 hover:to-[#667eea]/90'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
      >
        Close
        </motion.button>
      </div>
    </>
  );

  const renderPrivacyScreen = () => (
    <>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <motion.button
            onClick={() => setCurrentScreen('main')}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
          >
              <ArrowLeft size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
            </motion.button>
            <div>
              <h2
                className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Privacy Policy
              </h2>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 py-5 overflow-y-auto flex-1 min-h-0 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
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
        <div className={`p-4 rounded-xl border ${
          darkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-black/[0.02] border-black/10'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
            Your Privacy Matters
          </h3>
          <div className={`space-y-4 text-sm ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
          <p>
            Your privacy is important to us. This Travel Itinerary Management app is designed with your privacy in mind.
          </p>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Data Storage:</strong>
              <p className="mt-1">
                All your travel data, including destinations, itineraries, photos, and preferences are stored locally on your device.
          </p>
            </div>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>No Third-Party Sharing:</strong>
              <p className="mt-1">
                We do not share your personal information with third parties. Your travel plans remain private.
          </p>
            </div>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Photos:</strong>
              <p className="mt-1">
                All photos you upload are stored locally and are not transmitted to any external servers.
          </p>
            </div>
            <p className={`italic ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
            Last updated: October 16, 2025
          </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-4 border-t ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <motion.button
        onClick={() => setCurrentScreen('main')}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            darkMode
              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] text-[#0f0f1a] hover:from-[#50fa7b]/90 hover:to-[#8be9fd]/90'
              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:from-[#4ecdc4]/90 hover:to-[#667eea]/90'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
      >
        Back
        </motion.button>
      </div>
    </>
  );

  const renderTermsScreen = () => (
    <>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <motion.button
            onClick={() => setCurrentScreen('main')}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
          >
              <ArrowLeft size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
            </motion.button>
            <div>
              <h2
                className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Terms of Service
              </h2>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 py-5 overflow-y-auto flex-1 min-h-0 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
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
        <div className={`p-4 rounded-xl border ${
          darkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-black/[0.02] border-black/10'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
            Terms & Conditions
          </h3>
          <div className={`space-y-4 text-sm ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
          <p>
            By using this Travel Itinerary Management app, you agree to the following terms and conditions.
          </p>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Demo Application:</strong>
              <p className="mt-1">
                This is a demonstration application created to showcase travel management features. It is not intended for production use with real personal data.
          </p>
            </div>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Usage:</strong>
              <p className="mt-1">
                You may use this app to plan and organize your travel itineraries, manage destinations, and store travel photos.
          </p>
            </div>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Acceptable Use:</strong>
              <p className="mt-1">
                You agree not to use this app for any unlawful purposes or in any way that could damage, disable, or impair the application.
          </p>
            </div>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Modifications:</strong>
              <p className="mt-1">
                We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of modified terms.
          </p>
            </div>
            <div>
              <strong className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>Disclaimer:</strong>
              <p className="mt-1">
                This app is provided "as is" without warranties of any kind.
          </p>
            </div>
            <p className={`italic ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
            Last updated: October 16, 2025
          </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-4 border-t ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <motion.button
        onClick={() => setCurrentScreen('main')}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            darkMode
              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] text-[#0f0f1a] hover:from-[#50fa7b]/90 hover:to-[#8be9fd]/90'
              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:from-[#4ecdc4]/90 hover:to-[#667eea]/90'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
      >
        Back
        </motion.button>
      </div>
    </>
  );

  const renderHelpScreen = () => (
    <>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <motion.button
            onClick={() => setCurrentScreen('main')}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
          >
              <ArrowLeft size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
            </motion.button>
            <div>
              <h2
                className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Help & Support
              </h2>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 py-5 overflow-y-auto flex-1 min-h-0 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
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
        <div className="space-y-5">
          {/* Get Help */}
          <div className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Get Help
            </h3>
            <p className={`text-sm ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
            Need help with the Travel Itinerary Management app? We're here to assist you!
          </p>
          </div>

          {/* Contact Us */}
          <div className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Contact Us:
            </h3>
            <div className={`space-y-1 text-sm ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
              <p>Email: johncedrix9@gmail.com</p>
            <p>Phone: +63 9998143486</p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Quick Tips:
            </h3>
            <ul className={`space-y-2 list-disc list-inside text-sm ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
              <li>Tap the + button to add new trips or destinations</li>
              <li>Long press on items to edit or delete them</li>
              <li>Use the gallery to store and organize travel photos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-4 border-t ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
        <motion.button
        onClick={() => setCurrentScreen('main')}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            darkMode
              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] text-[#0f0f1a] hover:from-[#50fa7b]/90 hover:to-[#8be9fd]/90'
              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:from-[#4ecdc4]/90 hover:to-[#667eea]/90'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
      >
        Back
        </motion.button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (currentScreen) {
      case 'privacy':
        return renderPrivacyScreen();
      case 'terms':
        return renderTermsScreen();
      case 'help':
        return renderHelpScreen();
      default:
        return renderMainScreen();
    }
  };

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
              if (currentScreen === 'main') {
                onClose();
              } else {
                setCurrentScreen('main');
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
              aria-labelledby="about-title"
              onClick={(e) => e.stopPropagation()}
            >
        {renderContent()}
            </motion.div>
    </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
