import { useState } from 'react';
import { Calendar, MapPin, Image, ChevronRight, Plane } from 'lucide-react';
import { motion } from 'motion/react';
import { useSession } from '../context/SessionContext';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { darkMode } = useSession();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Calendar,
      title: 'Plan Your Trip',
      description: 'Create detailed itineraries with schedules, destinations, and budgets all in one place.',
      color: darkMode ? 'from-[#8be9fd] to-[#bd93f9]' : 'from-[#4ecdc4] to-[#667eea]',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.1) 0%, rgba(189, 147, 249, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(102, 126, 234, 0.1) 100%)',
    },
    {
      icon: MapPin,
      title: 'Track Destinations',
      description: 'Discover, save, and organize all your favorite travel spots with photos and notes.',
      color: darkMode ? 'from-[#bd93f9] to-[#ff79c6]' : 'from-[#667eea] to-[#ff6b6b]',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(189, 147, 249, 0.1) 0%, rgba(255, 121, 198, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%)',
    },
    {
      icon: Image,
      title: 'Relive Memories',
      description: 'Capture and preserve your travel moments in a beautiful gallery with captions and ratings.',
      color: darkMode ? 'from-[#ff79c6] to-[#8be9fd]' : 'from-[#ff6b6b] to-[#4ecdc4]',
      bgGradient: darkMode 
        ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.1) 0%, rgba(139, 233, 253, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(78, 205, 196, 0.1) 100%)',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-5 relative overflow-hidden ${
        darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'
      }`}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{ background: currentSlideData.bgGradient }}
      />

      {/* Decorative orbs */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: darkMode 
            ? 'radial-gradient(circle, rgba(139, 233, 253, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(78, 205, 196, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: darkMode 
            ? 'radial-gradient(circle, rgba(189, 147, 249, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Skip Button - Top Right */}
        <div className="flex justify-end mb-6">
          <motion.button
            onClick={handleSkip}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              darkMode 
                ? 'text-white/60 hover:text-white hover:bg-white/10' 
                : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-black/5'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
          </motion.button>
        </div>

        {/* Main Card */}
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className={`rounded-3xl p-8 sm:p-10 ${
            darkMode 
              ? 'bg-[#1a1a2e]/80 border border-white/10' 
              : 'bg-white/70 border border-black/5'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: darkMode
              ? '0 20px 50px rgba(0, 0, 0, 0.4)'
              : '0 20px 50px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Logo */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                darkMode 
                  ? 'bg-gradient-to-br from-[#8be9fd] to-[#bd93f9]' 
                  : 'bg-gradient-to-br from-[#4ecdc4] to-[#667eea]'
              }`}
              style={{
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(139, 233, 253, 0.3)' 
                  : '0 8px 32px rgba(78, 205, 196, 0.3)',
              }}
            >
              <Plane size={24} className="text-white" />
            </div>
          </motion.div>

          {/* Icon Illustration */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div 
              className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
                darkMode 
                  ? 'bg-gradient-to-br from-[#8be9fd]/20 to-[#bd93f9]/20' 
                  : 'bg-gradient-to-br from-[#4ecdc4]/20 to-[#667eea]/20'
              }`}
              style={{
                border: `2px solid ${darkMode ? 'rgba(139, 233, 253, 0.3)' : 'rgba(78, 205, 196, 0.3)'}`,
              }}
            >
              <Icon 
                size={48} 
                className={darkMode ? 'text-[#8be9fd]' : 'text-[#4ecdc4]'} 
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className={`text-3xl sm:text-4xl font-bold text-center mb-3 ${
              darkMode ? 'text-white' : 'text-[#1a1a2e]'
            }`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {currentSlideData.title}
          </motion.h1>

          {/* Description */}
          <motion.p 
            className={`text-base sm:text-lg text-center mb-6 ${
              darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {currentSlideData.description}
          </motion.p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-xs font-medium ${
              darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
            }`}>
              {currentSlide + 1} of {slides.length}
            </span>
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? darkMode 
                        ? 'bg-[#8be9fd]' 
                        : 'bg-[#4ecdc4]'
                      : darkMode 
                        ? 'bg-white/20' 
                        : 'bg-black/10'
                  }`}
                  initial={{ width: index === currentSlide ? 24 : 8 }}
                  animate={{ width: index === currentSlide ? 24 : 8 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Skip Button */}
            <motion.button
              onClick={handleSkip}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
                darkMode 
                  ? 'text-white/60 hover:text-white hover:bg-white/10' 
                  : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-black/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Skip
            </motion.button>

            {/* Next/Get Started Button */}
            <motion.button
              onClick={handleNext}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                darkMode 
                  ? 'bg-gradient-to-r from-[#8be9fd] to-[#bd93f9] text-[#0f0f1a]' 
                  : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white'
              }`}
              style={{
                boxShadow: darkMode 
                  ? '0 4px 20px rgba(139, 233, 253, 0.3)' 
                  : '0 4px 20px rgba(78, 205, 196, 0.3)',
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
