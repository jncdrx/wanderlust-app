import { Calendar, MapPin, DollarSign, Bell, Settings, Camera, Plus, ArrowRight, Plane, Image, Compass, Mountain, Globe, ChevronRight, BarChart3 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Trip, Destination, Photo } from '../types/travel';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface DashboardProps {
  userType: 'user';
  userName: string;
  currentUser?: any;
  onNavigate: (screen: string) => void;
  trips: Trip[];
  destinations: Destination[];
  photos?: Photo[];
  darkMode?: boolean;
}

export function Dashboard({ 
  userType, 
  userName, 
  currentUser,
  onNavigate, 
  trips, 
  destinations, 
  photos = [], 
  darkMode = false 
}: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const upcomingTrips = trips.filter(trip => trip.status === 'upcoming').slice(0, 2);
  const totalDestinations = destinations.length;
  const visitedDestinations = destinations.filter(d => d.visited).length;
  const completedTrips = trips.filter(trip => trip.status === 'completed').length;
  const photoLocations = new Set(photos.map(p => p.destinationId)).size;

  const recentPhotos = photos.slice(-4).reverse();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFirstName = () => {
    if (currentUser?.firstName) return currentUser.firstName;
    const name = userName.split(' ')[0];
    return name || 'Traveler';
  };

  // Format numbers with proper pluralization
  const formatPlural = (count: number, singular: string, plural: string) => {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
  };

  // Stats data
  const statsRow1 = [
    {
      icon: MapPin,
      label: 'Destinations',
      value: totalDestinations,
      subLabel: `${visitedDestinations} Visited`,
      color: darkMode ? '#8be9fd' : '#4ecdc4',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.15) 0%, rgba(80, 250, 123, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(69, 183, 209, 0.15) 100%)',
      onClick: () => onNavigate('destinations'),
    },
    {
      icon: Calendar,
      label: 'Trips',
      value: trips.length,
      subLabel: formatPlural(upcomingTrips.length, 'Upcoming', 'Upcoming'),
      color: darkMode ? '#bd93f9' : '#667eea',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(189, 147, 249, 0.15) 0%, rgba(255, 121, 198, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.15) 100%)',
      onClick: () => onNavigate('itinerary'),
    },
  ];

  const statsRow2 = [
    {
      icon: Camera,
      label: 'Photos',
      value: photos.length,
      subLabel: formatPlural(photoLocations, 'Location', 'Locations'),
      color: darkMode ? '#ff79c6' : '#ff6b6b',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.15) 0%, rgba(241, 250, 140, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 142, 83, 0.15) 100%)',
      onClick: () => onNavigate('gallery'),
    },
    {
      icon: Globe,
      label: 'Countries',
      value: completedTrips,
      subLabel: 'Explored',
      color: darkMode ? '#50fa7b' : '#95e1d3',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(80, 250, 123, 0.15) 0%, rgba(139, 233, 253, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(149, 225, 211, 0.2) 0%, rgba(78, 205, 196, 0.15) 100%)',
      onClick: () => onNavigate('reports'),
    },
  ];

  // Trip card icons based on destination name
  const getTripIcon = (destination: string) => {
    const lower = destination.toLowerCase();
    if (lower.includes('beach') || lower.includes('island') || lower.includes('resort')) return '🏝️';
    if (lower.includes('mountain') || lower.includes('hiking') || lower.includes('trek')) return '🏔️';
    if (lower.includes('city') || lower.includes('tokyo') || lower.includes('paris') || lower.includes('new york')) return '🌆';
    if (lower.includes('forest') || lower.includes('nature') || lower.includes('park')) return '🌲';
    return '✈️';
  };

  return (
    <div className={`min-h-screen pb-32 sm:pb-24 relative overflow-hidden ${
      darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'
    }`}>
      {/* Subtle gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(180deg, rgba(255, 121, 198, 0.08) 0%, rgba(139, 233, 253, 0.05) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255, 107, 107, 0.1) 0%, rgba(78, 205, 196, 0.08) 50%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* ===== HEADER SECTION ===== */}
        <div className={`px-5 pt-12 pb-6 ${darkMode ? '' : ''}`}>
          <div className="flex items-start justify-between">
            {/* Greeting & Brand */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              {/* Brand Mark */}
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: darkMode 
                      ? 'linear-gradient(135deg, #ff79c6 0%, #bd93f9 100%)'
                      : 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                  }}
                >
                  <Compass size={18} className="text-white" />
                </div>
                <span 
                  className={`text-xs font-medium tracking-wide uppercase ${
                    darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
                  }`}
                >
                  Wanderlust
                </span>
              </div>

              {/* Greeting with Profile Photo */}
              <div className="flex items-center gap-3 mb-1">
                {/* Profile Photo or Avatar */}
                {currentUser?.profilePhoto ? (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2"
                    style={{
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <img 
                      src={currentUser.profilePhoto} 
                      alt={getFirstName()}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const initials = getFirstName().charAt(0).toUpperCase();
                          parent.innerHTML = `<span class="text-white text-lg font-bold" style="font-family: 'Outfit', sans-serif">${initials}</span>`;
                          parent.style.background = darkMode 
                            ? 'linear-gradient(135deg, #50fa7b 0%, #8be9fd 100%)'
                            : 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                    style={{
                      background: darkMode 
                        ? 'linear-gradient(135deg, #50fa7b 0%, #8be9fd 100%)'
                        : 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <span className="text-white text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {getFirstName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h1 
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      darkMode ? 'text-white' : 'text-[#1a1a2e]'
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {getGreeting()}, {getFirstName()}
                  </h1>
                </div>
              </div>
              <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                Here's your travel summary
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.button 
                onClick={() => onNavigate('reports')}
                className={`p-3 rounded-xl border transition-colors ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white border-black/5 shadow-sm hover:shadow-md'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Reports & Insights"
                title="Reports & Insights"
              >
                <BarChart3 size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
              </motion.button>
              
              <motion.button 
                onClick={() => onNavigate('profile')}
                className={`p-3 rounded-xl border transition-colors ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white border-black/5 shadow-sm hover:shadow-md'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={18} className={darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'} />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* ===== STATS SECTION ===== */}
        <div className="px-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* First Row - 2 cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {statsRow1.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.button
                    key={stat.label}
                    onClick={stat.onClick}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 hover:border-white/15' 
                        : 'bg-white border-black/5 shadow-sm hover:shadow-lg'
                    }`}
                    style={{ background: stat.bgGradient }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    {/* Icon */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ 
                        backgroundColor: `${stat.color}20`,
                      }}
                    >
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    
                    {/* Value */}
                    <div 
                      className={`text-3xl font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                      {stat.label}
                    </div>
                    
                    {/* Sub-label */}
                    <div 
                      className="text-xs mt-1 font-medium"
                      style={{ color: stat.color }}
                    >
                      {stat.subLabel}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Second Row - 2 cards */}
            <div className="grid grid-cols-2 gap-3">
              {statsRow2.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.button
                    key={stat.label}
                    onClick={stat.onClick}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8 hover:border-white/15' 
                        : 'bg-white border-black/5 shadow-sm hover:shadow-lg'
                    }`}
                    style={{ background: stat.bgGradient }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {/* Icon */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ 
                        backgroundColor: `${stat.color}20`,
                      }}
                    >
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    
                    {/* Value */}
                    <div 
                      className={`text-3xl font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className={`text-sm font-medium ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                      {stat.label}
                    </div>
                    
                    {/* Sub-label */}
                    <div 
                      className="text-xs mt-1 font-medium"
                      style={{ color: stat.color }}
                    >
                      {stat.subLabel}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ===== UPCOMING TRIPS SECTION ===== */}
        <div className="px-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 
                className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Upcoming Trips
              </h2>
              <button
                onClick={() => onNavigate('itinerary')}
                className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                  darkMode ? 'text-[#8be9fd] hover:text-[#8be9fd]/80' : 'text-[#667eea] hover:text-[#667eea]/80'
                }`}
              >
                View All
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Trip Cards */}
            {upcomingTrips.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className={`rounded-2xl border overflow-hidden ${
                      darkMode 
                        ? 'bg-[#1a1a2e]/60 border-white/8' 
                        : 'bg-white border-black/5 shadow-sm'
                    }`}
                  >
                    <div className="flex">
                      {/* Trip Thumbnail/Icon */}
                      <div 
                        className="w-24 h-full min-h-[120px] flex items-center justify-center text-4xl"
                        style={{
                          background: darkMode 
                            ? 'linear-gradient(135deg, rgba(189, 147, 249, 0.2) 0%, rgba(139, 233, 253, 0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(78, 205, 196, 0.1) 100%)',
                        }}
                      >
                        {trip.image ? (
                          <ImageWithFallback
                            src={trip.image}
                            alt={trip.destination}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getTripIcon(trip.destination)
                        )}
                      </div>

                      {/* Trip Details */}
                      <div className="flex-1 p-4">
                        {/* Title */}
                        <h3 
                          className={`font-semibold text-base mb-1 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                          style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                          {trip.destination}
                        </h3>

                        {/* Date + Status */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                            {trip.dates}
                          </span>
                          <span 
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              darkMode 
                                ? 'bg-[#8be9fd]/20 text-[#8be9fd]' 
                                : 'bg-[#4ecdc4]/20 text-[#4ecdc4]'
                            }`}
                          >
                            Upcoming
                          </span>
                        </div>

                        {/* Budget */}
                        <div className={`text-sm font-medium mb-3 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                          <span className={darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}>Budget: </span>
                          <span style={{ color: darkMode ? '#50fa7b' : '#2d8a7e' }}>{trip.budget}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('itinerary');
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                              darkMode 
                                ? 'bg-[#bd93f9] text-[#0f0f1a] hover:bg-[#bd93f9]/90' 
                                : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
                            }`}
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <Plane size={14} />
                              View Trip
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('destinations');
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                              darkMode 
                                ? 'bg-white/10 text-white hover:bg-white/15' 
                                : 'bg-[#1a1a2e]/5 text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/10'
                            }`}
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <Compass size={14} />
                              Explore
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-2xl border p-8 text-center ${
                  darkMode 
                    ? 'bg-[#1a1a2e]/40 border-white/8' 
                    : 'bg-white/50 border-black/5'
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
                  No Upcoming Trips
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  Start planning your next adventure!
                </p>
                <button
                  onClick={() => onNavigate('itinerary')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    darkMode 
                      ? 'bg-[#bd93f9] text-[#0f0f1a] hover:bg-[#bd93f9]/90' 
                      : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
                  }`}
                >
                  <Plus size={16} />
                  Plan a Trip
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ===== RECENT PHOTOS SECTION ===== */}
        {recentPhotos.length > 0 && (
          <div className="px-5 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 
                  className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Recent Photos
                </h2>
                <button
                  onClick={() => onNavigate('gallery')}
                  className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                    darkMode ? 'text-[#ff79c6] hover:text-[#ff79c6]/80' : 'text-[#ff6b6b] hover:text-[#ff6b6b]/80'
                  }`}
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-4 gap-2">
                {recentPhotos.map((photo, index) => (
                  <motion.button
                    key={photo.id}
                    onClick={() => onNavigate('gallery')}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative aspect-square rounded-xl overflow-hidden"
                  >
                    <ImageWithFallback
                      src={photo.url}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ===== QUICK ACTIONS SECTION ===== */}
        <div className="px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {/* Section Header */}
            <h2 
              className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Quick Actions
            </h2>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => onNavigate('itinerary')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  darkMode 
                    ? 'bg-[#1a1a2e]/60 border-white/8 hover:border-[#bd93f9]/50' 
                    : 'bg-white border-black/5 shadow-sm hover:shadow-lg hover:border-[#667eea]/30'
                }`}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: darkMode 
                      ? 'linear-gradient(135deg, #bd93f9 0%, #ff79c6 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <Plus size={24} className="text-white" />
                </div>
                <div 
                  className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Plan Trip
                </div>
                <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  Create a new itinerary
                </div>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('destinations')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  darkMode 
                    ? 'bg-[#1a1a2e]/60 border-white/8 hover:border-[#8be9fd]/50' 
                    : 'bg-white border-black/5 shadow-sm hover:shadow-lg hover:border-[#4ecdc4]/30'
                }`}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: darkMode 
                      ? 'linear-gradient(135deg, #8be9fd 0%, #50fa7b 100%)'
                      : 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
                  }}
                >
                  <MapPin size={24} className="text-white" />
                </div>
                <div 
                  className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Explore
                </div>
                <div className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                  Discover new places
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
