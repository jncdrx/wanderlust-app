import { X, Mail, Bell, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, Clock, Gift, Info, Shield, LucideIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../api/client';
import { centeredToast } from './CenteredToast';

// Premium Toggle Component
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

// Notification Card Component
interface NotificationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  iconColor: string;
  accentColor: string;
  iconGradient: string;
  darkMode?: boolean;
  tooltip?: string;
}

function NotificationCard({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
  disabled = false,
  iconColor,
  accentColor,
  iconGradient,
  darkMode = false,
  tooltip,
}: NotificationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
        darkMode 
          ? enabled 
            ? 'bg-white/8 border-white/15' 
            : 'bg-white/5 border-white/10 hover:bg-white/8'
          : enabled
            ? 'bg-black/[0.04] border-black/15'
            : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.04]'
      }`}
      initial={false}
      animate={{
        backgroundColor: enabled
          ? (darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
          : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'),
        borderColor: enabled
          ? (darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)')
          : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
      }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 flex-1">
        <motion.div
          className="p-2 rounded-lg"
          style={{
            background: iconGradient,
          }}
          animate={{
            scale: enabled ? 1.05 : 1,
          }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            animate={{
              color: enabled ? iconColor : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(26, 26, 46, 0.6)'),
              scale: enabled ? 1.1 : 1,
            }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Icon size={16} style={{ color: enabled ? iconColor : undefined }} />
          </motion.div>
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
              {title}
            </p>
            {tooltip && (
              <div className="group relative">
                <Info 
                  size={12} 
                  className={`${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'} cursor-help`}
                />
                <div className={`absolute left-0 bottom-full mb-2 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                  darkMode 
                    ? 'bg-[#1a1a2e] text-white border border-white/20' 
                    : 'bg-[#1a1a2e] text-white'
                }`}>
                  {tooltip}
                  <div className={`absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 ${
                    darkMode ? 'border-t-[#1a1a2e]' : 'border-t-[#1a1a2e]'
                  }`}></div>
                </div>
              </div>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
            {description}
          </p>
        </div>
      </div>
      <PremiumToggle
        enabled={enabled}
        onChange={onChange}
        disabled={disabled}
        accentColor={accentColor}
        darkMode={darkMode}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${title}`}
      />
    </motion.div>
  );
}

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    email?: string;
  };
  darkMode?: boolean;
}

export function EmailSettingsModal({ isOpen, onClose, currentUser, darkMode = false }: EmailSettingsModalProps) {
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification preferences
  const [tripUpdates, setTripUpdates] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [tipsOffers, setTipsOffers] = useState(false);

  // Settings state
  const [originalSettings, setOriginalSettings] = useState({
    tripUpdates: true,
    reminders: true,
    tipsOffers: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const newEmailInputRef = useRef<HTMLInputElement>(null);

  // Check if there are unsaved changes
  const hasChanges = 
    tripUpdates !== originalSettings.tripUpdates ||
    reminders !== originalSettings.reminders ||
    tipsOffers !== originalSettings.tipsOffers;

  // Fetch current settings when modal opens
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchSettings();
      // Reset email change form
      setNewEmail('');
      setCurrentPassword('');
      setVerificationSent(false);
      setVerificationEmail('');
      setFocusedField(null);
      setEmailError('');
      setPasswordError('');
    }
  }, [isOpen, currentUser?.id]);

  const fetchSettings = async () => {
    if (!currentUser?.id) return;

    setIsFetching(true);
    try {
      const settings = await apiClient.getUserSettings(currentUser.id);
      setTripUpdates(settings.tripUpdates);
      setReminders(settings.emailNotifications);
      setTipsOffers(settings.newsletter);
      setOriginalSettings({
        tripUpdates: settings.tripUpdates,
        reminders: settings.emailNotifications,
        tipsOffers: settings.newsletter,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !isSendingVerification) {
        handleClose();
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
  }, [isOpen, isLoading, isSendingVerification]);

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

  const handleClose = () => {
    if (!isLoading && !isSendingVerification) {
      setNewEmail('');
      setCurrentPassword('');
      setVerificationSent(false);
      setVerificationEmail('');
      setEmailError('');
      setPasswordError('');
      onClose();
    }
  };

  const validateEmailChange = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!newEmail.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      } else if (newEmail === currentUser?.email) {
        setEmailError('New email must be different from current email');
        isValid = false;
      }
    }

    if (!currentPassword.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSendVerification = async () => {
    if (!validateEmailChange()) return;
    if (!currentUser?.id) {
      centeredToast.error('User not found. Please log in again.');
      return;
    }

    setIsSendingVerification(true);
    try {
      await apiClient.sendEmailVerification(currentUser.id, newEmail, currentPassword);
      setVerificationSent(true);
      setVerificationEmail(newEmail);
      setNewEmail('');
      setCurrentPassword('');
      setEmailError('');
      setPasswordError('');
      centeredToast.success('Verification link sent!', {
        description: `Check ${verificationEmail} for the confirmation link`,
      });
    } catch (error) {
      console.error('Failed to send verification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
      centeredToast.error(errorMessage);
      if (errorMessage.toLowerCase().includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setEmailError(errorMessage);
      }
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) {
      centeredToast.error('User not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.updateUserSettings(currentUser.id, {
        emailNotifications: reminders,
        newsletter: tipsOffers,
        tripUpdates,
      });

      setOriginalSettings({
        tripUpdates,
        reminders,
        tipsOffers,
      });

      centeredToast.success('Email settings saved successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      centeredToast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyles = (fieldName: string) => {
    const isFocused = focusedField === fieldName;

    return `w-full pl-11 pr-12 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
      isFocused
        ? darkMode
          ? 'bg-white/10 border-2 border-[#8be9fd] text-white'
          : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e]'
        : darkMode
          ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8'
          : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05]'
    } ${darkMode ? 'placeholder:text-white/30' : 'placeholder:text-[#1a1a2e]/40'}`;
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Semi-transparent dark overlay */}
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
              if (!isLoading && !isSendingVerification) {
                handleClose();
              }
            }}
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              zIndex: 10000,
              pointerEvents: 'none',
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
                maxHeight: '90vh',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="email-settings-title"
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
                      ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.2) 0%, rgba(189, 147, 249, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.15) 100%)',
                  }}
                >
                  <Mail size={18} className={darkMode ? 'text-[#8be9fd]' : 'text-[#667eea]'} />
                </div>
                <div>
                  <h2
                    id="email-settings-title"
                    className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Email settings
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/60'}`}>
                    Manage your Wanderlust email and notifications
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                disabled={isLoading || isSendingVerification}
                className={`p-2 rounded-xl transition-all ${
                  darkMode
                    ? 'hover:bg-white/10 disabled:opacity-50'
                    : 'hover:bg-black/5 disabled:opacity-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close"
              >
                <X size={18} className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} />
              </motion.button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div 
            className={`px-5 py-5 space-y-6 overflow-y-auto flex-1 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
            style={{
              maxHeight: 'calc(90vh - 180px)',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className={`animate-spin ${darkMode ? 'text-[#8be9fd]' : 'text-[#667eea]'}`} />
              </div>
            ) : (
              <>
                {/* Email Management Card */}
                <div className={`rounded-2xl border p-5 space-y-5 ${
                  darkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Email Management
                    </h3>
                  </div>

                  {/* Primary Email */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Primary email
                    </label>
                    <div className={`p-4 rounded-xl border ${
                      darkMode 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-black/[0.02] border-black/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail 
                            size={18} 
                            className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} 
                          />
                          <div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                              {currentUser?.email || 'No email on file'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Shield size={12} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                              <span className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Change Email Section */}
                  <div className="space-y-3 pt-2 border-t border-white/10 dark:border-white/10 border-black/10">
                    <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Change email
                    </label>
                    
                    <AnimatePresence>
                      {verificationSent && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`p-4 rounded-xl border flex items-start gap-3 ${
                            darkMode
                              ? 'bg-teal-500/20 border-teal-500/40'
                              : 'bg-teal-50 border-teal-200'
                          }`}
                        >
                          <CheckCircle2 size={20} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                              Verification link sent successfully!
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-white/80' : 'text-teal-600/90'}`}>
                              Check <span className="font-medium">{verificationEmail}</span> for the confirmation link
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className={`text-xs font-medium ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
                            New email
                          </label>
                        </div>
                        <input
                          ref={newEmailInputRef}
                          type="email"
                          placeholder="Enter new email address"
                          value={newEmail}
                          onChange={(e) => {
                            setNewEmail(e.target.value);
                            setEmailError('');
                            if (verificationSent) setVerificationSent(false);
                          }}
                          onFocus={() => setFocusedField('newEmail')}
                          onBlur={() => {
                            setFocusedField(null);
                            if (newEmail) validateEmailChange();
                          }}
                          disabled={isSendingVerification || isLoading}
                          className={`w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
                            emailError
                              ? darkMode
                                ? 'bg-red-500/10 border-2 border-red-400 text-white'
                                : 'bg-red-50 border-2 border-red-400 text-[#1a1a2e]'
                              : focusedField === 'newEmail'
                                ? darkMode
                                  ? 'bg-white/10 border-2 border-[#8be9fd] text-white'
                                  : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e]'
                                : darkMode
                                  ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8'
                                  : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05]'
                          } ${darkMode ? 'placeholder:text-white/30' : 'placeholder:text-[#1a1a2e]/40'}`}
                          aria-invalid={!!emailError}
                          aria-describedby={emailError ? 'email-error' : undefined}
                        />
                        {emailError ? (
                          <p id="email-error" className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5">
                            <AlertCircle size={12} />
                            {emailError}
                          </p>
                        ) : (
                          <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                            <Info size={11} />
                            A confirmation link will be sent to this address
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className={`text-xs font-medium ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
                            Current password
                          </label>
                          <div className="group relative">
                            <Info 
                              size={12} 
                              className={`${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'} cursor-help`}
                            />
                            <div className={`absolute left-0 bottom-full mb-2 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                              darkMode 
                                ? 'bg-[#1a1a2e] text-white border border-white/20' 
                                : 'bg-[#1a1a2e] text-white'
                            }`}>
                              Required to verify your identity
                              <div className={`absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 ${
                                darkMode ? 'border-t-[#1a1a2e]' : 'border-t-[#1a1a2e]'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            value={currentPassword}
                            onChange={(e) => {
                              setCurrentPassword(e.target.value);
                              setPasswordError('');
                              if (verificationSent) setVerificationSent(false);
                            }}
                            onFocus={() => setFocusedField('currentPassword')}
                            onBlur={() => {
                              setFocusedField(null);
                              if (currentPassword) validateEmailChange();
                            }}
                            disabled={isSendingVerification || isLoading}
                            className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
                              passwordError
                                ? darkMode
                                  ? 'bg-red-500/10 border-2 border-red-400 text-white'
                                  : 'bg-red-50 border-2 border-red-400 text-[#1a1a2e]'
                                : focusedField === 'currentPassword'
                                  ? darkMode
                                    ? 'bg-white/10 border-2 border-[#8be9fd] text-white'
                                    : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e]'
                                  : darkMode
                                    ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8'
                                    : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05]'
                            } ${darkMode ? 'placeholder:text-white/30' : 'placeholder:text-[#1a1a2e]/40'}`}
                            aria-invalid={!!passwordError}
                            aria-describedby={passwordError ? 'password-error' : undefined}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSendingVerification || isLoading}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors group ${
                              darkMode ? 'text-white/40 hover:text-white/70 hover:bg-white/10' : 'text-[#1a1a2e]/40 hover:text-[#1a1a2e]/70 hover:bg-black/5'
                            }`}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {passwordError && (
                          <p id="password-error" className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5">
                            <AlertCircle size={12} />
                            {passwordError}
                          </p>
                        )}
                      </div>

                      <motion.button
                        onClick={handleSendVerification}
                        disabled={!newEmail.trim() || !currentPassword.trim() || !!emailError || !!passwordError || isSendingVerification || isLoading}
                        className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          newEmail.trim() && currentPassword.trim() && !emailError && !passwordError && !isSendingVerification && !isLoading
                            ? darkMode
                              ? 'bg-[#8be9fd] text-[#0f0f1a] hover:bg-[#8be9fd]/90'
                              : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
                            : darkMode
                              ? 'bg-white/10 text-white/30 cursor-not-allowed'
                              : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
                        }`}
                        style={{
                          boxShadow: newEmail.trim() && currentPassword.trim() && !emailError && !passwordError && !isSendingVerification && !isLoading
                            ? (darkMode
                                ? '0 4px 14px rgba(139, 233, 253, 0.3)'
                                : '0 4px 14px rgba(102, 126, 234, 0.3)')
                            : 'none',
                        }}
                        whileHover={newEmail.trim() && currentPassword.trim() && !emailError && !passwordError && !isSendingVerification && !isLoading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={newEmail.trim() && currentPassword.trim() && !emailError && !passwordError && !isSendingVerification && !isLoading ? { scale: 0.98 } : {}}
                        title="Send verification email to the new address"
                      >
                        {isSendingVerification ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending verification...
                          </>
                        ) : (
                          <>
                            <Mail size={16} />
                            Send verification to new email
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences Card */}
                <div className={`rounded-2xl border p-5 space-y-4 ${
                  darkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Email Notifications
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Trip Updates */}
                    <NotificationCard
                      icon={Bell}
                      title="Trip updates"
                      description="Reminders and changes"
                      enabled={tripUpdates}
                      onChange={setTripUpdates}
                      disabled={isLoading || isSendingVerification}
                      iconColor={darkMode ? '#8be9fd' : '#667eea'}
                      accentColor={darkMode ? '#8be9fd' : '#667eea'}
                      iconGradient={darkMode
                        ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.2) 0%, rgba(189, 147, 249, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.15) 100%)'}
                      darkMode={darkMode}
                      tooltip="Get notified about trip changes and updates"
                    />

                    {/* Reminders */}
                    <NotificationCard
                      icon={Clock}
                      title="Reminders"
                      description="Important trip reminders"
                      enabled={reminders}
                      onChange={setReminders}
                      disabled={isLoading || isSendingVerification}
                      iconColor={darkMode ? '#50fa7b' : '#4ecdc4'}
                      accentColor={darkMode ? '#50fa7b' : '#4ecdc4'}
                      iconGradient={darkMode
                        ? 'linear-gradient(135deg, rgba(80, 250, 123, 0.2) 0%, rgba(139, 233, 253, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(102, 126, 234, 0.15) 100%)'}
                      darkMode={darkMode}
                      tooltip="Receive important trip reminders and deadlines"
                    />

                    {/* Tips & Offers */}
                    <NotificationCard
                      icon={Gift}
                      title="Tips & offers"
                      description="Travel tips and inspiration"
                      enabled={tipsOffers}
                      onChange={setTipsOffers}
                      disabled={isLoading || isSendingVerification}
                      iconColor={darkMode ? '#ff79c6' : '#ff6b6b'}
                      accentColor={darkMode ? '#ff79c6' : '#ff6b6b'}
                      iconGradient={darkMode
                        ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.2) 0%, rgba(189, 147, 249, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(102, 126, 234, 0.15) 100%)'}
                      darkMode={darkMode}
                      tooltip="Receive travel tips, deals, and inspiration"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`px-5 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
            <motion.button
              onClick={handleClose}
              disabled={isLoading || isSendingVerification}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-black/5'
              } disabled:opacity-50`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isSendingVerification}
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                hasChanges && !isLoading && !isSendingVerification
                  ? darkMode
                    ? 'bg-[#8be9fd] text-[#0f0f1a] hover:bg-[#8be9fd]/90'
                    : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
                  : darkMode
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
              }`}
              style={{
                boxShadow: hasChanges && !isLoading && !isSendingVerification
                  ? (darkMode
                      ? '0 4px 14px rgba(139, 233, 253, 0.3)'
                      : '0 4px 14px rgba(102, 126, 234, 0.3)')
                  : 'none',
              }}
              whileHover={hasChanges && !isLoading && !isSendingVerification ? { scale: 1.02, y: -1 } : {}}
              whileTap={hasChanges && !isLoading && !isSendingVerification ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Mail size={14} />
                  Save changes
                </>
              )}
            </motion.button>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
