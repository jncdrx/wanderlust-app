import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { motion } from 'motion/react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  onClick?: () => void;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  darkMode?: boolean;
  index?: number;
}

export function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color = 'from-teal-400 to-cyan-500',
  onClick,
  trend,
  trendValue,
  darkMode = false,
  index = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{ 
        y: -8,
        scale: 1.03,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className={`relative backdrop-blur-2xl rounded-3xl p-5 border overflow-hidden ${
          darkMode 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white/30 border-white/50'
        } ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        style={{
          boxShadow: darkMode
            ? '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 10px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0`}
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Holographic shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: 'linear',
            delay: index * 0.5,
          }}
          style={{ transform: 'skewX(-15deg)' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon with 3D effect */}
          <motion.div 
            className={`bg-gradient-to-br ${color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-xl relative`}
            whileHover={{ 
              rotateY: 180,
              scale: 1.1,
            }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Icon size={24} className="text-white" />
            
            {/* Glow effect */}
            <motion.div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} blur-lg opacity-60`}
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Label */}
          <p className="text-white/70 text-xs mb-2 tracking-wide uppercase">
            {label}
          </p>

          {/* Value with animation */}
          <div className="flex items-baseline gap-2 mb-2">
            <motion.p 
              className="text-white text-3xl tracking-tight"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: index * 0.1 + 0.3,
                type: 'spring',
                stiffness: 200,
              }}
            >
              {value}
            </motion.p>
            
            {trend && trendValue && (
              <motion.span 
                className={`text-xs px-2 py-1 rounded-full ${
                  trend === 'up' 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : trend === 'down' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                      : 'bg-white/10 text-white/60 border border-white/20'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
              </motion.span>
            )}
          </div>

          {/* Sub value */}
          {subValue && (
            <motion.p 
              className="text-white/50 text-xs leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.6 }}
            >
              {subValue}
            </motion.p>
          )}
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full" />
      </div>
    </motion.div>
  );
}
