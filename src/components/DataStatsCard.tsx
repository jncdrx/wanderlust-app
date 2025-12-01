import { GlassCard } from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  gradientColors?: string;
  onClick?: () => void;
  darkMode?: boolean;
}

export function DataStatsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  gradientColors = 'from-teal-400 to-cyan-500',
  onClick,
  darkMode = false,
}: DataStatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <GlassCard
      className={`p-5 ${onClick ? 'cursor-pointer hover:bg-white/30 transition-all hover:scale-105 active:scale-95' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-white/80 text-sm mb-1">{title}</p>
          <p className="text-white text-3xl mb-1">{value}</p>
          {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`bg-gradient-to-br ${gradientColors} w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20`}>
            <Icon className="text-white" size={22} />
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1.5 text-xs ${
          trend === 'up' ? 'text-green-400' : 
          trend === 'down' ? 'text-red-400' : 
          'text-white/60'
        }`}>
          <TrendIcon size={14} />
          <span>{trendValue}</span>
        </div>
      )}
    </GlassCard>
  );
}
