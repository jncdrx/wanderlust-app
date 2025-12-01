/**
 * NavFeatureShowcase - Interactive demonstration of BottomNav features
 * This component is for testing/documentation purposes
 */

import { Check, Zap, Sparkles, Eye, Accessibility } from 'lucide-react';

interface NavFeatureShowcaseProps {
  darkMode?: boolean;
}

export function NavFeatureShowcase({ darkMode = false }: NavFeatureShowcaseProps) {
  const features = [
    {
      icon: Zap,
      title: 'Haptic Feedback',
      description: 'Subtle 10ms vibration on tap for tactile response',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      icon: Sparkles,
      title: 'Ripple Animation',
      description: 'Expanding gradient effect from tap point',
      color: 'from-purple-400 to-pink-500',
    },
    {
      icon: Eye,
      title: 'Glassmorphism',
      description: '24px backdrop blur with 180% saturation',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      icon: Accessibility,
      title: 'Accessibility',
      description: 'ARIA labels, keyboard nav, 60px touch targets',
      color: 'from-green-400 to-teal-500',
    },
    {
      icon: Check,
      title: 'Safe Area Support',
      description: 'iOS notch and home indicator spacing',
      color: 'from-teal-400 to-cyan-500',
    },
  ];

  return (
    <div className={`min-h-screen p-6 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500'
    }`}>
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className={`backdrop-blur-xl rounded-3xl p-6 border ${
          darkMode 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white/30 border-white/50'
        }`}>
          <h1 className="text-white mb-2">Enhanced Bottom Navigation</h1>
          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-white/80'}`}>
            A fully responsive, production-ready mobile navigation system with modern interactions
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`backdrop-blur-xl rounded-2xl p-4 border transform transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-slate-800/40 border-slate-700/50' 
                    : 'bg-white/20 border-white/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`mb-1 ${darkMode ? 'text-white' : 'text-white'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-white/80'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Specs */}
        <div className={`backdrop-blur-xl rounded-2xl p-6 border ${
          darkMode 
            ? 'bg-slate-800/40 border-slate-700/50' 
            : 'bg-white/20 border-white/40'
        }`}>
          <h3 className="text-white mb-4">Technical Specifications</h3>
          <div className="space-y-3">
            {[
              { label: 'Viewport Support', value: '320px - 768px' },
              { label: 'Touch Target Height', value: '60px minimum' },
              { label: 'Transition Duration', value: '300ms cubic-bezier' },
              { label: 'Backdrop Blur', value: '24px + saturation' },
              { label: 'Haptic Pulse', value: '10ms vibration' },
              { label: 'Safe Area', value: 'iOS compatible' },
            ].map((spec, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-white/70'}`}>
                  {spec.label}
                </span>
                <span className={`text-xs ${darkMode ? 'text-teal-400' : 'text-white'}`}>
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Indicators */}
        <div className={`backdrop-blur-xl rounded-2xl p-6 border ${
          darkMode 
            ? 'bg-slate-800/40 border-slate-700/50' 
            : 'bg-white/20 border-white/40'
        }`}>
          <h3 className="text-white mb-4">Performance Optimizations</h3>
          <div className="space-y-2">
            {[
              'Hardware-accelerated CSS transforms',
              'RequestAnimationFrame for smooth animations',
              'Debounced tab changes',
              'Minimal re-renders',
              'Progressive enhancement',
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-white/80'}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
