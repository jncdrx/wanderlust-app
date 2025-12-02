import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Loader2, CheckCircle2, Info, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { centeredToast } from './CenteredToast';

interface AddItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (itinerary: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    companions: number;
    notes: string;
    imageUrl: string;
  }) => void;
  darkMode?: boolean;
}

const MAX_IMAGE_LENGTH = 150000000; // ~100MB of base64 data

export function AddItineraryModal({ isOpen, onClose, onAdd, darkMode = false }: AddItineraryModalProps) {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [companions, setCompanions] = useState(1);
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after close animation
      const timer = setTimeout(() => {
        setTitle('');
        setDestination('');
        setStartDate('');
        setEndDate('');
        setBudget('');
        setCompanions(1);
        setNotes('');
        setImageFile(null);
        setImagePreview('');
        setErrors({});
        setFocusedField(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleFileChange = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, image: 'Please select a valid image file' });
      return;
    }

    setImageFile(file);
    setIsUploading(true);
    setErrors({ ...errors, image: '' });

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setIsUploading(false);
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
    return title.trim() && destination.trim() && startDate && endDate && !isUploading && !errors.endDate;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Trip title is required';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    } else if (startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (imagePreview && imagePreview.length > MAX_IMAGE_LENGTH) {
      newErrors.image = 'Image too large. Please choose a smaller image.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Live validation for end date
  useEffect(() => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
    } else if (errors.endDate) {
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  }, [startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const finalImage =
      (imagePreview && imagePreview.trim()) ||
      'https://images.unsplash.com/photo-1663017225895-61cfe42309ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBqb3VybmV5JTIwYWR2ZW50dXJlfGVufDF8fHx8MTc2MDU5ODIwMXww&ixlib=rb-4.1.0&q=80&w=1080';

    onAdd({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budget: budget.trim() || '₱0',
      companions,
      notes: notes.trim(),
      imageUrl: finalImage,
    });

    // Show success toast
    centeredToast.success('Itinerary created!', {
      description: `${title} has been added to your trips`
    });

    onClose();
  };

  // Input styling helper - matching AddDestinationModal
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
            ? 'bg-white/10 border-2 border-[#8be9fd] text-white shadow-lg shadow-[#8be9fd]/10'
            : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e] shadow-lg shadow-[#4ecdc4]/10'
          : darkMode
            ? 'bg-white/5 border border-white/10 text-white hover:bg-white/8 hover:border-white/20'
            : 'bg-black/[0.03] border border-black/10 text-[#1a1a2e] hover:bg-black/[0.05] hover:border-black/15'
    } ${darkMode ? 'placeholder:text-white/30' : 'placeholder:text-[#1a1a2e]/40'}`;
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto"
        style={{
          background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className="w-full max-w-md my-8"
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
            {/* Header */}
            <div className={`px-6 py-5 border-b flex-shrink-0 ${darkMode ? 'border-white/15' : 'border-black/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{
                      background: darkMode
                        ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.25) 0%, rgba(189, 147, 249, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(102, 126, 234, 0.15) 100%)',
                    }}
                  >
                    <Plane size={22} className={darkMode ? 'text-[#8be9fd]' : 'text-[#4ecdc4]'} />
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Create Itinerary
                    </h2>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/60'}`}>
                      Plan your next adventure
                    </p>
                  </div>
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
            <form
              onSubmit={handleSubmit}
              className="px-6 py-5 space-y-6 overflow-y-auto flex-1 scrollbar-thin"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
            >
              {/* === TRIP INFO === */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-white/60' : 'text-[#1a1a2e]/50'
                }`}>
                  Trip Info
                </h3>

                {/* Title */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Trip Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors({ ...errors, title: '' });
                    }}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g., European Adventure 2025"
                    className={getInputStyles('title')}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Main Destination <span className="text-red-400">*</span>
                  </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        if (errors.destination) setErrors({ ...errors, destination: '' });
                      }}
                      onFocus={() => setFocusedField('destination')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g., Palawan, Philippines"
                    className={getInputStyles('destination')}
                    />
                  {errors.destination && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {errors.destination}
                    </p>
                  )}
                </div>
              </div>

              {/* === DATES === */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-white/60' : 'text-[#1a1a2e]/50'
                }`}>
                  Dates
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Start Date <span className="text-red-400">*</span>
                    </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (errors.startDate) setErrors({ ...errors, startDate: '' });
                        }}
                        onFocus={() => setFocusedField('startDate')}
                        onBlur={() => setFocusedField(null)}
                      className={`${getInputStyles('startDate')} text-xs`}
                      />
                    {errors.startDate && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      End Date <span className="text-red-400">*</span>
                    </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onFocus={() => setFocusedField('endDate')}
                        onBlur={() => setFocusedField(null)}
                        min={startDate}
                      className={`${getInputStyles('endDate')} text-xs`}
                      />
                    {errors.endDate && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date validation hint */}
                {startDate && endDate && !errors.endDate && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                  >
                    <CheckCircle2 size={12} />
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days trip
                  </motion.p>
                )}
              </div>

              {/* === DETAILS === */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-white/60' : 'text-[#1a1a2e]/50'
                }`}>
                  Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Budget */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Budget
                    </label>
                      <input
                        type="text"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        onFocus={() => setFocusedField('budget')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="₱100,000"
                      className={getInputStyles('budget')}
                      />
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                      Estimated total cost
                    </p>
                  </div>

                  {/* Companions */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                      Travelers
                    </label>
                      <input
                        type="number"
                        value={companions}
                        onChange={(e) => setCompanions(parseInt(e.target.value) || 1)}
                        onFocus={() => setFocusedField('companions')}
                        onBlur={() => setFocusedField(null)}
                        min="1"
                        max="50"
                      className={getInputStyles('companions')}
                      />
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                      Including yourself
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Trip Notes
                  </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onFocus={() => setFocusedField('notes')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Add special plans, reminders, or things to pack..."
                      rows={3}
                    className={`${getInputStyles('notes')} resize-none`}
                    />
                  <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                    <Info size={11} />
                    Optional notes for your trip
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
                    id="itinerary-image-upload"
                  />

                  {!imagePreview ? (
                    <motion.label
                      htmlFor="itinerary-image-upload"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`block w-full py-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                        isDragOver
                          ? darkMode
                            ? 'bg-[#8be9fd]/10 border-[#8be9fd]'
                            : 'bg-[#4ecdc4]/10 border-[#4ecdc4]'
                          : isUploading
                            ? darkMode
                              ? 'bg-blue-500/10 border-blue-400'
                              : 'bg-blue-50 border-blue-300'
                            : errors.image
                              ? 'bg-red-500/10 border-red-400'
                              : darkMode
                                ? 'bg-white/[0.03] border-white/15 hover:border-[#8be9fd]/50 hover:bg-white/5'
                                : 'bg-black/[0.02] border-black/10 hover:border-[#4ecdc4]/50 hover:bg-black/[0.04]'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={28} className="text-blue-400 animate-spin" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            Processing...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                              Click or drag to upload
                            </span>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
                              PNG, JPG, GIF up to 5MB
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
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <motion.button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={14} className="text-white" />
                      </motion.button>
                      {imageFile && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                          <span className="text-white text-xs font-medium">
                            {(imageFile.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-white" />
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
              </div>

              {/* Helper note */}
              <div className={`flex items-start gap-2 p-3 rounded-xl ${
                darkMode ? 'bg-white/8 border border-white/10' : 'bg-black/[0.03] border border-black/5'
              }`}>
                <Info size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`} />
                <p className={`text-xs ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                  You can add activities and edit details later from the trip page
                </p>
              </div>
            </form>

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
                type="submit"
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  isFormValid()
                    ? darkMode
                      ? 'bg-gradient-to-r from-[#8be9fd] to-[#bd93f9] text-[#0f0f1a] hover:opacity-90'
                      : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white hover:opacity-90'
                    : darkMode
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-black/10 text-[#1a1a2e]/30 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: isFormValid()
                    ? (darkMode
                        ? '0 4px 14px rgba(139, 233, 253, 0.3)'
                        : '0 4px 14px rgba(78, 205, 196, 0.3)')
                    : 'none'
                }}
                whileHover={isFormValid() ? { scale: 1.02, y: -1 } : {}}
                whileTap={isFormValid() ? { scale: 0.98 } : {}}
              >
                <Plane size={16} />
                Create Trip
              </motion.button>
            </div>
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
