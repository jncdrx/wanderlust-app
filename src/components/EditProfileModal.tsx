import { X, Loader2, AlertCircle, CheckCircle2, Pencil, Mail, ExternalLink, Camera, Upload, X as XIcon } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../api/client';
import { centeredToast } from './CenteredToast';

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentUser?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
  onSave: (name: string, email: string) => void;
  onProfileUpdated?: (user: { firstName: string; lastName: string; email: string; profilePhoto?: string }) => void;
  onOpenEmailSettings?: () => void;
  darkMode?: boolean;
}

export function EditProfileModal({ 
  isOpen, 
  onClose, 
  userName, 
  currentUser, 
  onSave, 
  onProfileUpdated,
  onOpenEmailSettings,
  darkMode = false 
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [originalValues, setOriginalValues] = useState({ firstName: '', lastName: '', profilePhoto: '' });
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with current user data
  useEffect(() => {
    if (isOpen) {
      let initialFirstName = '';
      let initialLastName = '';
      let initialPhoto = '';
      
      if (currentUser) {
        initialFirstName = currentUser.firstName || '';
        initialLastName = currentUser.lastName || '';
        initialPhoto = currentUser.profilePhoto || '';
      } else {
        const names = userName.split(' ');
        initialFirstName = names[0] || '';
        initialLastName = names.slice(1).join(' ') || '';
      }
      
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setProfilePhoto(initialPhoto);
      setPhotoFile(null);
      setOriginalValues({ firstName: initialFirstName, lastName: initialLastName, profilePhoto: initialPhoto });
      setErrors({});
      setIsDragOver(false);
    }
  }, [currentUser, userName, isOpen]);

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

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [firstName]);

  // Check if there are actual changes
  // For profilePhoto: empty string means remove, so compare with original
  const profilePhotoChanged = profilePhoto !== originalValues.profilePhoto;
  const hasChanges = 
    firstName.trim() !== originalValues.firstName ||
    lastName.trim() !== originalValues.lastName ||
    profilePhotoChanged ||
    photoFile !== null;

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setErrors({
        ...errors,
        photo: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${(MAX_IMAGE_FILE_SIZE / 1024 / 1024).toFixed(0)}MB allowed.`
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors({
        ...errors,
        photo: 'Please select a valid image file (PNG, JPG, GIF)'
      });
      return;
    }

    setPhotoFile(file);
    setIsUploadingPhoto(true);
    setErrors({ ...errors, photo: '' });

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const uploadResult = await apiClient.uploadImage(file);
      setProfilePhoto(uploadResult.url);
      setErrors({ ...errors, photo: '' });
    } catch (error) {
      setErrors({
        ...errors,
        photo: error instanceof Error ? error.message : 'Failed to upload image'
      });
      setPhotoFile(null);
      setProfilePhoto(originalValues.profilePhoto);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    // Set profile photo to empty string to remove it
    // This will trigger a re-render and hide the photo immediately
    setProfilePhoto('');
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear any photo errors
    if (errors.photo) {
      setErrors({ ...errors, photo: '' });
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !hasChanges) return;

    setIsLoading(true);

    try {
      const userEmail = currentUser?.email || '';
      
      // Prepare profile photo update
      // Always send profilePhoto if it changed (including when removed - send empty string)
      const profilePhotoChanged = profilePhoto !== originalValues.profilePhoto;
      
      if (currentUser?.id) {
        // Build update payload - only include defined values
        const updatePayload: { firstName?: string; lastName?: string; email?: string; profilePhoto?: string } = {};
        
        // Always include firstName and lastName (they're required fields)
        updatePayload.firstName = firstName.trim();
        updatePayload.lastName = lastName.trim();
        
        // Only include profilePhoto if it changed - empty string means remove
        if (profilePhotoChanged) {
          updatePayload.profilePhoto = profilePhoto || ''; // Send empty string to remove photo
        }
        
        // Filter out any undefined values before sending
        const filteredPayload = Object.fromEntries(
          Object.entries(updatePayload).filter(([_, value]) => value !== undefined)
        );
        
        const response = await apiClient.updateProfile(currentUser.id, filteredPayload);

        centeredToast.success('Profile updated!', {
          description: 'Your changes have been saved'
        });
        
        // Get the updated profile photo - use the response value directly
        // If null or empty string, it means photo was removed
        const updatedProfilePhoto = response.user.profilePhoto || null;
        
        if (onProfileUpdated) {
          onProfileUpdated({
            firstName: response.user.firstName || firstName,
            lastName: response.user.lastName || lastName,
            email: response.user.email || userEmail,
            profilePhoto: updatedProfilePhoto, // null or empty string means photo was removed
          });
        }
        
        onSave(`${firstName} ${lastName}`.trim(), userEmail);
        setOriginalValues({ 
          firstName: firstName.trim(), 
          lastName: lastName.trim(),
          profilePhoto: updatedProfilePhoto || ''
        });
        setPhotoFile(null);
        onClose();
      } else {
        onSave(`${firstName} ${lastName}`.trim(), userEmail);
        centeredToast.success('Profile saved', {
          description: 'Your changes have been saved'
        });
        setOriginalValues({ 
          firstName: firstName.trim(), 
          lastName: lastName.trim(),
          profilePhoto: profilePhoto || ''
        });
        setPhotoFile(null);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      centeredToast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return 'No email on file';
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    const maskedLocal = localPart.length > 2 
      ? `${localPart.substring(0, 2)}${'*'.repeat(Math.min(localPart.length - 2, 4))}`
      : '**';
    return `${maskedLocal}@${domain}`;
  };

  const getInputStyles = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    const hasError = !!errors[fieldName];

    return `w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
      hasError
        ? darkMode
          ? 'bg-red-500/10 border-2 border-red-400 text-white'
          : 'bg-red-50 border-2 border-red-400 text-[#1a1a2e]'
        : isFocused
          ? darkMode
            ? 'bg-white/10 border-2 border-[#50fa7b] text-white'
            : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e]'
          : darkMode
            ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8'
            : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05]'
    } ${darkMode ? 'placeholder:text-white/30' : 'placeholder:text-[#1a1a2e]/40'}`;
  };

  const displayInitial = firstName ? firstName.charAt(0).toUpperCase() : userName.charAt(0).toUpperCase();
  const hasPhoto = !!profilePhoto;

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
                minHeight: '400px',
                margin: 'auto',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
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
                  <Pencil size={18} className={darkMode ? 'text-[#50fa7b]' : 'text-[#4ecdc4]'} />
                </div>
                <div>
                  <h2
                    id="edit-profile-title"
                    className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Edit Profile
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/60'}`}>
                    Update your name and basic profile details
                  </p>
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
                aria-label="Close"
              >
                <X size={18} className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} />
              </motion.button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div 
            className={`px-5 py-5 space-y-6 overflow-y-auto flex-1 min-h-0 ${darkMode ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent'}`}
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
            {/* Personal Information Card */}
            <div className={`rounded-2xl border p-5 space-y-5 ${
              darkMode 
                ? 'bg-white/5 border-white/10' 
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  Personal Information
                </h3>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar Preview */}
                <div className="relative">
                  <motion.div
                    className="w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center"
                    style={{
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                      background: hasPhoto 
                        ? 'transparent'
                        : (darkMode
                          ? 'linear-gradient(135deg, #50fa7b 0%, #8be9fd 100%)'
                          : 'linear-gradient(135deg, #4ecdc4 0%, #667eea 100%)'),
                    }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {hasPhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">{displayInitial}</span>
                    )}
                  </motion.div>
                  
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputFileChange}
                    disabled={isUploadingPhoto || isLoading}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  
                  <motion.label
                    htmlFor="profile-photo-upload"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDragOver
                        ? darkMode 
                          ? 'bg-[#50fa7b]/20 border-2 border-[#50fa7b]' 
                          : 'bg-[#4ecdc4]/20 border-2 border-[#4ecdc4]'
                        : isUploadingPhoto
                          ? darkMode 
                            ? 'bg-blue-500/10 border border-blue-400' 
                            : 'bg-blue-50 border border-blue-300'
                          : errors.photo
                            ? 'bg-red-500/10 border border-red-400'
                            : darkMode 
                              ? 'bg-white/10 text-white hover:bg-white/15 border border-white/20' 
                              : 'bg-black/5 text-[#1a1a2e] hover:bg-black/10 border border-black/10'
                    }`}
                    whileHover={!isUploadingPhoto ? { scale: 1.02 } : {}}
                    whileTap={!isUploadingPhoto ? { scale: 0.98 } : {}}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>{hasPhoto ? 'Change photo' : 'Upload photo'}</span>
                      </>
                    )}
                  </motion.label>

                  {hasPhoto && (
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      disabled={isUploadingPhoto || isLoading}
                      className={`w-full py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        isUploadingPhoto || isLoading
                          ? 'opacity-50 cursor-not-allowed'
                          : darkMode
                            ? 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20 cursor-pointer active:scale-95'
                            : 'text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-black/5 border border-black/10 cursor-pointer active:scale-95'
                      }`}
                      whileHover={!isUploadingPhoto && !isLoading ? { scale: 1.02 } : {}}
                      whileTap={!isUploadingPhoto && !isLoading ? { scale: 0.98 } : {}}
                      aria-label="Remove profile photo"
                    >
                      <XIcon size={16} />
                      Remove photo
                    </motion.button>
                  )}

                  {errors.photo && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5" role="alert">
                      <AlertCircle size={12} />
                      {errors.photo}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label 
                    htmlFor="firstName-input"
                    className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  >
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="firstName-input"
                    ref={firstInputRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors({ ...errors, firstName: '' });
                    }}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className={getInputStyles('firstName')}
                    placeholder="Enter your first name"
                    aria-required="true"
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-red-400 text-xs flex items-center gap-1.5" role="alert">
                      <AlertCircle size={12} />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label 
                    htmlFor="lastName-input"
                    className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className={getInputStyles('lastName')}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>

            {/* Email Information Card */}
            {currentUser?.email && (
              <div className={`rounded-2xl border p-5 space-y-3 ${
                darkMode 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Email Address
                  </h3>
                </div>
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
                          Registered email: {maskEmail(currentUser.email)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {onOpenEmailSettings && (
                  <motion.button
                    onClick={() => {
                      onClose();
                      onOpenEmailSettings();
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      darkMode
                        ? 'bg-white/10 text-white hover:bg-white/15 border border-white/20'
                        : 'bg-black/5 text-[#1a1a2e] hover:bg-black/10 border border-black/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Mail size={16} />
                    Manage in Email Settings
                    <ExternalLink size={14} />
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-5 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
            <motion.button
              onClick={() => {
                if (hasChanges && !isLoading) {
                  // Reset to original values
                  setFirstName(originalValues.firstName);
                  setLastName(originalValues.lastName);
                  setProfilePhoto(originalValues.profilePhoto);
                  setPhotoFile(null);
                  setErrors({});
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
                onClose();
              }}
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
              disabled={!hasChanges || isLoading}
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                hasChanges && !isLoading
                  ? darkMode
                    ? 'bg-[#50fa7b] text-[#0f0f1a] hover:bg-[#50fa7b]/90'
                    : 'bg-[#4ecdc4] text-white hover:bg-[#4ecdc4]/90'
                  : darkMode
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
              }`}
              style={{
                boxShadow: hasChanges && !isLoading
                  ? (darkMode
                      ? '0 4px 14px rgba(80, 250, 123, 0.3)'
                      : '0 4px 14px rgba(78, 205, 196, 0.3)')
                  : 'none',
              }}
              whileHover={hasChanges && !isLoading ? { scale: 1.02, y: -1 } : {}}
              whileTap={hasChanges && !isLoading ? { scale: 0.98 } : {}}
              aria-label="Save profile changes"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
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
