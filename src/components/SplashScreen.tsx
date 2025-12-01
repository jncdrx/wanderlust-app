import { Plane, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useSession } from '../context/SessionContext';

interface SplashScreenProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { darkMode } = useSession();
  const [progress, setProgress] = useState(0);
  const [particles] = useState<Particle[]>(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 5 + 10,
    }))
  );

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Complete after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between p-6 relative overflow-hidden ${
      darkMode 
        ? 'bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a]' 
        : 'bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500'
    }`}>
      {/* Animated mesh gradient background */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{
          background: darkMode
            ? 'radial-gradient(circle at 30% 50%, rgba(139, 233, 253, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(189, 147, 249, 0.2) 0%, transparent 50%)'
            : 'radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${darkMode ? 'bg-white/10' : 'bg-white/20'}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Decorative orbs */}
      <motion.div 
        className={`absolute top-1/4 -left-20 w-96 h-96 rounded-full ${
          darkMode ? 'bg-[#8be9fd]/10' : 'bg-white/15'
        }`}
        animate={{
          scale: [1, 1.4, 1],
          x: [0, 40, 0],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(60px)' }}
      />
      <motion.div 
        className={`absolute bottom-1/4 -right-20 w-[32rem] h-[32rem] rounded-full ${
          darkMode ? 'bg-[#bd93f9]/10' : 'bg-purple-400/15'
        }`}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -25, 0],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(80px)' }}
      />

      {/* Brand Mark - Top */}
      <motion.div 
        className="w-full flex justify-center pt-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={`flex items-center gap-2 ${
          darkMode ? 'text-white/40' : 'text-white/60'
        }`}>
          <Plane size={16} />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Wanderlust
          </span>
        </div>
      </motion.div>

      {/* Main content - Centered */}
      <div className="relative z-10 flex flex-col items-center gap-6 flex-1 justify-center -mt-16">
        {/* Logo with softer effects */}
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            duration: 1,
          }}
        >
          <div className="relative">
            {/* Softer outer glow */}
            <motion.div 
              className={`absolute inset-0 rounded-full ${
                darkMode ? 'bg-[#8be9fd]/20' : 'bg-white/25'
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ filter: 'blur(30px)' }}
            />

            {/* Logo container - Softer shadow */}
            <motion.div 
              className={`relative backdrop-blur-2xl p-8 rounded-full border ${
                darkMode 
                  ? 'bg-[#1a1a2e]/60 border-white/20' 
                  : 'bg-white/20 border-white/30'
              }`}
              animate={{
                y: [0, -15, 0],
                rotateY: [0, 360],
              }}
              transition={{
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                rotateY: {
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
              style={{
                transformStyle: 'preserve-3d',
                boxShadow: darkMode
                  ? '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 15px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <Plane size={56} className="text-white" strokeWidth={1.5} />
              </motion.div>

              {/* Orbiting sparkles */}
              {[0, 120, 240].map((angle, index) => (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    rotate: [angle, angle + 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.3,
                  }}
                >
                  <motion.div
                    style={{
                      x: 50,
                      y: -10,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  >
                    <Sparkles size={14} className="text-white" />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Softer holographic ring */}
            <motion.div
              className={`absolute inset-0 rounded-full border ${
                darkMode ? 'border-white/15' : 'border-white/20'
              }`}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </div>
        </motion.div>
        
        {/* Brand name with letter animation */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.h1 
            className={`text-4xl sm:text-5xl tracking-wide mb-2 ${
              darkMode ? 'text-white' : 'text-white'
            }`}
            style={{
              fontFamily: "'Outfit', sans-serif",
              textShadow: darkMode
                ? '0 0 20px rgba(139, 233, 253, 0.3)'
                : '0 0 30px rgba(255, 255, 255, 0.4), 0 0 60px rgba(20, 184, 166, 0.2)',
            }}
          >
            {'Wanderlust'.split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.7 + index * 0.04,
                  duration: 0.5,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p 
            className={`text-sm tracking-wider ${
              darkMode ? 'text-white/70' : 'text-white/85'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Your Journey Begins Here
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-64"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          {/* Progress track */}
          <div className={`h-1.5 rounded-full overflow-hidden backdrop-blur-sm ${
            darkMode ? 'bg-white/10' : 'bg-white/20'
          }`}>
            <motion.div
              className={`h-full rounded-full relative ${
                darkMode 
                  ? 'bg-gradient-to-r from-[#8be9fd] to-[#bd93f9]' 
                  : 'bg-gradient-to-r from-white to-teal-300'
              }`}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </div>
          
          {/* Progress percentage */}
          <motion.p 
            className={`text-xs text-center mt-3 ${
              darkMode ? 'text-white/50' : 'text-white/70'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Loading {progress}%
          </motion.p>
        </motion.div>

        {/* Loading dots */}
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={`w-2.5 h-2.5 rounded-full ${
                darkMode ? 'bg-white/40' : 'bg-white'
              }`}
              animate={{
                y: [0, -12, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Brand Mark - Bottom */}
      <motion.div 
        className="w-full flex justify-center pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <div className={`flex items-center gap-2 ${
          darkMode ? 'text-white/30' : 'text-white/50'
        }`}>
          <span className="text-xs font-medium">
            © 2024 Wanderlust
          </span>
        </div>
      </motion.div>
    </div>
  );
}
