import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, MapPin, FileText, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: {
    day: number;
    time: string;
    activity: string;
    location: string;
    budget?: number;
  }) => Promise<void>;
  remainingBudget?: number;
  darkMode?: boolean;
}

export function AddActivityModal({ isOpen, onClose, onAdd, remainingBudget, darkMode = false }: AddActivityModalProps) {
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setDay(1);
    setTime('');
    setActivity('');
    setLocation('');
    setBudget('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!time || !activity || !location) {
      setError('Please complete all required fields.');
      return;
    }

    // Validate budget if provided
    let budgetValue: number | undefined = undefined;
    if (budget.trim()) {
      budgetValue = parseFloat(budget);
      if (isNaN(budgetValue) || budgetValue < 0) {
        setError('Budget must be a valid positive number.');
        return;
      }
      
      // Check if budget exceeds remaining budget
      if (remainingBudget !== undefined && budgetValue > remainingBudget) {
        setError(`Activity budget (₱${budgetValue.toLocaleString()}) exceeds remaining trip budget (₱${remainingBudget.toLocaleString()}).`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Ensure time is in HH:MM format (remove seconds if present)
      const timeFormatted = time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
      
      await onAdd({
        day,
        time: timeFormatted,
        activity,
        location,
        budget: budgetValue,
      });
      resetForm();
      onClose();
    } catch (err) {
      console.error('❌ Error adding activity:', err);
      let errorMessage = 'Failed to save activity.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Extract more detailed error message if available
        const errorWithDetails = err as Error & { field?: string; remainingBudget?: number };
        if (errorWithDetails.field) {
          errorMessage = `${errorMessage} (Field: ${errorWithDetails.field})`;
        }
        if (errorWithDetails.remainingBudget !== undefined) {
          errorMessage = `${errorMessage}. Remaining budget: ₱${errorWithDetails.remainingBudget.toLocaleString()}`;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              background: darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
            style={{ 
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={`pointer-events-auto rounded-2xl border overflow-hidden ${
                darkMode 
                  ? 'bg-[#1e293b] border-white/15' 
                  : 'bg-white border-black/10'
              }`}
              style={{
                width: '90%',
                maxWidth: '450px',
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                zIndex: 10001,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`px-6 sm:px-8 py-6 border-b ${
                darkMode ? 'border-white/10' : 'border-black/10'
              } flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <Clock size={24} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Add Activity
                  </h2>
                </div>
                
                {/* Close Button - 40×40px */}
                <button
                  onClick={onClose}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out ${
                    darkMode 
                      ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                      : 'text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e]'
                  }`}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-6">
                {/* Day Number */}
                <div className="space-y-2">
                  <label className={`text-xs sm:text-sm font-medium flex items-center gap-2 ${
                    darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'
                  }`}>
                    <Calendar size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                    Day
                  </label>
                  <input
                    type="number"
                    value={day}
                    onChange={(e) => setDay(parseInt(e.target.value) || 1)}
                    min="1"
                    max="30"
                    className={`w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-in-out ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-2 focus:ring-blue-500/30' 
                        : 'bg-white border-black/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20'
                    } border focus:outline-none`}
                    required
                  />
                </div>

                {/* Time - Blue */}
                <div className={`space-y-2 pt-2 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                  <label className={`text-xs sm:text-sm font-medium flex items-center gap-2 ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <Clock size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                    Time *
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-in-out ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-2 focus:ring-blue-500/30' 
                        : 'bg-white border-black/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20'
                    } border focus:outline-none`}
                    required
                  />
                </div>

                {/* Activity - Green */}
                <div className={`space-y-2 pt-2 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                  <label className={`text-xs sm:text-sm font-medium flex items-center gap-2 ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    <FileText size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                    Activity *
                  </label>
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="e.g., Beach Exploration"
                    className={`w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-in-out ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-2 focus:ring-green-500/30' 
                        : 'bg-white border-black/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/50 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20'
                    } border focus:outline-none`}
                    required
                  />
                </div>

                {/* Location - Purple */}
                <div className={`space-y-2 pt-2 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                  <label className={`text-xs sm:text-sm font-medium flex items-center gap-2 ${
                    darkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    <MapPin size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                    Location *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., South Beach"
                    className={`w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-in-out ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-2 focus:ring-purple-500/30' 
                        : 'bg-white border-black/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                    } border focus:outline-none`}
                    required
                  />
                </div>

                {/* Budget - Yellow */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs sm:text-sm font-medium flex items-center gap-2 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      <DollarSign size={16} className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                      Budget (Optional)
                    </label>
                    {remainingBudget !== undefined && (
                      <span className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                        Remaining: ₱{remainingBudget.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g., 5000"
                    min="0"
                    step="0.01"
                    className={`w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-in-out ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-2 focus:ring-yellow-500/30' 
                        : 'bg-white border-black/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/50 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20'
                    } border focus:outline-none`}
                  />
                  {budget && remainingBudget !== undefined && parseFloat(budget) > remainingBudget && (
                    <p className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Budget exceeds remaining trip budget
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className={`rounded-xl p-3 border ${
                    darkMode 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-red-50 border-red-200'
                  }`} role="alert">
                    <p className={`text-sm text-center ${
                      darkMode ? 'text-red-300' : 'text-red-600'
                    }`}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className={`flex gap-3 pt-4 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ease-in-out border ${
                      darkMode 
                        ? 'bg-transparent border-white/20 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30' 
                        : 'bg-transparent border-[#1a1a2e]/20 text-[#1a1a2e]/80 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e] hover:border-[#1a1a2e]/30'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 ease-in-out ${
                      isSubmitting
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:scale-[1.02] hover:shadow-lg'
                    }`}
                    style={{
                      background: '#00d4ff',
                      boxShadow: isSubmitting 
                        ? 'none' 
                        : '0 4px 12px rgba(0, 212, 255, 0.4)',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Add Activity'}
                  </button>
                </div>
              </form>
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
