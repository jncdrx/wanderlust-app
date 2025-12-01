import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  darkMode?: boolean;
  animate?: boolean;
  glowColor?: string;
}

export function GlassCard({ 
  children, 
  className = '', 
  onClick, 
  darkMode = false,
  animate = true,
  glowColor = 'teal'
}: GlassCardProps) {
  const glowColors = {
    teal: 'from-teal-400/30 to-cyan-500/30',
    blue: 'from-blue-400/30 to-indigo-500/30',
    purple: 'from-purple-400/30 to-pink-500/30',
    green: 'from-green-400/30 to-emerald-500/30',
    orange: 'from-orange-400/30 to-red-500/30',
  };

  const CardComponent = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    whileHover: { 
      scale: 1.02,
      y: -2,
    },
    whileTap: { scale: 0.98 },
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  } : {};

  return (
    <CardComponent
      onClick={onClick}
      className={`relative backdrop-blur-2xl rounded-3xl border overflow-hidden ${
        darkMode 
          ? 'bg-slate-800/40 border-slate-700/50' 
          : 'bg-white/20 border-white/40'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        boxShadow: darkMode
          ? '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 10px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backdropFilter: 'blur(20px) saturate(180%)',
      }}
      {...animationProps}
    >
      {/* Holographic shimmer effect */}
      {animate && (
        <motion.div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Animated gradient glow on hover */}
      {animate && onClick && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${glowColors[glowColor as keyof typeof glowColors] || glowColors.teal} opacity-0`}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ filter: 'blur(20px)', zIndex: 0 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </CardComponent>
  );
}
