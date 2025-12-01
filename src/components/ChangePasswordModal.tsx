import { X, Lock, Eye, EyeOff, Loader2, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../api/client';
import { centeredToast } from './CenteredToast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
  };
  darkMode?: boolean;
}

export function ChangePasswordModal({ isOpen, onClose, currentUser, darkMode = false }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Password validation
  const isPasswordLongEnough = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const doPasswordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isFormValid = currentPassword && isPasswordLongEnough && doPasswordsMatch;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
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
  }, [isOpen, isLoading]);

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
    if (!isLoading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      if (currentUser?.id) {
        await apiClient.changePassword(currentUser.id, {
          currentPassword,
          newPassword,
        });

        centeredToast.success('Password changed!');
        handleClose();
      } else {
        centeredToast.error('Please log in again');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      centeredToast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyles = (fieldName: string) => {
    const isFocused = focusedField === fieldName;

    return `w-full pl-4 pr-12 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
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
              if (!isLoading) {
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
              className={`w-full max-w-sm rounded-2xl overflow-hidden ${
                darkMode
                  ? 'bg-[#0f172a] border border-white/30'
                  : 'bg-white border border-black/10'
              }`}
              style={{
                boxShadow: darkMode
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'auto',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="change-password-title"
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
                  <Lock size={18} className={darkMode ? 'text-[#8be9fd]' : 'text-[#667eea]'} />
                </div>
                <div>
                  <h2
                    id="change-password-title"
                    className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Change Password
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/60'}`}>
                    Keep your account secure
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                disabled={isLoading}
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

          {/* Content */}
          <div className="px-5 py-5 space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                Current Password
              </label>
              <div className="relative">
                <input
                  ref={firstInputRef}
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onFocus={() => setFocusedField('current')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className={getInputStyles('current')}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  disabled={isLoading}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                    darkMode ? 'text-white/40 hover:text-white/70' : 'text-[#1a1a2e]/40 hover:text-[#1a1a2e]/70'
                  }`}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField('new')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className={getInputStyles('new')}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  disabled={isLoading}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                    darkMode ? 'text-white/40 hover:text-white/70' : 'text-[#1a1a2e]/40 hover:text-[#1a1a2e]/70'
                  }`}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className={getInputStyles('confirm')}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={isLoading}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                    darkMode ? 'text-white/40 hover:text-white/70' : 'text-[#1a1a2e]/40 hover:text-[#1a1a2e]/70'
                  }`}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Inline Password Requirements - Only show when typing new password */}
            <AnimatePresence>
              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl p-3 ${darkMode ? 'bg-white/5' : 'bg-black/[0.02]'}`}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-1.5 text-[11px] ${
                      isPasswordLongEnough 
                        ? (darkMode ? 'text-green-400' : 'text-green-600')
                        : (darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40')
                    }`}>
                      {isPasswordLongEnough ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      <span>6+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${
                      hasUppercase 
                        ? (darkMode ? 'text-green-400' : 'text-green-600')
                        : (darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40')
                    }`}>
                      {hasUppercase ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${
                      hasNumber 
                        ? (darkMode ? 'text-green-400' : 'text-green-600')
                        : (darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40')
                    }`}>
                      {hasNumber ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${
                      doPasswordsMatch 
                        ? (darkMode ? 'text-green-400' : 'text-green-600')
                        : confirmPassword 
                          ? (darkMode ? 'text-red-400' : 'text-red-500')
                          : (darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40')
                    }`}>
                      {doPasswordsMatch ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security hint */}
            <p className={`text-[11px] flex items-center gap-1.5 ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
              <Shield size={11} />
              Use a unique password you don't use elsewhere
            </p>
          </div>

          {/* Footer */}
          <div className={`px-5 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
            <motion.button
              onClick={handleClose}
              disabled={isLoading}
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
              disabled={isLoading || !isFormValid}
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                isFormValid
                  ? darkMode
                    ? 'bg-[#8be9fd] text-[#0f0f1a] hover:bg-[#8be9fd]/90'
                    : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
                  : darkMode
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
              }`}
              style={{
                boxShadow: isFormValid
                  ? (darkMode
                      ? '0 4px 14px rgba(139, 233, 253, 0.3)'
                      : '0 4px 14px rgba(102, 126, 234, 0.3)')
                  : 'none',
              }}
              whileHover={isFormValid ? { scale: 1.02, y: -1 } : {}}
              whileTap={isFormValid ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Change Password
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
