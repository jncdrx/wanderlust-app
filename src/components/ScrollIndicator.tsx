import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function ScrollIndicator() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const progressPercent = Number.isFinite(scrollProgress) ? `${scrollProgress}%` : '0%';

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Calculate scroll progress
      const windowHeight = window.innerHeight || 0;
      const documentHeight = document.documentElement?.scrollHeight ?? 0;
      const scrollTop = window.scrollY || 0;
      const scrollableDistance = Math.max(documentHeight - windowHeight, 1);
      const rawProgress = (scrollTop / scrollableDistance) * 100;
      const safeProgress = Number.isFinite(rawProgress)
        ? Math.min(100, Math.max(0, rawProgress))
        : 0;

      setScrollProgress(safeProgress);
      setIsScrolling(true);
      setShowIndicator(true);

      // Hide indicator after scrolling stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        setTimeout(() => setShowIndicator(false), 300);
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {showIndicator && (
        <>
          {/* Scroll progress bar - top */}
          <motion.div
            className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isScrolling ? 1 : 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
              style={{ 
                width: progressPercent,
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
              }}
              initial={{ width: 0 }}
              animate={{ width: progressPercent }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Scroll indicator - right side */}
          <motion.div
            className="fixed right-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isScrolling ? 1 : 0.5, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative w-1.5 h-32 bg-white/10 rounded-full backdrop-blur-md overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-500 rounded-full"
                style={{ 
                  height: progressPercent,
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                }}
                animate={{ height: progressPercent }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              />
              
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-cyan-400/30 via-blue-500/30 to-purple-500/30 rounded-full blur-sm"
                animate={{ 
                  opacity: isScrolling ? [0.5, 1, 0.5] : 0.3,
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </motion.div>

          {/* Percentage indicator */}
          {isScrolling && scrollProgress > 5 && (
            <motion.div
              className="fixed right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/90 to-blue-500/90 backdrop-blur-xl rounded-full border border-white/30 shadow-lg">
                <span className="text-white text-xs">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
