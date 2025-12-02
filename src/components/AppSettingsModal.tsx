import { X, Globe, MapPin, Calendar, Cloud, FileText, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { centeredToast } from './CenteredToast';
import { useSession } from '../context/SessionContext';
import { useSettings } from '../context/SettingsContext';

// Premium Toggle Component (reused from EmailSettingsModal)
interface PremiumToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  accentColor?: string;
  darkMode?: boolean;
  'aria-label'?: string;
}

function PremiumToggle({ enabled, onChange, disabled = false, accentColor, darkMode = false, 'aria-label': ariaLabel }: PremiumToggleProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [justToggled, setJustToggled] = useState(false);
  
  const handleToggle = () => {
    if (disabled) return;
    setJustToggled(true);
    onChange(!enabled);
    setTimeout(() => setJustToggled(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const trackColor = enabled 
    ? (accentColor || (darkMode ? '#8be9fd' : '#667eea'))
    : (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)');

  const focusRingColor = accentColor || (darkMode ? '#8be9fd' : '#667eea');

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-all relative focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        backgroundColor: trackColor,
      }}
      whileFocus={{ 
        scale: 1.05,
        boxShadow: `0 0 0 3px ${focusRingColor}40`,
        transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
      }}
      aria-label={ariaLabel}
      aria-pressed={enabled}
      role="switch"
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
        initial={false}
        animate={{
          x: enabled ? 26 : 2,
          scale: justToggled && enabled ? 1.1 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
        style={{
          boxShadow: enabled && justToggled
            ? `0 0 12px ${accentColor || (darkMode ? '#8be9fd' : '#667eea')}40`
            : '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
      <AnimatePresence>
        {enabled && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: `radial-gradient(circle, ${accentColor || (darkMode ? '#8be9fd' : '#667eea')}20 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export function AppSettingsModal({ isOpen, onClose, darkMode: propDarkMode }: AppSettingsModalProps) {
  const { darkMode: sessionDarkMode, currentUser } = useSession();
  const { appSettings, updateAppSettings, isLoading: settingsLoading } = useSettings();
  const darkMode = propDarkMode ?? sessionDarkMode;
  const [language, setLanguage] = useState(appSettings.language);
  const [dateFormat, setDateFormat] = useState(appSettings.dateFormat);
  const [mapView, setMapView] = useState(appSettings.mapView);
  const [autoBackup, setAutoBackup] = useState(appSettings.autoBackup);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen && appSettings) {
      setLanguage(appSettings.language);
      setDateFormat(appSettings.dateFormat);
      setMapView(appSettings.mapView);
      setAutoBackup(appSettings.autoBackup);
    }
  }, [isOpen, appSettings]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving && !settingsLoading) {
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
  }, [isOpen, isSaving, settingsLoading, onClose]);

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

  // Save settings in real-time when changed
  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (currentUser?.id) {
      try {
        setIsSaving(true);
        await updateAppSettings({ language: lang });
        centeredToast.success('Language updated', {
          description: 'Your language preference has been saved.',
        });
      } catch (error) {
        centeredToast.error('Failed to save language');
        setLanguage(appSettings.language); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDateFormatChange = async (format: string) => {
    setDateFormat(format);
    if (currentUser?.id) {
      try {
        setIsSaving(true);
        await updateAppSettings({ dateFormat: format });
        centeredToast.success('Date format updated', {
          description: 'Your date format preference has been saved.',
        });
      } catch (error) {
        centeredToast.error('Failed to save date format');
        setDateFormat(appSettings.dateFormat); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleMapViewChange = async (view: string) => {
    setMapView(view);
    if (currentUser?.id) {
      try {
        setIsSaving(true);
        await updateAppSettings({ mapView: view });
        centeredToast.success('Map view updated', {
          description: 'Your map view preference has been saved.',
        });
      } catch (error) {
        centeredToast.error('Failed to save map view');
        setMapView(appSettings.mapView); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAutoBackupChange = async (enabled: boolean) => {
    setAutoBackup(enabled);
    if (currentUser?.id) {
      try {
        setIsSaving(true);
        await updateAppSettings({ autoBackup: enabled });
        centeredToast.success('Auto backup updated', {
          description: enabled ? 'Auto backup is now enabled.' : 'Auto backup is now disabled.',
    });
      } catch (error) {
        centeredToast.error('Failed to save auto backup setting');
        setAutoBackup(appSettings.autoBackup); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSave = async () => {
    // Settings are already saved in real-time, just close the modal
    onClose();
  };

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
              if (!isSaving && !settingsLoading) {
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
              aria-labelledby="app-settings-title"
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
                      <Settings size={18} className={darkMode ? 'text-[#50fa7b]' : 'text-[#4ecdc4]'} />
                    </div>
                    <div>
                      <h2
                        id="app-settings-title"
                        className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        App Settings
                      </h2>
                    </div>
                  </div>
                  <motion.button
            onClick={onClose}
                    disabled={isSaving || settingsLoading}
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
          {/* Language */}
                <div className="space-y-3">
                  <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    <Globe size={16} className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} />
              Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['English', 'Spanish', 'French', 'German'].map((lang) => (
                      <motion.button
                  key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        disabled={isSaving || settingsLoading}
                        className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${
                    language === lang
                            ? darkMode
                              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] border-white/30 text-[#0f0f1a]'
                              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] border-[#4ecdc4]/40 text-white'
                            : darkMode
                              ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50'
                              : 'bg-black/[0.02] border-black/10 text-[#1a1a2e]/70 hover:bg-black/[0.05] disabled:opacity-50'
                  }`}
                        whileHover={!isSaving && !settingsLoading ? { scale: 1.02 } : {}}
                        whileTap={!isSaving && !settingsLoading ? { scale: 0.98 } : {}}
                >
                  {lang}
                      </motion.button>
              ))}
            </div>
          </div>

          {/* Date Format */}
                <div className="space-y-3">
                  <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    <Calendar size={16} className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} />
              Date Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((format) => (
                      <motion.button
                  key={format}
                        onClick={() => handleDateFormatChange(format)}
                        disabled={isSaving || settingsLoading}
                        className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${
                    dateFormat === format
                            ? darkMode
                              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] border-white/30 text-[#0f0f1a]'
                              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] border-[#4ecdc4]/40 text-white'
                            : darkMode
                              ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50'
                              : 'bg-black/[0.02] border-black/10 text-[#1a1a2e]/70 hover:bg-black/[0.05] disabled:opacity-50'
                  }`}
                        whileHover={!isSaving && !settingsLoading ? { scale: 1.02 } : {}}
                        whileTap={!isSaving && !settingsLoading ? { scale: 0.98 } : {}}
                >
                  {format}
                      </motion.button>
              ))}
            </div>
          </div>

          {/* Map View */}
                <div className="space-y-3">
                  <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    <MapPin size={16} className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} />
              Default Map View
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Standard', 'Satellite', 'Terrain'].map((view) => (
                      <motion.button
                  key={view}
                        onClick={() => handleMapViewChange(view)}
                        disabled={isSaving || settingsLoading}
                        className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${
                    mapView === view
                            ? darkMode
                              ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] border-white/30 text-[#0f0f1a]'
                              : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] border-[#4ecdc4]/40 text-white'
                            : darkMode
                              ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50'
                              : 'bg-black/[0.02] border-black/10 text-[#1a1a2e]/70 hover:bg-black/[0.05] disabled:opacity-50'
                  }`}
                        whileHover={!isSaving && !settingsLoading ? { scale: 1.02 } : {}}
                        whileTap={!isSaving && !settingsLoading ? { scale: 0.98 } : {}}
                >
                  {view}
                      </motion.button>
              ))}
            </div>
          </div>

          {/* Auto Backup */}
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}>
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
                        <Cloud size={18} className={darkMode ? 'text-[#50fa7b]' : 'text-[#4ecdc4]'} />
              </div>
              <div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                          Auto Backup
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                          Backup data automatically
                        </p>
              </div>
            </div>
                    <PremiumToggle
                      enabled={autoBackup}
                      onChange={handleAutoBackupChange}
                      disabled={isSaving || settingsLoading}
                      darkMode={darkMode}
                      accentColor={darkMode ? '#8be9fd' : '#667eea'}
                      aria-label="Toggle auto backup"
                    />
                  </div>
          </div>

                {/* Storage Usage */}
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <p className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Storage Usage
                  </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}>Photos</span>
                      <span className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>2.4 MB</span>
              </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      darkMode ? 'bg-white/20' : 'bg-black/10'
                    }`}>
                      <div 
                        className={`h-full rounded-full ${
                          darkMode
                            ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd]'
                            : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea]'
                        }`}
                        style={{ width: '2.4%' }}
                      />
              </div>
              <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}>Total Used</span>
                      <span className={darkMode ? 'text-white' : 'text-[#1a1a2e]'}>2.4 / 100 MB</span>
            </div>
          </div>
        </div>

                {/* Privacy & Terms */}
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <FileText 
                      size={18} 
                      className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} 
                    />
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Privacy & Terms
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`px-5 py-4 border-t ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
                <motion.button
            onClick={handleSave}
                  disabled={isSaving || settingsLoading}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] text-[#0f0f1a] hover:from-[#50fa7b]/90 hover:to-[#8be9fd]/90'
                      : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:from-[#4ecdc4]/90 hover:to-[#667eea]/90'
                  } disabled:opacity-50 flex items-center justify-center gap-2`}
                  whileHover={!isSaving && !settingsLoading ? { scale: 1.02 } : {}}
                  whileTap={!isSaving && !settingsLoading ? { scale: 0.98 } : {}}
                >
                  {isSaving || settingsLoading ? (
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
