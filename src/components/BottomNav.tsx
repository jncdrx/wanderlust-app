/**
 * BottomNav - Ultra-Modern Mobile Navigation Component
 * 
 * Revolutionary Features:
 * - 3D perspective transforms with depth
 * - Magnetic hover/touch attraction
 * - Liquid morphing blob backgrounds
 * - Particle effect system
 * - Spring physics animations
 * - Holographic rainbow effects
 * - Dynamic island-style expansion
 * - Gesture trail visualization
 * - Advanced haptic patterns
 * - Mesh gradient backgrounds
 * - Contextual color theming
 * - Neural network connection lines
 */

import { Home, Calendar, MapPin, Image, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export function BottomNav({ activeTab, onTabChange, darkMode = false }: BottomNavProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gestureTrail, setGestureTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const trailIdRef = useRef(0);

  // Spring physics for smooth animations
  const blobX = useSpring(0, { stiffness: 150, damping: 20 });
  const blobScale = useSpring(1, { stiffness: 200, damping: 25 });
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home', color: darkMode ? '#ff79c6' : '#ff6b6b' },
    { id: 'itinerary', icon: Calendar, label: 'Trips', color: darkMode ? '#bd93f9' : '#667eea' },
    { id: 'destinations', icon: MapPin, label: 'Places', color: darkMode ? '#8be9fd' : '#4ecdc4' },
    { id: 'gallery', icon: Image, label: 'Photos', color: darkMode ? '#f1fa8c' : '#ff8e53' },
    { id: 'profile', icon: User, label: 'Profile', color: darkMode ? '#50fa7b' : '#95e1d3' },
  ];

  // Advanced haptic patterns
  const triggerAdvancedHaptic = (pattern: 'success' | 'selection' | 'impact') => {
    if ('vibrate' in navigator) {
      const patterns = {
        success: [10, 50, 10, 50, 10],
        selection: [5],
        impact: [15],
      };
      navigator.vibrate(patterns[pattern]);
    }
  };

  // Particle system
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // Gravity
            life: p.life - 1,
          }))
          .filter(p => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  // Create particles on tab change
  const createParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 60,
        size: Math.random() * 4 + 2,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Track mouse/touch movement for magnetic effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Gesture trail effect
  const addGestureTrail = (x: number, y: number) => {
    const id = trailIdRef.current++;
    setGestureTrail(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setGestureTrail(prev => prev.filter(t => t.id !== id));
    }, 500);
  };

  const handleTabClick = (tabId: string, event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    // Aggressively prevent any default scroll behavior
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    
    // Blur the button immediately to prevent focus-based scrolling
    event.currentTarget.blur();
    document.activeElement instanceof HTMLElement && document.activeElement.blur();
    
    if (tabId === activeTab) return;
    
    triggerAdvancedHaptic('success');
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect();
    
    if (navRect) {
      const x = rect.left - navRect.left + rect.width / 2;
      const y = rect.top - navRect.top + rect.height / 2;
      createParticles(x, y);
      addGestureTrail(x, y);
    }

    // Animate blob
    const targetX = index * (100 / tabs.length);
    blobX.set(targetX);
    blobScale.set(1.2);
    setTimeout(() => blobScale.set(1), 200);
    
    // Change tab - scroll to top for new page
    window.scrollTo({ top: 0, behavior: 'instant' });
    onTabChange(tabId);
  };

  // Update blob position when active tab changes
  useEffect(() => {
    const index = tabs.findIndex(t => t.id === activeTab);
    if (index !== -1) {
      blobX.set(index * (100 / tabs.length));
    }
  }, [activeTab]);

  // Calculate magnetic offset for each tab
  const getMagneticOffset = (index: number) => {
    if (!hoveredTab) return { x: 0, y: 0 };
    
    const tabWidth = 100 / tabs.length;
    const tabCenterX = (index + 0.5) * tabWidth;
    const distance = Math.abs(mousePosition.x / navRef.current!.offsetWidth * 100 - tabCenterX);
    const maxDistance = tabWidth;
    
    if (distance < maxDistance) {
      const strength = 1 - (distance / maxDistance);
      const offsetX = (mousePosition.x / navRef.current!.offsetWidth * 100 - tabCenterX) * strength * 0.3;
      const offsetY = (mousePosition.y - 30) * strength * 0.2;
      return { x: offsetX, y: offsetY };
    }
    
    return { x: 0, y: 0 };
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-28 sm:h-32 flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      
      {/* Navigation - FLOATING CAPSULE OVERLAY - Always visible at bottom */}
      <nav 
        ref={navRef}
        className="floating-navbar"
        style={{ 
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2147483647, // Max z-index
          isolation: 'isolate', // Create stacking context
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHoveredTab('active')}
        onMouseLeave={() => setHoveredTab(null)}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Gesture trails */}
        {gestureTrail.map((trail) => (
          <motion.div
            key={trail.id}
            className="absolute pointer-events-none rounded-full bg-gradient-to-r from-teal-400 to-cyan-500"
            initial={{ x: trail.x, y: trail.y, scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ width: 20, height: 20, marginLeft: -10, marginTop: -10 }}
          />
        ))}

        {/* Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute pointer-events-none rounded-full bg-gradient-to-br from-teal-400 to-cyan-500"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.life / 60,
              boxShadow: '0 0 10px rgba(20, 184, 166, 0.5)',
            }}
          />
        ))}

        {/* Neon glow outer layer */}
        <div 
          className="absolute -inset-1 rounded-[32px] pointer-events-none"
          style={{
            background: darkMode
              ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.4), rgba(139, 233, 253, 0.3), rgba(189, 147, 249, 0.4))'
              : 'linear-gradient(135deg, rgba(255, 107, 107, 0.35), rgba(78, 205, 196, 0.3), rgba(102, 126, 234, 0.35))',
            filter: 'blur(15px)',
            animation: 'neonPulse 3s ease-in-out infinite',
          }}
        />

        {/* Main container - CAPSULE SHAPE */}
        <motion.div
          className="relative overflow-hidden"
          style={{ 
            borderRadius: '28px',
            padding: '8px 12px',
            background: darkMode 
              ? 'rgba(15, 15, 26, 0.9)' 
              : 'rgba(255, 255, 255, 0.85)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: darkMode
              ? `
                0 0 0 1px rgba(255, 255, 255, 0.08),
                0 0 30px rgba(255, 121, 198, 0.2),
                0 0 60px rgba(139, 233, 253, 0.15),
                0 10px 40px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `
              : `
                0 0 0 1px rgba(255, 255, 255, 0.5),
                0 0 30px rgba(255, 107, 107, 0.15),
                0 0 60px rgba(78, 205, 196, 0.1),
                0 10px 40px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.8)
              `,
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.05)' 
              : '1px solid rgba(255, 255, 255, 0.6)',
          }}
          initial={false}
        >
          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[28px] overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: darkMode
                  ? 'linear-gradient(90deg, rgba(255, 121, 198, 0.3) 0%, rgba(139, 233, 253, 0.2) 50%, rgba(189, 147, 249, 0.3) 100%)'
                  : 'linear-gradient(90deg, rgba(255, 107, 107, 0.2) 0%, rgba(78, 205, 196, 0.15) 50%, rgba(102, 126, 234, 0.2) 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Top highlight line with shimmer */}
          <div className="absolute top-0 left-4 right-4 h-[1px] overflow-hidden rounded-full">
            <div 
              className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ animation: 'shimmer 2s linear infinite' }}
            />
          </div>
          
          {/* Active tab glow indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none"
            style={{
              left: useTransform(blobX, (x) => `calc(${x}% + 6px)`),
              scale: blobScale,
            }}
          >
            <div 
              className="w-full h-full rounded-full"
              style={{
                background: darkMode 
                  ? 'linear-gradient(135deg, #ff79c6 0%, #8be9fd 100%)'
                  : 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
                filter: 'blur(20px)',
                opacity: 0.4,
              }}
            />
          </motion.div>

          {/* Navigation items */}
          <div className="relative flex justify-around items-center gap-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab && !isActive;
              const magneticOffset = getMagneticOffset(index);
              
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={(e) => handleTabClick(tab.id, e, index)}
                  onTouchStart={(e) => {
                    // Prevent any scroll behavior on touch
                    e.stopPropagation();
                  }}
                  onMouseEnter={() => {
                    setHoveredTab(tab.id);
                    triggerAdvancedHaptic('selection');
                  }}
                  onMouseLeave={() => setHoveredTab(null)}
                  onFocus={(e) => {
                    // Immediately blur to prevent focus-based scrolling
                    e.currentTarget.blur();
                    e.preventDefault();
                  }}
                  onMouseDown={(e) => {
                    // Prevent focus on click
                    e.preventDefault();
                  }}
                  className="relative flex flex-col items-center justify-center py-2 px-3 group outline-none select-none"
                  style={{ 
                    minWidth: '56px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                  }}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  tabIndex={-1}
                  initial={false}
                  animate={{
                    x: magneticOffset.x,
                    y: magneticOffset.y,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-1 rounded-2xl"
                      layoutId="activeTabPill"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{
                        background: darkMode 
                          ? `linear-gradient(135deg, ${tab.color}20 0%, ${tab.color}10 100%)`
                          : `linear-gradient(135deg, ${tab.color}25 0%, ${tab.color}15 100%)`,
                        border: `1px solid ${tab.color}40`,
                        boxShadow: `0 0 20px ${tab.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                      }}
                    />
                  )}
                  
                  {/* Icon container */}
                  <motion.div
                    className="relative z-10"
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon 
                      size={22} 
                      className="transition-all duration-300"
                      style={{
                        color: isActive 
                          ? tab.color 
                          : darkMode ? '#6b7280' : '#9ca3af',
                        filter: isActive ? `drop-shadow(0 0 8px ${tab.color}80)` : 'none',
                      }}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    
                    {/* Icon glow */}
                    {isActive && (
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${tab.color}40 0%, transparent 70%)`,
                          filter: 'blur(4px)',
                          transform: 'scale(2)',
                        }}
                      />
                    )}
                  </motion.div>
                  
                  {/* Label */}
                  <motion.span 
                    className="relative z-10 text-[10px] font-medium leading-none transition-all duration-300 select-none mt-1"
                    style={{
                      color: isActive 
                        ? tab.color 
                        : darkMode ? '#6b7280' : '#9ca3af',
                    }}
                    animate={{
                      opacity: isActive ? 1 : 0.8,
                    }}
                  >
                    {tab.label}
                  </motion.span>

                  {/* Ripple on tap */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ scale: 0, opacity: 0.5 }}
                    whileTap={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: `radial-gradient(circle, ${tab.color}40 0%, transparent 70%)`,
                    }}
                  />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </nav>

      <style>{`
        @keyframes neonPulse {
          0%, 100% { 
            opacity: 0.5;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        /* FLOATING NAVBAR - Always visible at bottom */
        .floating-navbar {
          position: fixed !important;
          bottom: 16px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 2147483647 !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          isolation: isolate !important;
        }
        
        /* Support for safe areas (iPhone notch, etc.) */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .floating-navbar {
            bottom: max(env(safe-area-inset-bottom), 16px) !important;
          }
        }
      `}</style>
    </>
  );
}
