import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, AlertCircle, CheckCircle2, Info, Loader2, ChevronDown } from 'lucide-react';
import { centeredToast } from './CenteredToast';
import type { Destination } from '../types/travel';
import { motion, AnimatePresence } from 'motion/react';

const MAX_IMAGE_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (photo: {
    destinationId: number | null;
    url: string;
    caption: string;
    rating: number;
  }) => void;
  destinations: Destination[];
  darkMode?: boolean;
}

export function AddPhotoModal({ isOpen, onClose, onAdd, destinations, darkMode = false }: AddPhotoModalProps) {
  const [destinationId, setDestinationId] = useState<number | null>(destinations[0]?.id ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const destinationDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDestinationDropdownOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(e.target as Node)) {
        setIsDestinationDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDestinationDropdownOpen]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file) return;

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setErrors({
        ...errors,
        image: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 100MB allowed.`
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors({
        ...errors,
        image: 'Please select a valid image file (PNG, JPG, GIF)'
      });
      return;
    }

    setImageFile(file);
    setErrors({ ...errors, image: '' });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  const isFormValid = () => {
    return imagePreview && caption.trim();
  };

  const handleSubmit = () => {
    if (!imagePreview) {
      setErrors({ ...errors, image: 'Please select an image' });
      return;
    }
    if (!caption.trim()) {
      setErrors({ ...errors, caption: 'Please add a caption' });
      return;
    }

    onAdd({
      destinationId,
      url: imagePreview,
      caption: caption.trim(),
      rating,
    });

    centeredToast.success('Photo added!', {
      description: 'Your memory has been saved to the gallery'
    });

    // Reset form
    setImageFile(null);
    setImagePreview('');
    setCaption('');
    setRating(5);
    setDestinationId(destinations[0]?.id ?? null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  // Input styling helper
  const getInputStyles = (fieldName: string, hasIcon = false) => {
    const isFocused = focusedField === fieldName;
    const hasError = !!errors[fieldName];
    
    return `w-full ${hasIcon ? 'pl-11 pr-4' : 'px-4'} py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
      hasError
        ? darkMode 
          ? 'bg-red-500/10 border-2 border-red-400 text-white' 
          : 'bg-red-50 border-2 border-red-400 text-[#1a1a2e]'
        : isFocused
          ? darkMode 
            ? 'bg-white/10 border-2 border-[#ff79c6] text-white shadow-lg shadow-[#ff79c6]/10' 
            : 'bg-white border-2 border-[#ff6b6b] text-[#1a1a2e] shadow-lg shadow-[#ff6b6b]/10'
          : darkMode 
            ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8 hover:border-white/20' 
            : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05] hover:border-black/15'
    } ${darkMode ? 'placeholder:text-white/50' : 'placeholder:text-[#1a1a2e]/50'}`;
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
              pointerEvents: (focusedField === 'destination' || isDestinationDropdownOpen) ? 'none' : 'auto',
            }}
            onClick={(e) => {
              // Don't close if dropdown is open
              if (isDestinationDropdownOpen || focusedField === 'destination') {
                return;
              }
              // Don't close if clicking within the modal content
              const modalContent = document.querySelector('[data-modal-content]');
              const target = e.target as HTMLElement;
              if (modalContent && modalContent.contains(target)) {
                return;
              }
              onClose();
            }}
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto pointer-events-none"
            style={{ 
              zIndex: 10000,
              pointerEvents: 'none',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="w-full max-w-md my-8 pointer-events-auto"
              style={{
                position: 'relative',
                zIndex: 10001,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
          <div 
            data-modal-content
            className={`rounded-3xl overflow-hidden max-h-[90vh] flex flex-col ${
              darkMode 
                ? 'bg-[#0f172a] border border-white/30' 
                : 'bg-white border border-black/10'
            }`}
            style={{
              boxShadow: darkMode 
                ? '0 25px 50px -12px rgba(0, 0, 0, 1), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Header - Fixed */}
            <div className={`px-6 py-5 border-b flex-shrink-0 ${darkMode ? 'border-white/15' : 'border-black/10'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 
                    className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Add Photo
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/60'}`}>
                    Attach a new memory to your gallery
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  className={`p-2.5 rounded-xl transition-all ${
                    darkMode 
                      ? 'hover:bg-white/15 active:bg-white/20 text-white/80 hover:text-white' 
                      : 'hover:bg-black/10 active:bg-black/15 text-[#1a1a2e]/70 hover:text-[#1a1a2e]'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Form - Scrollable */}
            <div 
              className="px-6 py-5 space-y-6 overflow-y-auto flex-1 scrollbar-thin"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
            >
              {/* Destination */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  Destination
                  <span className={`ml-2 font-normal ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                    (optional)
                  </span>
                </label>
                <div className="relative" ref={destinationDropdownRef}>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDestinationDropdownOpen(!isDestinationDropdownOpen);
                      setFocusedField('destination');
                    }}
                    onBlur={() => {
                      setTimeout(() => setFocusedField(null), 200);
                    }}
                    className={`${getInputStyles('destination')} text-left cursor-pointer flex items-center justify-between`}
                  >
                    <span className="truncate">
                      {destinationId 
                        ? destinations.find(d => d.id === destinationId)?.name + ' – ' + destinations.find(d => d.id === destinationId)?.location
                        : 'No specific destination'}
                    </span>
                    <ChevronDown 
                      size={16} 
                      className={`flex-shrink-0 transition-transform ${isDestinationDropdownOpen ? 'rotate-180' : ''} ${
                        darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'
                      }`}
                    />
                  </motion.button>
                  
                  <AnimatePresence>
                    {isDestinationDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden ${
                          darkMode 
                            ? 'bg-[#0f172a] border border-white/30' 
                            : 'bg-white border border-black/10'
                        }`}
                        style={{
                          boxShadow: darkMode 
                            ? '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                            : '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 10002,
                          position: 'relative',
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDestinationId(null);
                            setIsDestinationDropdownOpen(false);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                            destinationId === null
                              ? darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-[#1a1a2e]'
                              : darkMode ? 'text-white/80 hover:bg-white/5' : 'text-[#1a1a2e]/80 hover:bg-black/5'
                          }`}
                        >
                          No specific destination
                        </button>
                        {destinations.map((dest) => (
                          <button
                            key={dest.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDestinationId(dest.id);
                              setIsDestinationDropdownOpen(false);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors border-t ${
                              darkMode ? 'border-white/10' : 'border-black/5'
                            } ${
                              destinationId === dest.id
                                ? darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-[#1a1a2e]'
                                : darkMode ? 'text-white/80 hover:bg-white/5' : 'text-[#1a1a2e]/80 hover:bg-black/5'
                            }`}
                          >
                            {dest.name} – {dest.location}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  <Info size={11} />
                  Link this photo to a destination for better organization
                </p>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  Caption <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => {
                    setCaption(e.target.value);
                    if (errors.caption) setErrors({ ...errors, caption: '' });
                  }}
                  onFocus={() => setFocusedField('caption')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g., Sunset at Mayon view deck"
                  className={getInputStyles('caption')}
                />
                {errors.caption ? (
                  <p className="text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {errors.caption}
                  </p>
                ) : (
                  <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                    <Info size={11} />
                    Describe this moment or memory
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  Photo <span className="text-red-400">*</span>
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                
                {!imagePreview ? (
                  <motion.label
                    htmlFor="photo-upload"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`block w-full py-10 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                      isDragOver
                        ? darkMode 
                          ? 'bg-[#ff79c6]/10 border-[#ff79c6]' 
                          : 'bg-[#ff6b6b]/10 border-[#ff6b6b]'
                        : errors.image
                          ? 'bg-red-500/10 border-red-400'
                          : darkMode 
                            ? 'bg-white/[0.03] border-white/15 hover:border-[#ff79c6]/50 hover:bg-white/5' 
                            : 'bg-black/[0.02] border-black/10 hover:border-[#ff6b6b]/50 hover:bg-black/[0.04]'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white/90' : 'text-[#1a1a2e]/90'}`}>
                          Click or drag to upload
                        </span>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                          PNG, JPG, GIF up to 100MB
                        </p>
                      </div>
                    </div>
                  </motion.label>
                ) : (
                  <motion.div 
                    className="relative rounded-xl overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {/* File info */}
                    {imageFile && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                          <span className="text-white text-xs font-medium truncate max-w-[150px] block">
                            {imageFile.name}
                          </span>
                        </div>
                        <div className="px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                          <span className="text-white text-xs font-medium">
                            {(imageFile.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <motion.button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500/80 backdrop-blur-sm rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={16} className="text-white" />
                    </motion.button>
                    
                    {/* Success indicator */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-green-500/80 backdrop-blur-sm rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-white" />
                      <span className="text-white text-xs font-medium">Ready</span>
                    </div>
                  </motion.div>
                )}
                
                {errors.image && (
                  <p className="text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {errors.image}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  Rating
                </label>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 p-2 rounded-xl transition-colors ${
                    darkMode ? 'bg-white/8 border border-white/10' : 'bg-black/[0.03] border border-black/5'
                  }`}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (hoverRating || rating);
                      const isHovered = star <= hoverRating && hoverRating !== rating;
                      return (
                        <motion.button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-colors"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Star
                            size={26}
                            className={`transition-all duration-200 ${
                              isActive
                                ? isHovered
                                  ? 'text-amber-300 fill-amber-300'
                                  : 'text-amber-400 fill-amber-400'
                                : darkMode ? 'text-white/15' : 'text-black/15'
                            }`}
                            style={{
                              filter: isActive ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))' : 'none'
                            }}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                  <AnimatePresence mode="wait">
                    {(rating > 0 || hoverRating > 0) && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`text-base font-bold tabular-nums ${
                          hoverRating > 0 
                            ? 'text-amber-300' 
                            : (darkMode ? 'text-amber-400' : 'text-amber-500')
                        }`}
                      >
                        {hoverRating || rating}.0
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  <Info size={11} />
                  Rate this memory based on how special it was
                </p>
              </div>

              {/* Helper note */}
              <div className={`flex items-start gap-2 p-3 rounded-xl ${
                darkMode ? 'bg-white/8 border border-white/10' : 'bg-black/[0.03] border border-black/5'
              }`}>
                <Info size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`} />
                <p className={`text-xs ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                  You can edit or delete this photo later from the Gallery
                </p>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0 ${darkMode ? 'border-white/15' : 'border-black/10'}`}>
              <motion.button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  darkMode 
                    ? 'text-white/80 hover:text-white hover:bg-white/15' 
                    : 'text-[#1a1a2e]/80 hover:text-[#1a1a2e] hover:bg-black/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  isFormValid()
                    ? darkMode 
                      ? 'bg-[#ff79c6] text-[#0f0f1a] hover:bg-[#ff79c6]/90' 
                      : 'bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/90'
                    : darkMode 
                      ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                      : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: isFormValid() 
                    ? (darkMode 
                        ? '0 4px 14px rgba(255, 121, 198, 0.3)' 
                        : '0 4px 14px rgba(255, 107, 107, 0.3)')
                    : 'none'
                }}
                whileHover={isFormValid() ? { scale: 1.02, y: -1 } : {}}
                whileTap={isFormValid() ? { scale: 0.98 } : {}}
              >
                <CheckCircle2 size={16} />
                Add Photo
              </motion.button>
            </div>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal via portal to document.body to ensure it's always on top
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

