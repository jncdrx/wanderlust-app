import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  color?: string;
  onClick?: () => void;
  badge?: string;
}

export function InfoCard({ 
  icon: Icon, 
  title, 
  value, 
  description, 
  color = 'from-teal-400 to-cyan-500',
  onClick,
  badge
}: InfoCardProps) {
  return (
    <GlassCard 
      className={`p-6 ${onClick ? 'cursor-pointer hover:bg-white/30 transition-all hover:scale-[1.02] active:scale-100' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-br ${color} p-3 rounded-2xl shadow-lg`}>
            <Icon className="text-white" size={20} />
          </div>
          <div>
            <p className="text-white">{title}</p>
            {description && <p className="text-white/60 text-sm">{description}</p>}
          </div>
        </div>
        {badge && (
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs border border-white/30">
            {badge}
          </span>
        )}
      </div>
      <p className="text-white text-3xl">{value}</p>
    </GlassCard>
  );
}
