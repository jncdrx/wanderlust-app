/**
 * ModernNavShowcase - Interactive demo of ultra-modern navigation features
 */

import { Sparkles, Zap, Wand2, Layers, Orbit, Palette, Network, Waves } from 'lucide-react';
import { motion } from 'motion/react';

interface ModernNavShowcaseProps {
  darkMode?: boolean;
}

export function ModernNavShowcase({ darkMode = false }: ModernNavShowcaseProps) {
  const revolutionaryFeatures = [
    {
      icon: Layers,
      title: '3D Depth Transforms',
      description: 'Perspective-based 3D rotations and depth layering',
      color: 'from-violet-500 via-purple-500 to-fuchsia-500',
      badge: 'NEW',
    },
    {
      icon: Orbit,
      title: 'Magnetic Hover',
      description: 'Cursor-tracking magnetic attraction effects',
      color: 'from-blue-500 via-cyan-500 to-teal-500',
      badge: 'INTERACTIVE',
    },
    {
      icon: Wand2,
      title: 'Liquid Morphing',
      description: 'Organic blob animations with spring physics',
      color: 'from-pink-500 via-rose-500 to-red-500',
      badge: 'FLUID',
    },
    {
      icon: Sparkles,
      title: 'Particle System',
      description: 'Physics-based particle explosions on interaction',
      color: 'from-amber-500 via-orange-500 to-red-500',
      badge: 'DYNAMIC',
    },
    {
      icon: Zap,
      title: 'Advanced Haptics',
      description: 'Multi-pattern vibration feedback sequences',
      color: 'from-yellow-500 via-lime-500 to-green-500',
      badge: 'TACTILE',
    },
    {
      icon: Palette,
      title: 'Holographic Effects',
      description: 'Animated rainbow gradients and iridescent layers',
      color: 'from-indigo-500 via-purple-500 to-pink-500',
      badge: 'PRISMATIC',
    },
    {
      icon: Network,
      title: 'Neural Connections',
      description: 'Animated connection lines between elements',
      color: 'from-emerald-500 via-teal-500 to-cyan-500',
      badge: 'CONNECTED',
    },
    {
      icon: Waves,
      title: 'Gesture Trails',
      description: 'Visual feedback trails following touch movement',
      color: 'from-sky-500 via-blue-500 to-indigo-500',
      badge: 'GESTURAL',
    },
  ];

  const technicalSpecs = [
    { label: 'Animation Engine', value: 'Framer Motion', highlight: true },
    { label: 'Physics System', value: 'Spring-based', highlight: true },
    { label: 'Particle Count', value: '15 per interaction', highlight: false },
    { label: 'Haptic Patterns', value: '3 unique types', highlight: false },
    { label: '3D Perspective', value: '1000px depth', highlight: false },
    { label: 'Blur Intensity', value: '30px saturated', highlight: false },
    { label: 'Magnetic Range', value: 'Dynamic tracking', highlight: true },
    { label: 'Color Modes', value: '5 contextual gradients', highlight: false },
  ];

  return (
    <div className={`min-h-screen p-6 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500'
    }`}>
      <div className="max-w-md mx-auto space-y-6 pb-32">
        {/* Hero Header */}
        <motion.div 
          className={`relative backdrop-blur-2xl rounded-3xl p-8 border overflow-hidden ${
            darkMode 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-white/30 border-white/50'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated background gradient */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #4facfe)',
              backgroundSize: '400% 400%',
              animation: 'gradient-shift 15s ease infinite',
            }}
          />
          
          <div className="relative z-10">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={14} className="text-white" />
              <span className="text-white text-xs">Ultra-Modern Navigation</span>
            </motion.div>
            
            <h1 className={`text-white mb-3 ${darkMode ? 'neon-text' : ''}`}>
              Next-Gen Mobile Nav
            </h1>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-white/90'}`}>
              Revolutionary navigation system featuring 3D transforms, physics-based animations, 
              particle effects, and magnetic interactions.
            </p>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-4">
          {revolutionaryFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className={`relative backdrop-blur-xl rounded-2xl p-5 border group cursor-pointer overflow-hidden ${
                  darkMode 
                    ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' 
                    : 'bg-white/20 border-white/40 hover:bg-white/30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Holographic shimmer on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer-wave 2s ease-in-out infinite',
                  }}
                />

                <div className="relative z-10 flex items-start gap-4">
                  {/* Icon with 3D effect */}
                  <motion.div 
                    className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} flex-shrink-0 shadow-lg`}
                    whileHover={{ rotateY: 180, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <Icon size={20} className="text-white" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`${darkMode ? 'text-white' : 'text-white'}`}>
                        {feature.title}
                      </h3>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full bg-gradient-to-r ${feature.color} text-white`}>
                        {feature.badge}
                      </span>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-white/80'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Particle effect on hover */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-teal-400"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ 
                    scale: [0, 20, 0],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Technical Specifications */}
        <motion.div 
          className={`backdrop-blur-xl rounded-2xl p-6 border ${
            darkMode 
              ? 'bg-slate-800/40 border-slate-700/50' 
              : 'bg-white/20 border-white/40'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-white mb-4 flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              ⚙️
            </motion.div>
            Technical Specifications
          </h3>
          <div className="space-y-3">
            {technicalSpecs.map((spec, index) => (
              <motion.div 
                key={index} 
                className="flex justify-between items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.05 }}
              >
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-white/70'}`}>
                  {spec.label}
                </span>
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  spec.highlight
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                    : darkMode 
                      ? 'text-teal-400 bg-teal-400/10' 
                      : 'text-white bg-white/20'
                }`}>
                  {spec.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Animation Examples */}
        <motion.div 
          className={`backdrop-blur-xl rounded-2xl p-6 border ${
            darkMode 
              ? 'bg-slate-800/40 border-slate-700/50' 
              : 'bg-white/20 border-white/40'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <h3 className="text-white mb-4">Live Animation Demos</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Liquid Morph */}
            <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl liquid-morph opacity-60" />
            
            {/* Floating Element */}
            <div className="aspect-square bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl animate-float opacity-60" />
            
            {/* Pulsing Glow */}
            <div 
              className="aspect-square bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl opacity-60"
              style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
            />
            
            {/* Rotating Perspective */}
            <div 
              className="aspect-square bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl opacity-60"
              style={{ animation: 'perspective-rotate 10s linear infinite' }}
            />
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div 
          className={`backdrop-blur-xl rounded-2xl p-6 border ${
            darkMode 
              ? 'bg-slate-800/40 border-slate-700/50' 
              : 'bg-white/20 border-white/40'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-white mb-4">Performance Optimizations</h3>
          <div className="space-y-2">
            {[
              { label: 'GPU Acceleration', value: 100, color: 'from-green-500 to-emerald-500' },
              { label: 'Animation Smoothness', value: 95, color: 'from-blue-500 to-cyan-500' },
              { label: 'Touch Response', value: 98, color: 'from-purple-500 to-pink-500' },
              { label: 'Memory Efficiency', value: 92, color: 'from-orange-500 to-red-500' },
            ].map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-white/80'}`}>
                    {metric.label}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-teal-400' : 'text-white'}`}>
                    {metric.value}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  darkMode ? 'bg-slate-700/50' : 'bg-white/20'
                }`}>
                  <motion.div
                    className={`h-full bg-gradient-to-r ${metric.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: 1.3 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-white/70'}`}>
            Experience the future of mobile navigation
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-white/60'}`}>
            Try tapping the navigation below ⬇️
          </p>
        </motion.div>
      </div>
    </div>
  );
}
