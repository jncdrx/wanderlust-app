import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Plus, Clock, DollarSign, Users, Trash2, Search, Edit2, TrendingUp, Plane, ArrowLeft, ChevronLeft, ChevronRight, MoreVertical, CheckCircle2, Pencil, X, Share2, UtensilsCrossed, Hotel, Car, Film, Camera, Map } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AddItineraryModal } from './AddItineraryModal';
import { AddActivityModal } from './AddActivityModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Trip, TripItineraryItem } from '../types/travel';
import { motion, AnimatePresence } from 'motion/react';
import { centeredToast } from './CenteredToast';

interface ItineraryScreenProps {
  currentUser?: any;
  trips: Trip[];
  onAddTrip: (trip: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    companions: number;
    notes: string;
    imageUrl: string;
  }) => void;
  onAddActivity: (tripId: Trip['id'], activity: TripItineraryItem) => Promise<Trip>;
  onDeleteTrip: (tripId: number) => void;
  onUpdateTrip?: (tripId: number, trip: Trip) => Promise<void>;
  darkMode?: boolean;
}

export function ItineraryScreen({
  currentUser,
  trips,
  onAddTrip,
  onAddActivity,
  onDeleteTrip,
  onUpdateTrip,
  darkMode = false,
}: ItineraryScreenProps) {
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState<Trip['id'] | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<{ id: number; title: string } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Upcoming' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [menuPosition, setMenuPosition] = useState<{ 
    top?: boolean; 
    left?: boolean;
    x?: number;
    y?: number;
  }>({});
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<TripItineraryItem | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const headerRef = useRef<HTMLDivElement>(null);

  const handleAddActivity = async (activity: TripItineraryItem) => {
    if (!selectedTrip) {
      throw new Error('Select a trip before adding activities.');
    }
    await onAddActivity(selectedTrip, activity);
  };

  // Filter and sort trips
  const filteredTrips = trips
    .filter((trip) => {
      const matchesFilter = 
        selectedFilter === 'All' ||
        (selectedFilter === 'Upcoming' && trip.status === 'upcoming') ||
        (selectedFilter === 'Completed' && trip.status === 'completed');
      
      const matchesSearch = 
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const selectedTripData = trips.find((trip) => trip.id === selectedTrip);

  // Calculate trip statistics
  const totalTrips = trips.length;
  const upcomingTrips = trips.filter(t => t.status === 'upcoming').length;
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const totalBudget = trips.reduce((sum, trip) => {
    const budgetNum = parseFloat(trip.budget.replace(/[₱$,]/g, ''));
    return sum + (isNaN(budgetNum) ? 0 : budgetNum);
  }, 0);
  const avgBudget = trips.length > 0 ? Math.round(totalBudget / trips.length) : 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuElement = menuRefs.current[openMenuId];
        const buttonElement = buttonRefs.current[openMenuId];
        if (
          menuElement &&
          !menuElement.contains(event.target as Node) &&
          buttonElement &&
          !buttonElement.contains(event.target as Node)
        ) {
          setOpenMenuId(null);
          setFocusedIndex(-1);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenuId !== null) {
        setOpenMenuId(null);
        setFocusedIndex(-1);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuId]);

  // Handle keyboard navigation in dropdown
  const handleMenuKeyDown = (event: React.KeyboardEvent, tripId: number) => {
    if (openMenuId !== tripId) return;

    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    // Determine available menu items based on trip status
    const menuItems = trip.status === 'upcoming' 
      ? ['mark-completed', 'edit', 'delete']
      : ['edit', 'delete'];
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
          handleMenuAction(menuItems[focusedIndex], tripId);
        }
        break;
    }
  };

  // Calculate menu position when it opens (using fixed positioning)
  useEffect(() => {
    if (openMenuId !== null) {
      const button = buttonRefs.current[openMenuId];
      const menu = menuRefs.current[openMenuId];
      const trip = trips.find(t => t.id === openMenuId);
      
      if (button && trip) {
        const calculatePosition = () => {
          const buttonRect = button.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const padding = 12; // Minimum padding from edges
          
          // Default menu dimensions (w-48 = 192px, estimated height based on items)
          const menuWidth = 192;
          const menuItemHeight = 40; // Approximate height per item
          const menuItemCount = trip.status === 'upcoming' ? 3 : 2;
          const menuHeight = menuItemCount * menuItemHeight + 16; // Add padding
          const menuGap = 8; // mt-2 = 8px
          
          // Calculate horizontal position
          const spaceRight = viewportWidth - buttonRect.right;
          const spaceLeft = buttonRect.left;
          // Open left if there's not enough space on right AND there's enough space on left
          const openLeft = spaceRight < menuWidth + padding && spaceLeft >= menuWidth + padding;
          
          // Calculate X position (fixed positioning)
          let x = openLeft 
            ? buttonRect.right - menuWidth  // Align right edge of menu with right edge of button
            : buttonRect.left;                // Align left edge of menu with left edge of button
          
          // Ensure menu doesn't overflow viewport
          x = Math.max(padding, Math.min(x, viewportWidth - menuWidth - padding));
          
          // Calculate vertical position
          const spaceBelow = viewportHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;
          // Open upward if there's not enough space below AND there's enough space above
          const openUp = spaceBelow < menuHeight + menuGap + padding && spaceAbove >= menuHeight + menuGap + padding;
          
          // Calculate Y position (fixed positioning)
          let y = openUp
            ? buttonRect.top - menuHeight - menuGap  // Position above button
            : buttonRect.bottom + menuGap;            // Position below button
          
          // Ensure menu doesn't overflow viewport
          y = Math.max(padding, Math.min(y, viewportHeight - menuHeight - padding));
          
          setMenuPosition({
            left: openLeft,
            top: openUp,
            x,
            y,
          });
        };
        
        // Use requestAnimationFrame for better timing
        const rafId = requestAnimationFrame(() => {
          calculatePosition();
        });
        
        // Recalculate on window resize and scroll
        const handleResize = () => {
          requestAnimationFrame(calculatePosition);
        };
        const handleScroll = () => {
          requestAnimationFrame(calculatePosition);
        };
        
        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        
        // Also use ResizeObserver if available for more accurate positioning
        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined' && menu) {
          resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(calculatePosition);
          });
          resizeObserver.observe(menu);
        }
        
        return () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('scroll', handleScroll, { capture: true });
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        };
      }
    } else {
      setMenuPosition({});
    }
  }, [openMenuId, trips]);

  // Auto-focus first menu item when menu opens
  useEffect(() => {
    if (openMenuId !== null) {
      const trip = trips.find(t => t.id === openMenuId);
      if (trip) {
        setFocusedIndex(0);
      }
    }
  }, [openMenuId, trips]);

  // Update trip status function
  const updateTripStatus = async (tripId: number, newStatus: 'upcoming' | 'completed') => {
    if (!onUpdateTrip) {
      centeredToast.error('Update trip functionality not available');
      return;
    }

    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    try {
      const updatedTrip = { ...trip, status: newStatus };
      await onUpdateTrip(tripId, updatedTrip);
      
      // Auto-filter to Completed tab if marking as completed
      if (newStatus === 'completed') {
        setSelectedFilter('Completed');
      }
      
      centeredToast.success('Trip marked as completed!');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to update trip status:', error);
      centeredToast.error('Failed to update trip status');
    }
  };

  // Handle menu actions
  const handleMenuAction = (action: string, tripId: number) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    setOpenMenuId(null);
    setFocusedIndex(-1);

    switch (action) {
      case 'mark-completed':
        if (trip.status === 'upcoming') {
          updateTripStatus(tripId, 'completed');
        }
        break;
      case 'edit':
        setSelectedTrip(tripId);
        break;
      case 'delete':
        setTripToDelete({ id: tripId, title: trip.title });
        setDeleteModalOpen(true);
        break;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get trip emoji
  const getTripEmoji = (destination: string) => {
    const lower = destination.toLowerCase();
    if (lower.includes('beach') || lower.includes('island')) return '🏝️';
    if (lower.includes('mountain') || lower.includes('hiking')) return '🏔️';
    if (lower.includes('city') || lower.includes('tokyo') || lower.includes('paris')) return '🌆';
    return '✈️';
  };

  // Header scroll listener (for potential future enhancements like background opacity changes)
  useEffect(() => {
    if (!selectedTrip) return;
    
    const handleScroll = () => {
      // Header is always visible, but we can track scroll for future enhancements
      setIsHeaderSticky(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedTrip]);

  // ESC key handler for activity modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActivityModalOpen) {
        setIsActivityModalOpen(false);
        setSelectedActivity(null);
      }
    };
    
    if (isActivityModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isActivityModalOpen]);

  // Get activity icon based on activity name
  const getActivityIcon = (activityName: string) => {
    const lower = activityName.toLowerCase();
    if (lower.includes('eat') || lower.includes('restaurant') || lower.includes('food') || lower.includes('dining')) return <UtensilsCrossed size={18} />;
    if (lower.includes('hotel') || lower.includes('stay') || lower.includes('accommodation') || lower.includes('sleep')) return <Hotel size={18} />;
    if (lower.includes('drive') || lower.includes('car') || lower.includes('transport') || lower.includes('travel')) return <Car size={18} />;
    if (lower.includes('photo') || lower.includes('picture') || lower.includes('camera')) return <Camera size={18} />;
    if (lower.includes('movie') || lower.includes('show') || lower.includes('entertainment')) return <Film size={18} />;
    return <Map size={18} />;
  };

  // Get activity category emoji icon
  const getActivityCategoryEmoji = (activityName: string) => {
    const lower = activityName.toLowerCase();
    if (lower.includes('eat') || lower.includes('restaurant') || lower.includes('food') || lower.includes('dining')) return '🍽️';
    if (lower.includes('hotel') || lower.includes('stay') || lower.includes('accommodation') || lower.includes('sleep') || lower.includes('lodging')) return '🏨';
    if (lower.includes('drive') || lower.includes('car') || lower.includes('transport') || lower.includes('travel') || lower.includes('flight') || lower.includes('plane')) return '✈️';
    if (lower.includes('photo') || lower.includes('picture') || lower.includes('camera') || lower.includes('snapshot')) return '📸';
    return '📍'; // Default location icon
  };

  // Calculate budget progress
  const calculateBudgetProgress = () => {
    const budgetStr = selectedTripData?.budget || '0';
    const budgetNum = parseFloat(budgetStr.replace(/[₱$,]/g, '')) || 0;
    const spent = selectedTripData?.itinerary?.reduce((sum, item) => sum + (item.budget || 0), 0) || 0;
    const remaining = Math.max(0, budgetNum - spent);
    const percentage = budgetNum > 0 ? (spent / budgetNum) * 100 : 0;
    return { budgetNum, spent, remaining, percentage };
  };

  // ===== TRIP DETAIL VIEW =====
  if (selectedTrip && selectedTripData) {
    const budgetProgress = calculateBudgetProgress();
    
    return (
      <motion.div 
        className={`min-h-screen ${darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Always-Visible Sticky Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-xl border-b transition-all duration-300 ${
            darkMode 
              ? 'bg-[#1a1a2e]/95 border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.15)]' 
              : 'bg-white/95 border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
          }`}
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="h-full px-4 sm:px-5 flex items-center justify-between max-w-7xl mx-auto">
            {/* Back Button - Left Side */}
            <button
              onClick={() => setSelectedTrip(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] ${
                darkMode 
                  ? 'text-white hover:bg-white/10 active:bg-white/15' 
                  : 'text-[#1a1a2e] hover:bg-[#1a1a2e]/5 active:bg-[#1a1a2e]/10'
              }`}
              aria-label="Go back to trips"
              style={{ transform: 'scale(1)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft size={24} className="flex-shrink-0" />
              <span className="hidden sm:inline text-base font-medium">Back</span>
            </button>

            {/* Trip Title - Center */}
            <div className="flex-1 mx-2 sm:mx-4 min-w-0 text-center">
              <h1 
                className={`text-sm sm:text-base md:text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} 
                style={{ 
                  fontFamily: "'Outfit', sans-serif",
                  maxWidth: '60%',
                  margin: '0 auto',
                }}
                title={selectedTripData.title}
              >
                {selectedTripData.title}
              </h1>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-2">
              {/* Edit Button - Desktop Only */}
              <button
                onClick={() => {
                  // TODO: Implement edit trip functionality
                  centeredToast.success('Edit trip feature coming soon');
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] ${
                  darkMode 
                    ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                    : 'text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e]'
                }`}
                aria-label="Edit trip"
              >
                <Pencil size={18} />
                <span className="text-sm font-medium">Edit</span>
              </button>

              {/* Share Button - Desktop Only */}
              <button
                onClick={() => {
                  // TODO: Implement share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: selectedTripData.title,
                      text: `Check out my trip: ${selectedTripData.title}`,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    centeredToast.success('Trip link copied to clipboard!');
                  }
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] ${
                  darkMode 
                    ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                    : 'text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e]'
                }`}
                aria-label="Share trip"
              >
                <Share2 size={18} />
                <span className="text-sm font-medium">Share</span>
              </button>

              {/* More Options - Mobile Only */}
              <button
                onClick={() => setIsAddActivityModalOpen(true)}
                className={`sm:hidden p-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] ${
                  darkMode 
                    ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                    : 'text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e]'
                }`}
                aria-label="Add activity"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Trip Hero Image - Below Header */}
        <motion.div 
          className="relative w-full mt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ 
            aspectRatio: '16/9', 
            maxHeight: '300px',
            minHeight: '200px',
          }}
        >
          {/* Image Container with Rounded Bottom Corners */}
          <div className="relative w-full h-full overflow-hidden rounded-b-2xl">
            <ImageWithFallback
              src={selectedTripData.image}
              alt={`${selectedTripData.title} - ${selectedTripData.destination}`}
              className="w-full h-full object-cover"
              style={{
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
            
            {/* Gradient Overlay - Bottom to Top for Text Readability */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)',
              }}
            />
            
            {/* Subtle Bottom Shadow for Depth */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            />
          </div>

          {/* Trip Title & Status Overlay - Bottom Left */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                selectedTripData.status === 'upcoming'
                  ? darkMode 
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' 
                    : 'bg-blue-100 text-blue-700'
                  : darkMode 
                    ? 'bg-green-500/30 text-green-300 border border-green-400/50' 
                    : 'bg-green-100 text-green-700'
              }`}>
                {selectedTripData.status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </span>
            </div>
            <h1 
              className="text-white text-lg sm:text-xl font-extrabold mb-2 drop-shadow-lg" 
              style={{ 
                fontFamily: "'Outfit', sans-serif",
                fontSize: '18px',
                textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
                color: '#ffffff',
              }}
            >
              {selectedTripData.title}
            </h1>
            <p className="text-white text-sm sm:text-base font-semibold flex items-center gap-2 drop-shadow-md" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.2)' }}>
              <MapPin size={16} />
              {selectedTripData.destination}
            </p>
          </div>
        </motion.div>

        {/* Enhanced Trip Stats Section - Below Image */}
        <div className="px-4 sm:px-5 mt-6 relative z-10 mb-6">
          <div className={`rounded-2xl p-5 sm:p-6 border ${
            darkMode 
              ? 'bg-[#1a1a2e]/95 border-white/10 backdrop-blur-xl shadow-xl' 
              : 'bg-white border-black/5 shadow-xl'
          }`}>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="flex items-center gap-3 sm:flex-col sm:text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <Calendar size={24} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <div className="flex-1 sm:flex-none">
                  <p className={`text-xs sm:text-sm mb-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>Dates</p>
                  <p className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    {formatDate(selectedTripData.startDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:flex-col sm:text-center sm:border-x sm:border-white/10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <DollarSign size={24} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                </div>
                <div className="flex-1 sm:flex-none">
                  <p className={`text-xs sm:text-sm mb-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>Budget</p>
                  <p className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    {selectedTripData.budget}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:flex-col sm:text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <Users size={24} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                </div>
                <div className="flex-1 sm:flex-none">
                  <p className={`text-xs sm:text-sm mb-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>Travelers</p>
                  <p className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    {selectedTripData.companions}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="mt-4 pt-4 mb-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                  Budget Progress
                </span>
                <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  {budgetProgress.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="relative w-full h-4 rounded-full overflow-hidden">
                {/* Background Bar - Total Budget */}
                <div 
                  className={`absolute inset-0 h-full rounded-full ${
                    darkMode ? 'bg-white/10' : 'bg-gray-200'
                  }`}
                />
                {/* Progress Bar - Spent Portion with Gradient */}
                <div 
                  className="absolute inset-0 h-full rounded-full transition-all duration-200 ease-in-out"
                  style={{ 
                    width: `${Math.min(budgetProgress.percentage, 100)}%`,
                    background: budgetProgress.percentage > 100 
                      ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      : budgetProgress.percentage > 80 
                        ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                        : darkMode
                          ? 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)'
                          : 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                    boxShadow: budgetProgress.percentage <= 100
                      ? darkMode
                        ? '0 0 12px rgba(59, 130, 246, 0.4)'
                        : '0 0 12px rgba(16, 185, 129, 0.4)'
                      : 'none',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className={darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}>
                  Spent: ₱{budgetProgress.spent.toLocaleString()}
                </span>
                <span className={darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}>
                  Remaining: ₱{budgetProgress.remaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Itinerary Section */}
        <div className="px-4 sm:px-5 mb-24 sm:mb-32">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                Itinerary
              </h2>
              <p className={`text-base sm:text-lg ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                {selectedTripData.itinerary?.length || 0} {selectedTripData.itinerary?.length === 1 ? 'activity' : 'activities'}
              </p>
            </div>
          </div>

          {/* Back Button - Positioned near Activity Cards */}
          <div className="mb-4">
            <motion.button
              onClick={() => {
                setSelectedTrip(null);
                navigate('/itinerary');
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                borderRadius: ['50px 20px 50px 20px', '40% 60% 40% 60%', '50px 20px 50px 20px']
              }}
              transition={{ 
                opacity: { duration: 0.2, delay: 0.2, ease: "easeInOut" },
                scale: { duration: 0.2, delay: 0.2, type: "spring", stiffness: 200 },
                borderRadius: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 font-medium text-xs sm:text-sm transition-all duration-200 ease-in-out backdrop-blur-md ${
                darkMode 
                  ? 'bg-[#bd93f9]/25 text-[#bd93f9] hover:bg-[#bd93f9]/35 border border-[#bd93f9]/40' 
                  : 'bg-[#667eea]/20 text-[#667eea] hover:bg-[#667eea]/30 border border-[#667eea]/40'
              }`}
              style={{
                borderRadius: '50px 20px 50px 20px',
                boxShadow: darkMode 
                  ? '0 2px 8px rgba(189, 147, 249, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 2px 8px rgba(102, 126, 234, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: darkMode 
                  ? '0 4px 12px rgba(189, 147, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
                  : '0 4px 12px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              }}
              whileTap={{ 
                scale: 0.95
              }}
              aria-label="Back to trips"
            >
              <motion.div
                animate={{ 
                  x: [0, -1.5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <ChevronLeft size={16} className="flex-shrink-0" />
              </motion.div>
              <span className="whitespace-nowrap">Back to Trips</span>
            </motion.button>
          </div>

          {/* Activities Timeline */}
          <div className="relative">
            {(selectedTripData.itinerary && selectedTripData.itinerary.length > 0) ? (
              <div className="relative">
                {/* Vertical Timeline Line - Gradient Accent */}
                <div 
                  className="absolute left-6 top-0 bottom-0 w-0.5"
                  style={{ 
                    marginLeft: '24px',
                    background: darkMode
                      ? 'linear-gradient(180deg, rgba(189, 147, 249, 0.6) 0%, rgba(189, 147, 249, 0.3) 50%, rgba(189, 147, 249, 0.6) 100%)'
                      : 'linear-gradient(180deg, rgba(102, 126, 234, 0.6) 0%, rgba(102, 126, 234, 0.3) 50%, rgba(102, 126, 234, 0.6) 100%)',
                    boxShadow: darkMode
                      ? '0 0 8px rgba(189, 147, 249, 0.3)'
                      : '0 0 8px rgba(102, 126, 234, 0.3)',
                  }}
                />
                
                {/* Activity Cards */}
                <div className="space-y-4">
                  {selectedTripData.itinerary.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.2, ease: "easeInOut" }}
                      onClick={() => {
                        setSelectedActivity(item);
                        setIsActivityModalOpen(true);
                      }}
                      className={`relative flex gap-4 cursor-pointer group ${
                        darkMode 
                          ? 'bg-[#1a1a2e]/60 border-white/8 hover:bg-[#1a1a2e]/80 hover:border-white/15' 
                          : 'bg-white border-black/5 hover:bg-white hover:border-black/10 hover:shadow-lg'
                      } rounded-xl p-4 sm:p-5 border transition-all duration-200 ease-in-out`}
                    >
                      {/* Timeline Connector & Badge */}
                      <div className="relative flex-shrink-0">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm z-10 relative ${
                            darkMode 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          } shadow-lg`}
                        >
                          {index + 1}
                        </div>
                        {index < selectedTripData.itinerary!.length - 1 && (
                          <div 
                            className={`absolute top-12 left-1/2 w-0.5 h-8 -translate-x-1/2 ${
                              darkMode ? 'bg-white/10' : 'bg-[#1a1a2e]/10'
                            }`}
                          />
                        )}
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-2 rounded-lg transition-all duration-200 ${
                                darkMode ? 'bg-white/15' : 'bg-[#1a1a2e]/10'
                              }`}>
                                {getActivityIcon(item.activity)}
                              </div>
                              <span className="text-lg drop-shadow-sm" role="img" aria-label="Activity category" style={{ filter: 'contrast(1.2)' }}>
                                {getActivityCategoryEmoji(item.activity)}
                              </span>
                              <div className={`text-sm font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                                {item.time}
                              </div>
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                              {item.activity}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={14} className={darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'} />
                              <span className={`text-sm ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                                {item.location}
                              </span>
                            </div>
                          </div>
                          
                          {/* Three-dot menu for activity */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivity(item);
                              setIsActivityModalOpen(true);
                            }}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                              darkMode 
                                ? 'text-white/50 hover:bg-white/10 hover:text-white' 
                                : 'text-[#1a1a2e]/50 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e]'
                            }`}
                            aria-label="Activity options"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>

                        {/* Cost Badge */}
                        {item.budget && item.budget > 0 && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                            darkMode 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            <DollarSign size={14} />
                            <span className="text-sm font-semibold">
                              ₱{item.budget.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              /* Enhanced Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-12 sm:p-16 border text-center ${
                  darkMode ? 'bg-[#1a1a2e]/40 border-white/8' : 'bg-white/50 border-black/5'
                }`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  darkMode ? 'bg-white/10' : 'bg-[#1a1a2e]/5'
                }`}>
                  <Calendar size={40} className={darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                  No activities yet
                </h3>
                <p className={`text-sm mb-6 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  Start planning by adding your first activity
                </p>
                <motion.button
                  onClick={() => setIsAddActivityModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                    darkMode 
                      ? 'bg-[#bd93f9] text-[#0f0f1a] hover:bg-[#bd93f9]/90' 
                      : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  Add Activity
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Floating Add Activity Button with Tooltip */}
        {selectedTripData.itinerary && selectedTripData.itinerary.length > 0 && (
          <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 group/tooltip">
            <motion.button
              onClick={() => setIsAddActivityModalOpen(true)}
              className={`p-4 sm:p-5 rounded-full shadow-2xl font-semibold flex items-center gap-2 transition-all duration-200 ease-in-out ${
                darkMode 
                  ? 'bg-[#bd93f9] text-[#0f0f1a] hover:bg-[#bd93f9]/90' 
                  : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(189, 147, 249, 0.4)' 
                  : '0 8px 32px rgba(102, 126, 234, 0.4)',
              }}
              aria-label="Add activity"
            >
              <Plus size={24} />
              <span className="hidden sm:inline">Add Activity</span>
            </motion.button>
            {/* Tooltip */}
            <div className={`absolute right-0 bottom-full mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 ease-in-out ${
              darkMode 
                ? 'bg-[#1a1a2e] text-white border border-white/20' 
                : 'bg-[#1a1a2e] text-white border border-black/10'
            } shadow-lg`}>
              Add Activity
              <div className={`absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                darkMode ? 'border-t-[#1a1a2e]' : 'border-t-[#1a1a2e]'
              }`} />
            </div>
          </div>
        )}

        <AddActivityModal
          isOpen={isAddActivityModalOpen}
          onClose={() => setIsAddActivityModalOpen(false)}
          onAdd={handleAddActivity}
          remainingBudget={selectedTripData ? (() => {
            const tripBudgetNum = parseFloat(selectedTripData.budget.replace(/[₱$,]/g, '')) || 0;
            const totalSpent = selectedTripData.itinerary?.reduce((sum, item) => sum + (item.budget || 0), 0) || 0;
            return tripBudgetNum - totalSpent;
          })() : undefined}
          darkMode={darkMode}
        />

        {/* Activity Details Modal */}
        <AnimatePresence>
          {isActivityModalOpen && selectedActivity && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => {
                  setIsActivityModalOpen(false);
                  setSelectedActivity(null);
                }}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:w-full z-50 ${
                  darkMode 
                    ? 'bg-[#1a1a2e] border-white/10' 
                    : 'bg-white border-black/10'
                } rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`p-5 sm:p-6 border-b ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                } flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      darkMode ? 'bg-white/10' : 'bg-[#1a1a2e]/5'
                    }`}>
                      {getActivityIcon(selectedActivity.activity)}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {selectedActivity.activity}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                        Day {selectedActivity.day}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsActivityModalOpen(false);
                      setSelectedActivity(null);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                        : 'text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/5 hover:text-[#1a1a2e]'
                    }`}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {/* Time */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${
                      darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'
                    }`}>
                      Time
                    </label>
                    <div className={`flex items-center gap-2 text-base ${
                      darkMode ? 'text-white' : 'text-[#1a1a2e]'
                    }`}>
                      <Clock size={18} className={darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'} />
                      {selectedActivity.time}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${
                      darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'
                    }`}>
                      Location
                    </label>
                    <div className={`flex items-center gap-2 text-base ${
                      darkMode ? 'text-white' : 'text-[#1a1a2e]'
                    }`}>
                      <MapPin size={18} className={darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'} />
                      {selectedActivity.location}
                    </div>
                  </div>

                  {/* Budget */}
                  {selectedActivity.budget && selectedActivity.budget > 0 && (
                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${
                        darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'
                      }`}>
                        Cost
                      </label>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        <DollarSign size={18} />
                        <span className="text-lg font-bold">
                          ₱{selectedActivity.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className={`p-5 sm:p-6 border-t ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                } flex items-center justify-end gap-3`}>
                  <button
                    onClick={() => {
                      setIsActivityModalOpen(false);
                      setSelectedActivity(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'text-white/70 hover:bg-white/10' 
                        : 'text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/5'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ===== MAIN TRIPS LIST VIEW =====
  return (
    <div className={`min-h-screen pb-32 sm:pb-24 relative overflow-hidden ${
      darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'
    }`}>
      {/* Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(180deg, rgba(189, 147, 249, 0.08) 0%, rgba(255, 121, 198, 0.05) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.06) 50%, transparent 100%)',
        }}
      />

      <div className="relative">
        {/* ===== HEADER SECTION ===== */}
        <div className="px-5 pt-12 pb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 
                className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                My Trips
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Plan and organize your journeys
              </p>
            </div>
            
            {/* New Trip Button */}
            <motion.button
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                darkMode 
                  ? 'bg-[#bd93f9] text-[#0f0f1a] hover:bg-[#bd93f9]/90' 
                  : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} strokeWidth={2.5} />
              New Trip
            </motion.button>
          </div>
        </div>

        {/* ===== METRICS SECTION ===== */}
        <div className="px-5 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {/* Total Trips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-4 rounded-2xl border ${
                darkMode 
                  ? 'bg-[#1a1a2e]/60 border-white/8' 
                  : 'bg-white border-black/5 shadow-sm'
              }`}
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: darkMode ? 'rgba(189, 147, 249, 0.2)' : 'rgba(102, 126, 234, 0.15)' }}
              >
                <Plane size={18} style={{ color: darkMode ? '#bd93f9' : '#667eea' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {totalTrips}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Total Trips
              </div>
            </motion.div>

            {/* Upcoming */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-4 rounded-2xl border ${
                darkMode 
                  ? 'bg-[#1a1a2e]/60 border-white/8' 
                  : 'bg-white border-black/5 shadow-sm'
              }`}
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: darkMode ? 'rgba(139, 233, 253, 0.2)' : 'rgba(78, 205, 196, 0.15)' }}
              >
                <TrendingUp size={18} style={{ color: darkMode ? '#8be9fd' : '#4ecdc4' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {upcomingTrips}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Upcoming
              </div>
            </motion.div>

            {/* Avg Budget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-4 rounded-2xl border ${
                darkMode 
                  ? 'bg-[#1a1a2e]/60 border-white/8' 
                  : 'bg-white border-black/5 shadow-sm'
              }`}
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: darkMode ? 'rgba(80, 250, 123, 0.2)' : 'rgba(45, 138, 126, 0.15)' }}
              >
                <DollarSign size={18} style={{ color: darkMode ? '#50fa7b' : '#2d8a7e' }} />
              </div>
              <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                ₱{avgBudget.toLocaleString()}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Avg Budget
              </div>
            </motion.div>
          </div>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="px-5 mb-4">
          <div className={`relative rounded-xl border overflow-hidden ${
            darkMode 
              ? 'bg-[#1a1a2e]/60 border-white/10' 
              : 'bg-white border-black/10 shadow-sm'
          }`}>
            <Search 
              size={18} 
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trips..."
              className={`w-full py-3.5 pl-11 pr-4 bg-transparent text-sm focus:outline-none ${
                darkMode 
                  ? 'text-white placeholder:text-white/40' 
                  : 'text-[#1a1a2e] placeholder:text-[#1a1a2e]/40'
              }`}
            />
          </div>
        </div>

        {/* ===== FILTER TABS ===== */}
        <div className="px-5 mb-6">
          <div className={`inline-flex p-1 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
            {(['All', 'Upcoming', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === selectedFilter
                    ? darkMode 
                      ? 'bg-[#bd93f9] text-[#0f0f1a]' 
                      : 'bg-[#667eea] text-white'
                    : darkMode 
                      ? 'text-white/60 hover:text-white' 
                      : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e]'
                }`}
              >
                {tab}
                {tab === 'All' && ` (${trips.length})`}
                {tab === 'Upcoming' && ` (${upcomingTrips})`}
                {tab === 'Completed' && ` (${completedTrips})`}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TRIPS LIST ===== */}
        <div className="px-5">
          <AnimatePresence mode="popLayout">
            {filteredTrips.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-2xl p-10 border text-center ${
                  darkMode ? 'bg-[#1a1a2e]/40 border-white/8' : 'bg-white/50 border-black/5'
                }`}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: darkMode 
                      ? 'linear-gradient(135deg, rgba(189, 147, 249, 0.2) 0%, rgba(255, 121, 198, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  }}
                >
                  <Plane size={28} className={darkMode ? 'text-[#bd93f9]' : 'text-[#667eea]'} />
                </div>
                <h3 
                  className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  No Trips Found
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  {searchQuery || selectedFilter !== 'All'
                    ? 'Try adjusting your search or filters'
                    : 'Start planning your first adventure!'}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
                    darkMode 
                      ? 'bg-[#bd93f9] text-[#0f0f1a]' 
                      : 'bg-[#667eea] text-white'
                  }`}
                >
                  <Plus size={16} />
                  Create Trip
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl border overflow-hidden ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8' 
                        : 'bg-white border-black/5 shadow-sm'
                    }`}
                  >
                    <div className="flex">
                      {/* Trip Image */}
                      <div 
                        className="w-28 h-32 flex-shrink-0 cursor-pointer relative"
                        onClick={() => setSelectedTrip(trip.id)}
                      >
                        {trip.image ? (
                          <ImageWithFallback
                            src={trip.image}
                            alt={trip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-4xl"
                            style={{
                              background: darkMode 
                                ? 'linear-gradient(135deg, rgba(189, 147, 249, 0.3) 0%, rgba(139, 233, 253, 0.2) 100%)'
                                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(78, 205, 196, 0.15) 100%)',
                            }}
                          >
                            {getTripEmoji(trip.destination)}
                          </div>
                        )}
                      </div>

                      {/* Trip Details */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 
                              className={`font-semibold truncate cursor-pointer hover:underline ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                              style={{ fontFamily: "'Outfit', sans-serif" }}
                              onClick={() => setSelectedTrip(trip.id)}
                            >
                              {trip.title}
                            </h3>
                            <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                              <MapPin size={10} className="inline mr-1" />
                              {trip.destination}
                            </p>
                          </div>
                          
                          {/* Status Badge */}
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            trip.status === 'upcoming'
                              ? darkMode ? 'bg-[#8be9fd]/20 text-[#8be9fd]' : 'bg-[#4ecdc4]/20 text-[#4ecdc4]'
                              : darkMode ? 'bg-[#50fa7b]/20 text-[#50fa7b]' : 'bg-[#95e1d3]/30 text-[#2d8a7e]'
                          }`}>
                            {trip.status}
                          </span>
                        </div>

                        {/* Trip Info Row */}
                        <div className="flex items-center gap-4 mb-3">
                          <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                            <Calendar size={12} />
                            {formatDate(trip.startDate)}
                          </span>
                          <span className={`text-xs font-medium ${darkMode ? 'text-[#50fa7b]' : 'text-[#2d8a7e]'}`}>
                            {trip.budget}
                          </span>
                          <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                            <Users size={12} />
                            {trip.companions}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTrip(trip.id)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                              darkMode 
                                ? 'bg-white/10 text-white hover:bg-white/15' 
                                : 'bg-[#1a1a2e]/5 text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/10'
                            }`}
                          >
                            View Details
                            <ChevronRight size={14} />
                          </button>
                          
                          {/* Three-dot menu button */}
                          <div className="relative">
                            <button
                              ref={(el) => { buttonRefs.current[trip.id] = el; }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('Button clicked for trip:', trip.id, 'Current openMenuId:', openMenuId);
                                const newMenuId = openMenuId === trip.id ? null : trip.id;
                                console.log('Setting openMenuId to:', newMenuId);
                                setOpenMenuId(newMenuId);
                                setFocusedIndex(newMenuId ? 0 : -1);
                              }}
                              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors relative ${
                                darkMode 
                                  ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white' 
                                  : 'bg-[#1a1a2e]/5 text-[#1a1a2e]/60 hover:bg-[#1a1a2e]/10 hover:text-[#1a1a2e]'
                              }`}
                              aria-label="Trip options"
                              aria-expanded={openMenuId === trip.id}
                              aria-haspopup="menu"
                              style={{
                                padding: '10px',
                                zIndex: 1002,
                                position: 'relative',
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu - Rendered via Portal to document.body */}
                            {openMenuId === trip.id && typeof document !== 'undefined' && createPortal(
                              <>
                                {/* Backdrop */}
                                <div
                                  className="fixed inset-0 z-[999]"
                                  onClick={(e) => {
                                    const button = buttonRefs.current[trip.id];
                                    const menu = menuRefs.current[trip.id];
                                    const target = e.target as Node;
                                    
                                    if (
                                      (button && button.contains(target)) ||
                                      (menu && menu.contains(target))
                                    ) {
                                      return;
                                    }
                                    setOpenMenuId(null);
                                    setFocusedIndex(-1);
                                  }}
                                  style={{ 
                                    pointerEvents: 'auto',
                                    backgroundColor: 'transparent',
                                  }}
                                />
                                
                                {/* Menu Container - Fixed positioning with explicit visibility */}
                                <div
                                  ref={(el) => { 
                                    menuRefs.current[trip.id] = el;
                                    if (el) {
                                      const button = buttonRefs.current[trip.id];
                                      if (button) {
                                        const buttonRect = button.getBoundingClientRect();
                                        const menuWidth = 192;
                                        const padding = 12;
                                        const x = Math.max(padding, Math.min(buttonRect.left, window.innerWidth - menuWidth - padding));
                                        const y = buttonRect.bottom + 8;
                                        el.style.cssText = `
                                          position: fixed !important;
                                          left: ${x}px !important;
                                          top: ${y}px !important;
                                          width: 192px !important;
                                          display: block !important;
                                          visibility: visible !important;
                                          opacity: 1 !important;
                                          z-index: 1000 !important;
                                          pointer-events: auto !important;
                                          background-color: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
                                          border: ${darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'} !important;
                                          border-radius: 12px !important;
                                          box-shadow: ${darkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.15)'} !important;
                                          padding: 4px !important;
                                          transform: none !important;
                                          clip-path: none !important;
                                          max-height: none !important;
                                          overflow: visible !important;
                                        `;
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => handleMenuKeyDown(e, trip.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  role="menu"
                                  aria-orientation="vertical"
                                >
                                  <div className="p-1">
                                    {/* Mark as Completed */}
                                    {trip.status === 'upcoming' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMenuAction('mark-completed', trip.id);
                                        }}
                                        onMouseEnter={() => setFocusedIndex(0)}
                                        onFocus={() => setFocusedIndex(0)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                          focusedIndex === 0
                                            ? darkMode
                                              ? 'bg-white/10 text-white focus:ring-indigo-500'
                                              : 'bg-[#1a1a2e]/5 text-[#1a1a2e] focus:ring-indigo-500'
                                            : darkMode
                                              ? 'text-white/80 hover:bg-white/10 focus:ring-indigo-500'
                                              : 'text-[#1a1a2e]/80 hover:bg-[#1a1a2e]/5 focus:ring-indigo-500'
                                        }`}
                                        role="menuitem"
                                        tabIndex={focusedIndex === 0 ? 0 : -1}
                                        style={{ display: 'flex', visibility: 'visible' }}
                                      >
                                        <CheckCircle2 size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                                        <span>Mark as Completed</span>
                                      </button>
                                    )}
                                    
                                    {/* Edit Trip */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuAction('edit', trip.id);
                                      }}
                                      onMouseEnter={() => setFocusedIndex(trip.status === 'upcoming' ? 1 : 0)}
                                      onFocus={() => setFocusedIndex(trip.status === 'upcoming' ? 1 : 0)}
                                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        focusedIndex === (trip.status === 'upcoming' ? 1 : 0)
                                          ? darkMode
                                            ? 'bg-white/10 text-white focus:ring-indigo-500'
                                            : 'bg-[#1a1a2e]/5 text-[#1a1a2e] focus:ring-indigo-500'
                                          : darkMode
                                            ? 'text-white/80 hover:bg-white/10 focus:ring-indigo-500'
                                            : 'text-[#1a1a2e]/80 hover:bg-[#1a1a2e]/5 focus:ring-indigo-500'
                                      }`}
                                      role="menuitem"
                                      tabIndex={focusedIndex === (trip.status === 'upcoming' ? 1 : 0) ? 0 : -1}
                                      style={{ display: 'flex', visibility: 'visible' }}
                                    >
                                      <Pencil size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                                      <span>Edit Trip</span>
                                    </button>
                                    
                                    {/* Delete Trip */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuAction('delete', trip.id);
                                      }}
                                      onMouseEnter={() => setFocusedIndex(trip.status === 'upcoming' ? 2 : 1)}
                                      onFocus={() => setFocusedIndex(trip.status === 'upcoming' ? 2 : 1)}
                                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        focusedIndex === (trip.status === 'upcoming' ? 2 : 1)
                                          ? darkMode
                                            ? 'bg-red-500/20 text-red-400 focus:ring-red-500'
                                            : 'bg-red-50 text-red-600 focus:ring-red-500'
                                          : darkMode
                                            ? 'text-red-400 hover:bg-red-500/20 focus:ring-red-500'
                                            : 'text-red-600 hover:bg-red-50 focus:ring-red-500'
                                      }`}
                                      role="menuitem"
                                      tabIndex={focusedIndex === (trip.status === 'upcoming' ? 2 : 1) ? 0 : -1}
                                      style={{ display: 'flex', visibility: 'visible' }}
                                    >
                                      <Trash2 size={16} />
                                      <span>Delete Trip</span>
                                    </button>
                                  </div>
                                </div>
                              </>,
                              document.body
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AddItineraryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAddTrip}
        darkMode={darkMode}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTripToDelete(null);
        }}
        onConfirm={() => {
          if (tripToDelete) {
            onDeleteTrip(tripToDelete.id);
          }
        }}
        itemName={tripToDelete?.title || ''}
        itemType="trip"
      />
    </div>
  );
}
