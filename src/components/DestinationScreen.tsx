import { useState } from 'react';
import { Search, MapPin, Check, Trash2, Edit2, Plus, Star, Heart, Eye, Sparkles, ChevronDown, ArrowUpDown } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AddDestinationModal } from './AddDestinationModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { AISearchModal } from './AISearchModal';
import { Destination } from '../types/travel';
import { motion, AnimatePresence } from 'motion/react';
import { useTravelData } from '../context/DataContext';
import type { AISearchFilters } from '../hooks/useAISearch';

interface DestinationScreenProps {
  currentUser?: any;
  destinations: Destination[];
  onAddDestination: (destination: {
    name: string;
    location: string;
    category: string;
    description: string;
    imageUrl: string;
    rating: number;
  }) => void;
  onDeleteDestination: (destinationId: number) => void;
  onUpdateDestination: (destinationId: number, updatedDestination: Destination) => void;
  darkMode?: boolean;
}

export function DestinationScreen({ 
  currentUser,
  destinations, 
  onAddDestination, 
  onDeleteDestination,
  onUpdateDestination,
  darkMode = false
}: DestinationScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState<{ id: number; name: string } | null>(null);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { setAIFilters } = useTravelData();

  const categories = ['All', 'Museum', 'Resort', 'Restaurant', 'Nature', 'Social'];

  // Calculate stats
  const totalCount = destinations.length;
  const visitedCount = destinations.filter(d => d.visited).length;
  const avgRating = destinations.length > 0
    ? (destinations.reduce((sum, d) => sum + (parseFloat(String(d.rating)) || 0), 0) / destinations.length).toFixed(1)
    : '0.0';

  const handleDeleteClick = (id: number, name: string) => {
    setDestinationToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (destinationToDelete) {
      onDeleteDestination(destinationToDelete.id);
      setDeleteModalOpen(false);
      setDestinationToDelete(null);
    }
  };

  const handleEditClick = (destination: Destination) => {
    setEditingDestination(destination);
    setIsAddModalOpen(true);
  };

  const handleAddDestination = (newDestination: {
    name: string;
    location: string;
    category: string;
    description: string;
    imageUrl: string;
    rating: number;
  }) => {
    if (editingDestination) {
      onUpdateDestination(editingDestination.id, {
        ...editingDestination,
        ...newDestination,
        image: newDestination.imageUrl,
      });
      setEditingDestination(null);
    } else {
      onAddDestination(newDestination);
    }
    setIsAddModalOpen(false);
  };

  const toggleVisited = (destination: Destination) => {
    onUpdateDestination(destination.id, { ...destination, visited: !destination.visited });
  };

  // Filter and sort destinations
  const filteredDestinations = destinations
    .filter((dest) => {
      const matchesCategory = selectedCategory === 'All' 
        ? true 
        : selectedCategory === 'Social'
        ? dest.isExternal === true
        : dest.category === selectedCategory;
      const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           dest.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let compareA: any = a[sortBy as keyof Destination];
      let compareB: any = b[sortBy as keyof Destination];

      if (sortBy === 'visited') {
        compareA = a.visited ? 1 : 0;
        compareB = b.visited ? 1 : 0;
      }

      if (typeof compareA === 'string') {
        compareA = compareA.toLowerCase();
        compareB = compareB.toLowerCase();
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Rating', value: 'rating' },
    { label: 'Location', value: 'location' },
    { label: 'Category', value: 'category' },
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.value === sortBy);
    return option?.label || 'Name';
  };

  // Get emoji for destination if no image
  const getDestinationEmoji = (category: string) => {
    switch (category) {
      case 'Museum': return '🏛️';
      case 'Resort': return '🏖️';
      case 'Restaurant': return '🍽️';
      case 'Nature': return '🏔️';
      default: return '📍';
    }
  };

  return (
    <div className={`min-h-screen pb-32 sm:pb-24 relative overflow-hidden ${
      darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'
    }`}>
      {/* Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(180deg, rgba(139, 233, 253, 0.08) 0%, rgba(80, 250, 123, 0.05) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(78, 205, 196, 0.1) 0%, rgba(69, 183, 209, 0.06) 50%, transparent 100%)',
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
                Places
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Explore amazing destinations
              </p>
            </div>
            
            {/* New Place Button */}
            <motion.button
              onClick={() => {
                setEditingDestination(null);
                setIsAddModalOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                darkMode 
                  ? 'bg-[#8be9fd] text-[#0f0f1a] hover:bg-[#8be9fd]/90' 
                  : 'bg-[#4ecdc4] text-white hover:bg-[#4ecdc4]/90'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} strokeWidth={2.5} />
              New Place
            </motion.button>
          </div>
        </div>

        {/* ===== STATS SECTION ===== */}
        <div className="px-5 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {/* Total */}
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
                style={{ backgroundColor: darkMode ? 'rgba(139, 233, 253, 0.2)' : 'rgba(78, 205, 196, 0.15)' }}
              >
                <MapPin size={18} style={{ color: darkMode ? '#8be9fd' : '#4ecdc4' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {totalCount}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Total Places
              </div>
            </motion.div>

            {/* Visited */}
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
                style={{ backgroundColor: darkMode ? 'rgba(80, 250, 123, 0.2)' : 'rgba(45, 138, 126, 0.15)' }}
              >
                <Check size={18} style={{ color: darkMode ? '#50fa7b' : '#2d8a7e' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {visitedCount}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Visited
              </div>
            </motion.div>

            {/* Avg Rating */}
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
                style={{ backgroundColor: darkMode ? 'rgba(241, 250, 140, 0.2)' : 'rgba(255, 193, 7, 0.15)' }}
              >
                <Star size={18} style={{ color: darkMode ? '#f1fa8c' : '#f59e0b' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {avgRating}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Avg Rating
              </div>
            </motion.div>
          </div>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="px-5 mb-4">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className={`flex-1 relative rounded-xl border overflow-hidden ${
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
                placeholder="Search destinations..."
                className={`w-full py-3.5 pl-11 pr-4 bg-transparent text-sm focus:outline-none ${
                  darkMode 
                    ? 'text-white placeholder:text-white/40' 
                    : 'text-[#1a1a2e] placeholder:text-[#1a1a2e]/40'
                }`}
              />
            </div>

            {/* AI Search Button */}
            <motion.button
              onClick={() => setIsAISearchOpen(true)}
              className={`px-4 rounded-xl flex items-center gap-2 font-semibold text-sm ${
                darkMode 
                  ? 'bg-gradient-to-r from-[#bd93f9] to-[#ff79c6] text-white' 
                  : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles size={18} />
              <span className="hidden sm:inline">AI Search</span>
            </motion.button>
          </div>
        </div>

        {/* ===== CATEGORY FILTERS ===== */}
        <div className="px-5 mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? darkMode 
                      ? 'bg-[#8be9fd] text-[#0f0f1a]' 
                      : 'bg-[#4ecdc4] text-white'
                    : darkMode 
                      ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white' 
                      : 'bg-black/5 text-[#1a1a2e]/60 hover:bg-black/10 hover:text-[#1a1a2e]'
                }`}
              >
                {category === 'Social' ? '📱 Saved' : category}
              </button>
            ))}
          </div>
        </div>

        {/* ===== SORT CONTROL ===== */}
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
              {filteredDestinations.length} {filteredDestinations.length === 1 ? 'place' : 'places'}
            </span>
            
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  darkMode 
                    ? 'bg-white/5 text-white/70 hover:bg-white/10' 
                    : 'bg-black/5 text-[#1a1a2e]/70 hover:bg-black/10'
                }`}
              >
                <ArrowUpDown size={14} />
                Sort: {getSortLabel()}
                <ChevronDown size={14} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 top-full mt-2 py-2 rounded-xl border shadow-xl z-50 min-w-[140px] ${
                      darkMode 
                        ? 'bg-[#1a1a2e] border-white/10' 
                        : 'bg-white border-black/10'
                    }`}
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (sortBy === option.value) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(option.value);
                            setSortDirection('asc');
                          }
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
                          sortBy === option.value
                            ? darkMode ? 'text-[#8be9fd] bg-white/5' : 'text-[#4ecdc4] bg-black/5'
                            : darkMode ? 'text-white/70 hover:bg-white/5' : 'text-[#1a1a2e]/70 hover:bg-black/5'
                        }`}
                      >
                        {option.label}
                        {sortBy === option.value && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ===== DESTINATIONS GRID ===== */}
        <div className="px-5">
          <AnimatePresence mode="popLayout">
            {filteredDestinations.length === 0 ? (
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
                      ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.2) 0%, rgba(80, 250, 123, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(69, 183, 209, 0.1) 100%)',
                  }}
                >
                  <MapPin size={28} className={darkMode ? 'text-[#8be9fd]' : 'text-[#4ecdc4]'} />
                </div>
                <h3 
                  className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  No Places Found
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  {searchQuery || selectedCategory !== 'All'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first destination!'}
                </p>
                <button
                  onClick={() => {
                    setEditingDestination(null);
                    setIsAddModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
                    darkMode 
                      ? 'bg-[#8be9fd] text-[#0f0f1a]' 
                      : 'bg-[#4ecdc4] text-white'
                  }`}
                >
                  <Plus size={16} />
                  Add Place
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setActiveCard(activeCard === destination.id ? null : destination.id)}
                    className={`rounded-2xl border overflow-hidden cursor-pointer transition-shadow ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8' 
                        : 'bg-white border-black/5 shadow-sm'
                    } ${activeCard === destination.id ? 'ring-2 ring-offset-2' : ''}`}
                    style={{
                      ringColor: darkMode ? '#8be9fd' : '#4ecdc4',
                    }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {destination.image ? (
                        <ImageWithFallback
                          src={destination.image}
                          alt={destination.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-5xl"
                          style={{
                            background: darkMode 
                              ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.2) 0%, rgba(189, 147, 249, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(102, 126, 234, 0.15) 100%)',
                          }}
                        >
                          {getDestinationEmoji(destination.category)}
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Category chip */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                        darkMode 
                          ? 'bg-black/50 text-white backdrop-blur-sm' 
                          : 'bg-white/90 text-[#1a1a2e] shadow-sm'
                      }`}>
                        {destination.category}
                      </div>

                      {/* Visited badge */}
                      {destination.visited && (
                        <div className={`absolute top-2 right-2 p-1.5 rounded-lg ${
                          darkMode 
                            ? 'bg-[#50fa7b]/30 backdrop-blur-sm' 
                            : 'bg-[#2d8a7e]/20'
                        }`}>
                          <Check size={12} className={darkMode ? 'text-[#50fa7b]' : 'text-[#2d8a7e]'} />
                        </div>
                      )}

                      {/* Action overlay */}
                      <AnimatePresence>
                        {activeCard === destination.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3"
                          >
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisited(destination);
                              }}
                              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {destination.visited ? (
                                <Eye size={20} className="text-green-400" />
                              ) : (
                                <Heart size={20} className="text-white" />
                              )}
                            </motion.button>

                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(destination);
                                setActiveCard(null);
                              }}
                              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit2 size={20} className="text-blue-400" />
                            </motion.button>

                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(destination.id, destination.name);
                                setActiveCard(null);
                              }}
                              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={20} className="text-red-400" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* Title & Rating */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 
                          className={`font-semibold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                          style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                          {destination.name}
                        </h3>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className={`text-xs font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            {typeof destination.rating === 'number' 
                              ? destination.rating.toFixed(1) 
                              : parseFloat(String(destination.rating || 0)).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <p className={`text-xs flex items-center gap-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                        <MapPin size={10} />
                        <span className="line-clamp-1">{destination.location}</span>
                      </p>

                      {/* Social badge */}
                      {destination.isExternal && (
                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          darkMode 
                            ? 'bg-[#bd93f9]/20 text-[#bd93f9]' 
                            : 'bg-[#667eea]/15 text-[#667eea]'
                        }`}>
                          📱 {destination.externalSourcePlatform || 'Social'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AddDestinationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDestination(null);
        }}
        onAdd={handleAddDestination}
        editingDestination={editingDestination}
        darkMode={darkMode}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={destinationToDelete?.name || ''}
      />

      <AISearchModal
        isOpen={isAISearchOpen}
        onClose={() => {
          setIsAISearchOpen(false);
          setAIFilters(null);
        }}
        onSearchComplete={(aiFilters: AISearchFilters, results: any[]) => {
          setAIFilters(aiFilters);
          setIsAISearchOpen(false);
        }}
      />
    </div>
  );
}
