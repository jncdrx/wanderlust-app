import { useState, useEffect, useCallback } from 'react';
import { X, Star, MapPin, Calendar, Camera, Plus, Trash2, Search, ZoomIn, ChevronLeft, ChevronRight, ChevronDown, ArrowUpDown, Image } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AddPhotoModal } from './AddPhotoModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Photo, Destination } from '../types/travel';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryScreenProps {
  currentUser?: any;
  photos: Photo[];
  destinations: Destination[];
  onAddPhoto: (photo: {
    destinationId: number | null;
    url: string;
    caption: string;
    rating: number;
  }) => void;
  onUpdatePhoto: (photoId: number, updatedPhoto: Photo) => void;
  onDeletePhoto: (photoId: number) => void;
  darkMode?: boolean;
}

export function GalleryScreen({ currentUser, photos, destinations, onAddPhoto, onUpdatePhoto, onDeletePhoto, darkMode = false }: GalleryScreenProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortOptions = [
    { label: 'Date Added', value: 'dateAdded' },
    { label: 'Rating', value: 'rating' },
    { label: 'Caption', value: 'caption' },
  ];

  // Calculate stats
  const totalPhotos = photos.length;
  const uniqueDestinations = new Set(photos.map(p => p.destinationId).filter(Boolean)).size;
  const avgRating = photos.length > 0 
    ? (photos.reduce((sum, p) => sum + (parseFloat(String(p.rating)) || 0), 0) / photos.length).toFixed(1)
    : '0.0';

  // Filter and sort photos
  const getSortableDate = (photo: Photo) => {
    const dateValue = photo.dateAdded || photo.createdAt || photo.updatedAt;
    const timestamp = dateValue ? Date.parse(dateValue) : NaN;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const filteredAndSortedPhotos = photos
    .filter(photo => {
      const destination = destinations.find(d => d.id === photo.destinationId);
      const destinationName = destination?.name?.toLowerCase() || '';
      const matchesSearch = 
        (photo.caption?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (photo.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        destinationName.includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let compareA: string | number = '';
      let compareB: string | number = '';

      switch (sortBy) {
        case 'dateAdded':
          compareA = getSortableDate(a);
          compareB = getSortableDate(b);
          break;
        case 'rating':
          compareA = parseFloat(String(a.rating)) || 0;
          compareB = parseFloat(String(b.rating)) || 0;
          break;
        case 'caption':
          compareA = (a.caption || '').toLowerCase();
          compareB = (b.caption || '').toLowerCase();
          break;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleDeleteConfirm = () => {
    if (deletePhotoId) {
      onDeletePhoto(deletePhotoId);
      setDeletePhotoId(null);
    }
  };

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    const newIndex = direction === 'prev' 
      ? (lightboxIndex - 1 + filteredAndSortedPhotos.length) % filteredAndSortedPhotos.length
      : (lightboxIndex + 1) % filteredAndSortedPhotos.length;
    setLightboxIndex(newIndex);
  }, [lightboxIndex, filteredAndSortedPhotos.length]);

  const currentLightboxPhoto = lightboxIndex !== null ? filteredAndSortedPhotos[lightboxIndex] : null;
  const currentLightboxDest = currentLightboxPhoto 
    ? destinations.find(d => d.id === currentLightboxPhoto.destinationId)
    : null;

  // Keyboard support for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox('prev');
      } else if (e.key === 'ArrowRight') {
        navigateLightbox('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, navigateLightbox]);

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.value === sortBy);
    return option?.label || 'Date Added';
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            ? 'linear-gradient(180deg, rgba(255, 121, 198, 0.08) 0%, rgba(241, 250, 140, 0.05) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 142, 83, 0.06) 50%, transparent 100%)',
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
                Gallery
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                {totalPhotos} {totalPhotos === 1 ? 'memory' : 'memories'} captured
              </p>
            </div>
            
            {/* Add Photo Button */}
            <motion.button
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                darkMode 
                  ? 'bg-[#ff79c6] text-[#0f0f1a] hover:bg-[#ff79c6]/90' 
                  : 'bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/90'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Photo
            </motion.button>
          </div>
        </div>

        {/* ===== STATS SECTION ===== */}
        <div className="px-5 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {/* Photos */}
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
                style={{ backgroundColor: darkMode ? 'rgba(255, 121, 198, 0.2)' : 'rgba(255, 107, 107, 0.15)' }}
              >
                <Camera size={18} style={{ color: darkMode ? '#ff79c6' : '#ff6b6b' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {totalPhotos}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Photos
              </div>
            </motion.div>

            {/* Destinations */}
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
                style={{ backgroundColor: darkMode ? 'rgba(189, 147, 249, 0.2)' : 'rgba(102, 126, 234, 0.15)' }}
              >
                <MapPin size={18} style={{ color: darkMode ? '#bd93f9' : '#667eea' }} />
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {uniqueDestinations}
              </div>
              <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Locations
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
              placeholder="Search photos..."
              className={`w-full py-3.5 pl-11 pr-4 bg-transparent text-sm focus:outline-none ${
                darkMode 
                  ? 'text-white placeholder:text-white/40' 
                  : 'text-[#1a1a2e] placeholder:text-[#1a1a2e]/40'
              }`}
            />
          </div>
        </div>

        {/* ===== SORT CONTROL ===== */}
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
              {filteredAndSortedPhotos.length} {filteredAndSortedPhotos.length === 1 ? 'photo' : 'photos'}
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
                            setSortDirection('desc');
                          }
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
                          sortBy === option.value
                            ? darkMode ? 'text-[#ff79c6] bg-white/5' : 'text-[#ff6b6b] bg-black/5'
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

        {/* ===== PHOTO GRID ===== */}
        <div className="px-5">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedPhotos.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-2xl p-10 border text-center ${
                  darkMode ? 'bg-[#1a1a2e]/40 border-white/8' : 'bg-white/50 border-black/5'
                }`}
              >
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: darkMode 
                      ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.2) 0%, rgba(241, 250, 140, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 142, 83, 0.1) 100%)',
                  }}
                >
                  <Image size={36} className={darkMode ? 'text-[#ff79c6]' : 'text-[#ff6b6b]'} />
                </div>
                <h3 
                  className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  No Photos Yet
                </h3>
                <p className={`text-sm mb-5 max-w-xs mx-auto ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  Start capturing your travel memories! Add photos from your trips and destinations.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    darkMode 
                      ? 'bg-[#ff79c6] text-[#0f0f1a] hover:bg-[#ff79c6]/90' 
                      : 'bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/90'
                  }`}
                >
                  <Camera size={18} />
                  Add Your First Photo
                </button>
              </motion.div>
            ) : (
              /* Photo Grid */
              <div className="grid grid-cols-2 gap-3">
                {filteredAndSortedPhotos.map((photo, index) => {
                  const destination = destinations.find(d => d.id === photo.destinationId);
                  const isActive = activePhoto === photo.id;
                  
                  return (
                    <motion.div
                      key={photo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setActivePhoto(isActive ? null : photo.id)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer ${
                        isActive ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{
                        ringColor: darkMode ? '#ff79c6' : '#ff6b6b',
                        aspectRatio: index % 3 === 0 ? '1' : '4/5',
                      }}
                    >
                      {/* Photo Image */}
                      <ImageWithFallback
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Rating Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg flex items-center gap-0.5 text-xs font-medium ${
                        darkMode 
                          ? 'bg-black/50 backdrop-blur-sm text-[#f1fa8c]' 
                          : 'bg-white/90 text-amber-500 shadow-sm'
                      }`}>
                        <Star size={10} className="fill-current" />
                        {typeof photo.rating === 'number' 
                          ? photo.rating.toFixed(1) 
                          : parseFloat(String(photo.rating || 0)).toFixed(1)}
                      </div>

                      {/* Photo Info (always visible at bottom) */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white text-sm font-medium line-clamp-1 mb-0.5">
                          {photo.title || photo.caption || 'Untitled'}
                        </h3>
                        {destination && (
                          <p className="text-white/70 text-xs flex items-center gap-1">
                            <MapPin size={10} />
                            {destination.name}
                          </p>
                        )}
                      </div>

                      {/* Action Overlay (on tap) */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-4"
                          >
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(index);
                                setActivePhoto(null);
                              }}
                              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ZoomIn size={22} className="text-white" />
                            </motion.button>

                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletePhotoId(photo.id);
                                setActivePhoto(null);
                              }}
                              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={22} className="text-red-400" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      <AnimatePresence>
        {lightboxIndex !== null && currentLightboxPhoto && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dark backdrop - clickable to close */}
            <div 
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
              onClick={() => setLightboxIndex(null)}
            />
            
            {/* Centered modal container */}
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                className="max-w-4xl w-full pointer-events-auto relative z-10"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button (top-right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(null);
                  }}
                  className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-colors z-20 cursor-pointer"
                  aria-label="Close"
                >
                  <X size={24} className="text-white" />
                </button>

                {/* Navigation arrows */}
                {filteredAndSortedPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigateLightbox('prev'); 
                      }}
                      className="absolute left-4 sm:left-0 sm:-translate-x-full sm:-ml-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-colors z-20 cursor-pointer"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={24} className="text-white" />
                    </button>

                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigateLightbox('next'); 
                      }}
                      className="absolute right-4 sm:right-0 sm:translate-x-full sm:ml-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-colors z-20 cursor-pointer"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={24} className="text-white" />
                    </button>
                  </>
                )}

                {/* Modal content */}
                <div className={`rounded-2xl overflow-hidden ${
                  darkMode 
                    ? 'bg-[#1a1a2e] border border-white/10' 
                    : 'bg-[#1a1a2e] border border-white/10'
                } shadow-2xl`}>
                  {/* Bordered image */}
                  <div className="relative bg-black/20 p-4 border-b border-white/10">
                    <div className="relative rounded-lg overflow-hidden border-2 border-white/20">
                      <ImageWithFallback
                        src={currentLightboxPhoto.url}
                        alt={currentLightboxPhoto.caption || 'Photo'}
                        className="w-full h-auto block"
                      />
                    </div>
                  </div>

                  {/* Title and metadata row */}
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-white text-xl sm:text-2xl font-bold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {currentLightboxPhoto.title || currentLightboxPhoto.caption || 'Untitled'}
                    </h2>
                    
                    {/* Metadata: Date + Star Rating */}
                    <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar size={16} className="text-white/50" />
                        {formatDate(currentLightboxPhoto.dateAdded) || 'No date'}
                      </span>
                      <span className="flex items-center gap-2">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <span className="font-medium">
                          {typeof currentLightboxPhoto.rating === 'number' 
                            ? currentLightboxPhoto.rating.toFixed(1) 
                            : parseFloat(String(currentLightboxPhoto.rating || 0)).toFixed(1)}
                        </span>
                      </span>
                      {currentLightboxDest && (
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="text-white/50" />
                          {currentLightboxDest.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="p-6 flex flex-col sm:flex-row gap-3">
                    {/* Primary Close button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(null);
                      }}
                      className="flex-1 py-3 px-6 rounded-xl bg-[#00d4ff] text-white font-semibold text-sm hover:bg-[#00b8e6] transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{
                        boxShadow: '0 4px 12px rgba(0, 212, 255, 0.4)',
                      }}
                    >
                      Close
                    </button>
                    
                    {/* Secondary red Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(null);
                        setDeletePhotoId(currentLightboxPhoto.id);
                      }}
                      className="flex-1 py-3 px-6 rounded-xl bg-transparent border-2 border-red-500/50 text-red-400 font-semibold text-sm hover:bg-red-500/10 hover:border-red-500 transition-all duration-200 cursor-pointer"
                    >
                      Delete Photo
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAddPhoto}
        destinations={destinations}
        darkMode={darkMode}
      />

      <DeleteConfirmModal
        isOpen={deletePhotoId !== null}
        onClose={() => setDeletePhotoId(null)}
        onConfirm={handleDeleteConfirm}
        itemName="this photo"
        itemType="photo"
        darkMode={darkMode}
      />
    </div>
  );
}
