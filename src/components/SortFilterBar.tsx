import { useState } from 'react';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { motion } from 'motion/react';

export interface SortOption {
  label: string;
  value: string;
  direction?: 'asc' | 'desc';
}

interface SortFilterBarProps {
  // New interface (used by DestinationScreen, GalleryScreen)
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (value: string) => void;
  onDirectionChange?: () => void;
  options?: SortOption[];
  
  // Old interface (used by ItineraryScreen)
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: ((value: string, direction: 'asc' | 'desc') => void) | ((value: string) => void);
  
  // Common props
  showCount?: boolean;
  totalCount?: number;
  darkMode?: boolean;
}

export function SortFilterBar({
  // New props
  sortBy,
  sortDirection: externalSortDirection,
  onDirectionChange,
  options,
  
  // Old props
  sortOptions,
  currentSort,
  onSortChange,
  
  // Common props
  showCount = false,
  totalCount = 0,
  darkMode = false,
}: SortFilterBarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  // Determine which interface is being used
  const isNewInterface = sortBy !== undefined || options !== undefined;
  
  // Get the actual values
  const actualOptions = options || sortOptions || [];
  const actualCurrentSort = isNewInterface ? sortBy : currentSort;
  const actualSortDirection = isNewInterface ? externalSortDirection : internalSortDirection;

  const handleSortSelect = (value: string) => {
    if (isNewInterface) {
      // New interface - just call the change handlers
      if (onSortChange) {
        (onSortChange as (value: string) => void)(value);
      }
    } else {
      // Old interface - handle direction internally
      const newDirection = value === actualCurrentSort ? (actualSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
      setInternalSortDirection(newDirection);
      if (onSortChange) {
        (onSortChange as (value: string, direction: 'asc' | 'desc') => void)(value, newDirection);
      }
    }
    setShowSortMenu(false);
  };

  const currentSortLabel = actualOptions.find(opt => opt.value === actualCurrentSort)?.label || 'Sort';

  return (
    <div className="relative mb-4">
      <div className="flex items-center justify-between gap-3">
        {showCount && (
          <p className="text-white/70 text-sm">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </p>
        )}
        <div className="ml-auto flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`backdrop-blur-xl rounded-2xl px-4 py-2.5 text-white text-sm flex items-center gap-2 border transition-all ${
              darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/20 border-white/30'
            } hover:bg-white/30`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal size={16} />
            <span>{currentSortLabel}</span>
            {!isNewInterface && (
              <ArrowUpDown 
                size={14} 
                className={`transition-transform ${actualSortDirection === 'desc' ? 'rotate-180' : ''}`} 
              />
            )}
          </motion.button>

          {isNewInterface && onDirectionChange && (
            <motion.button
              type="button"
              onClick={() => onDirectionChange()}
              className={`backdrop-blur-xl rounded-2xl p-2 text-white border transition-all ${
                darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/20 border-white/30'
              } hover:bg-white/30`}
              aria-label="Toggle sort direction"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowUpDown 
                size={16} 
                className={`transition-transform ${actualSortDirection === 'desc' ? 'rotate-180' : ''}`} 
              />
            </motion.button>
          )}
        </div>
      </div>

      {showSortMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSortMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute right-0 top-full mt-2 z-50 overflow-hidden min-w-[200px] backdrop-blur-xl rounded-2xl border ${
              darkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/30 border-white/50'
            }`}
          >
            {actualOptions.map((option, index) => (
              <motion.button
                key={option.value}
                onClick={() => handleSortSelect(option.value)}
                className={`w-full p-3 text-left hover:bg-white/10 transition-all ${
                  actualCurrentSort === option.value ? 'bg-white/10' : ''
                } ${index > 0 ? 'border-t border-white/10' : ''}`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">{option.label}</span>
                  {actualCurrentSort === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <ArrowUpDown 
                        size={14} 
                        className={`text-teal-400 transition-transform ${
                          actualSortDirection === 'desc' ? 'rotate-180' : ''
                        }`} 
                      />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
