interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  color = 'from-teal-400 to-cyan-500',
  height = 'md'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3',
  };
  
  const isOverLimit = value > max;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <p className="text-white/80 text-sm">{label}</p>}
          {showPercentage && (
            <p className={`text-sm ${isOverLimit ? 'text-red-400' : 'text-white'}`}>
              {Math.round(percentage)}%
            </p>
          )}
        </div>
      )}
      <div className={`w-full bg-white/20 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${heightClasses[height]} bg-gradient-to-r ${isOverLimit ? 'from-red-400 to-orange-500' : color} rounded-full transition-all duration-500 shadow-lg`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
