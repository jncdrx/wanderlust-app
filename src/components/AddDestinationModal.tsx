import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, AlertCircle, Loader2, Building2, Palmtree, UtensilsCrossed, Trees, CheckCircle2, Info } from 'lucide-react';
import { Destination } from '../types/travel';
import { apiClient } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import { centeredToast } from './CenteredToast';

// Field length limits matching backend validation
const MAX_DESTINATION_NAME_LENGTH = 255;
const MAX_DESTINATION_LOCATION_LENGTH = 255;
const MAX_DESTINATION_IMAGE_URL_LENGTH = 2000;
const MAX_DESTINATION_DESCRIPTION_LENGTH = 10000;
const MAX_IMAGE_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (destination: {
    name: string;
    location: string;
    category: string;
    description: string;
    imageUrl: string;
    rating: number;
  }) => void;
  editingDestination?: Destination | null;
  darkMode?: boolean;
}

export function AddDestinationModal({ isOpen, onClose, onAdd, editingDestination, darkMode = false }: AddDestinationModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Nature');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'Museum', icon: Building2, color: darkMode ? '#bd93f9' : '#667eea' },
    { value: 'Resort', icon: Palmtree, color: darkMode ? '#8be9fd' : '#4ecdc4' },
    { value: 'Restaurant', icon: UtensilsCrossed, color: darkMode ? '#ffb86c' : '#f59e0b' },
    { value: 'Nature', icon: Trees, color: darkMode ? '#50fa7b' : '#22c55e' },
  ];

  // Populate form when editing
  useEffect(() => {
    if (editingDestination) {
      setName(editingDestination.name);
      setLocation(editingDestination.location);
      setCategory(editingDestination.category);
      setDescription(editingDestination.description);
      setImagePreview(editingDestination.image);
      setRating(editingDestination.rating);
    } else {
      setName('');
      setLocation('');
      setCategory('Nature');
      setDescription('');
      setImageFile(null);
      setImagePreview('');
      setImageUrl('');
      setIsUploading(false);
      setRating(0);
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editingDestination, isOpen]);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setErrors({
        ...errors,
        image: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${(MAX_IMAGE_FILE_SIZE / 1024 / 1024).toFixed(0)}MB allowed.`
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
    setIsUploading(true);
    setErrors({ ...errors, image: '' });

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const uploadResult = await apiClient.uploadImage(file);
      setImageUrl(uploadResult.url);
      setErrors({ ...errors, image: '' });
    } catch (error) {
      setErrors({
        ...errors,
        image: error instanceof Error ? error.message : 'Failed to upload image'
      });
      setImageFile(null);
      setImagePreview('');
      setImageUrl('');
    } finally {
      setIsUploading(false);
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

  const isFormValid = () => {
    return name.trim() && location.trim() && description.trim() && !isUploading;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Destination name is required';
    } else if (name.length > MAX_DESTINATION_NAME_LENGTH) {
      newErrors.name = `Name too long (${name.length}/${MAX_DESTINATION_NAME_LENGTH})`;
    }
    
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    } else if (location.length > MAX_DESTINATION_LOCATION_LENGTH) {
      newErrors.location = `Location too long (${location.length}/${MAX_DESTINATION_LOCATION_LENGTH})`;
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length > MAX_DESTINATION_DESCRIPTION_LENGTH) {
      newErrors.description = `Description too long`;
    }
    
    const finalImageUrl = imageUrl || imagePreview || 'https://images.unsplash.com/photo-1663017225895-61cfe42309ed?w=800';
    if (finalImageUrl.length > MAX_DESTINATION_IMAGE_URL_LENGTH) {
      newErrors.image = 'Image URL too long';
    }
    
    if (isUploading) {
      newErrors.image = 'Please wait for upload to complete';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const isEditing = !!editingDestination;
    
    onAdd({
      name: name.trim(),
      location: location.trim(),
      category: category.trim(),
      description: description.trim(),
      imageUrl: imageUrl || imagePreview || 'https://images.unsplash.com/photo-1663017225895-61cfe42309ed?w=800',
      rating,
    });

    // Show success toast
    centeredToast.success(
      isEditing ? 'Destination updated!' : 'Destination added!',
      { description: isEditing ? `${name} has been updated` : `${name} added to your Places` }
    );

    // Reset form
    setName('');
    setLocation('');
    setCategory('Nature');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setIsUploading(false);
    setRating(0);
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
            ? 'bg-white/10 border-2 border-[#50fa7b] text-white shadow-lg shadow-[#50fa7b]/10' 
            : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e] shadow-lg shadow-[#4ecdc4]/10'
          : darkMode 
            ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8 hover:border-white/20' 
            : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05] hover:border-black/15'
    } ${darkMode ? 'placeholder:text-white/30' : 'placeholder:text-[#1a1a2e]/40'}`;
  };

  if (!isOpen) return null;

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
            onClick={onClose}
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
                    {editingDestination ? 'Edit Destination' : 'Add Destination'}
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/60'}`}>
                    Save a new place to your Wanderlust map
                  </p>
                </div>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
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
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="px-6 py-5 space-y-6 overflow-y-auto flex-1 scrollbar-thin"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
            >
              {/* === BASIC INFO === */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-white/60' : 'text-[#1a1a2e]/50'
                }`}>
                  Basic Info
                </h3>

                {/* Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Destination Name <span className="text-red-400">*</span>
                    </label>
                    {name.length > 200 && (
                      <span className={`text-xs tabular-nums ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
                        {name.length}/{MAX_DESTINATION_NAME_LENGTH}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g., Mayon Volcano"
                    className={getInputStyles('name')}
                    maxLength={MAX_DESTINATION_NAME_LENGTH}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Location <span className="text-red-400">*</span>
                    </label>
                    {location.length > 200 && (
                      <span className={`text-xs tabular-nums ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
                        {location.length}/{MAX_DESTINATION_LOCATION_LENGTH}
                      </span>
                    )}
                  </div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (errors.location) setErrors({ ...errors, location: '' });
                      }}
                      onFocus={() => setFocusedField('location')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g., Albay, Philippines"
                    className={getInputStyles('location')}
                      maxLength={MAX_DESTINATION_LOCATION_LENGTH}
                    />
                  {errors.location && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {errors.location}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Category
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.value;
                      return (
                        <motion.button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-2'
                              : darkMode 
                                ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
                                : 'bg-black/[0.03] border border-black/10 hover:bg-black/[0.06]'
                          }`}
                          style={{
                            borderColor: isSelected ? cat.color : undefined,
                            backgroundColor: isSelected 
                              ? (darkMode ? `${cat.color}15` : `${cat.color}10`)
                              : undefined,
                            color: isSelected ? cat.color : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.6)')
                          }}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <motion.div
                            animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Icon size={20} />
                          </motion.div>
                          {cat.value}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                    <Info size={11} />
                    Choose type so Wanderlust can group it correctly
                  </p>
                </div>
              </div>

              {/* === DETAILS === */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-white/60' : 'text-[#1a1a2e]/50'
                }`}>
                  Details
                </h3>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Description <span className="text-red-400">*</span>
                    </label>
                    {description.length > 500 && (
                      <span className={`text-xs tabular-nums ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
                        {description.length.toLocaleString()}/{MAX_DESTINATION_DESCRIPTION_LENGTH.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({ ...errors, description: '' });
                    }}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="What makes this place worth visiting? Share tips, highlights, or memories..."
                    rows={4}
                    className={`${getInputStyles('description')} resize-none`}
                    maxLength={MAX_DESTINATION_DESCRIPTION_LENGTH}
                  />
                  {errors.description ? (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {errors.description}
                    </p>
                  ) : (
                    <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                      <Info size={11} />
                      Add notes about what makes this place special
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Your Rating
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 p-2 rounded-xl transition-colors ${
                      darkMode ? 'bg-white/8 border border-white/10' : 'bg-black/[0.03] border border-black/5'
                    }`}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isActive = star <= (hoverRating || rating);
                        const isHovered = star <= hoverRating && hoverRating > rating;
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
                                  : darkMode ? 'text-white/20' : 'text-black/20'
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
                    Rate based on your experience or expectations
                  </p>
                </div>
              </div>

              {/* === MEDIA === */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-white/60' : 'text-[#1a1a2e]/50'
                }`}>
                  Media
                </h3>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Cover Image
                    <span className={`ml-2 font-normal ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
                      (optional)
                    </span>
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputFileChange}
                    disabled={isUploading}
                    className="hidden"
                    id="destination-image-upload"
                  />
                  
                  {!imagePreview ? (
                    <motion.label
                      htmlFor="destination-image-upload"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`block w-full py-10 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                        isDragOver
                          ? darkMode 
                            ? 'bg-[#50fa7b]/10 border-[#50fa7b]' 
                            : 'bg-[#4ecdc4]/10 border-[#4ecdc4]'
                          : isUploading
                            ? darkMode 
                              ? 'bg-blue-500/10 border-blue-400' 
                              : 'bg-blue-50 border-blue-300'
                            : errors.image
                              ? 'bg-red-500/10 border-red-400'
                              : darkMode 
                                ? 'bg-white/[0.03] border-white/15 hover:border-[#50fa7b]/50 hover:bg-white/5' 
                                : 'bg-black/[0.02] border-black/10 hover:border-[#4ecdc4]/50 hover:bg-black/[0.04]'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={32} className="text-blue-400 animate-spin" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            Uploading image...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                              Click or drag to upload
                            </span>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
                              PNG, JPG, GIF up to 100MB
                            </p>
                          </div>
                        </div>
                      )}
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
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <motion.button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setImageUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={16} className="text-white" />
                      </motion.button>
                      {imageFile && (
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                          <span className="text-white text-xs font-medium">
                            {(imageFile.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-green-500/80 backdrop-blur-sm rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-white" />
                        <span className="text-white text-xs font-medium">Uploaded</span>
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
              </div>

              {/* Helper note */}
              <div className={`flex items-start gap-2 p-3 rounded-xl ${
                darkMode ? 'bg-white/5' : 'bg-black/[0.02]'
              }`}>
                <Info size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`} />
                <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
                  You can edit this destination later from the Places page
                </p>
              </div>
            </form>

            {/* Footer - Fixed */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0 ${darkMode ? 'border-white/15' : 'border-black/10'}`}>
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
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
                type="submit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit(e);
                }}
                disabled={!isFormValid()}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  isFormValid()
                    ? darkMode 
                      ? 'bg-[#50fa7b] text-[#0f0f1a] hover:bg-[#50fa7b]/90 cursor-pointer' 
                      : 'bg-[#4ecdc4] text-white hover:bg-[#4ecdc4]/90 cursor-pointer'
                    : darkMode 
                      ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                      : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: isFormValid() 
                    ? (darkMode 
                        ? '0 4px 14px rgba(80, 250, 123, 0.3)' 
                        : '0 4px 14px rgba(78, 205, 196, 0.3)')
                    : 'none'
                }}
                whileHover={isFormValid() ? { scale: 1.02, y: -1 } : {}}
                whileTap={isFormValid() ? { scale: 0.98 } : {}}
              >
                <CheckCircle2 size={16} />
                {editingDestination ? 'Update' : 'Add Destination'}
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
