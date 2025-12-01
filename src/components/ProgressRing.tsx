import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface ProgressRingProps {
  progress: number; // 0-100
  maxProgress: number;
  isEarned: boolean;
  color?: string;
  title?: string;
  description?: string;
  darkMode?: boolean;
}

export function ProgressRing({ 
  progress, 
  maxProgress,
  isEarned,
  color,
  title,
  description,
  darkMode = false 
}: ProgressRingProps) {
  // Responsive size: 80px on desktop, 60px on mobile
  const strokeWidth = 6;
  // Use viewBox for responsive SVG
  const viewBoxSize = 80;
  const radius = (viewBoxSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = maxProgress > 0 ? Math.min((progress / maxProgress) * 100, 100) : 0;
  const offset = circumference - (progressPercentage / 100) * circumference;
  
  // Color logic: gold for earned, muted/grayscale for locked
  const ringColor = isEarned 
    ? '#f59e0b' // gold - full color, no desaturation
    : (darkMode ? '#475569' : '#94a3b8'); // muted grayscale for locked (desaturated)
  const bgColor = darkMode 
    ? (isEarned ? 'rgba(245, 158, 11, 0.2)' : 'rgba(71, 85, 105, 0.15)')
    : (isEarned ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.15)');
  const opacity = isEarned ? 1.0 : 0.5; // Full opacity for earned, reduced for locked

  return (
    <div className="relative flex flex-col items-center w-16 h-16 md:w-20 md:h-20">
      <svg 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
        className="transform -rotate-90 w-full h-full" 
        style={{ opacity }}
      >
        {/* Background circle */}
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isEarned ? (
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-1">
            <CheckCircle2 size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
        ) : (
          <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {Math.round(progressPercentage)}%
          </span>
        )}
      </div>
      {/* Earned badge in top-right corner */}
      {isEarned && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-[#0f0f1a] text-[10px] font-bold">✓</span>
        </div>
      )}
    </div>
  );
}
