import { GlassCard } from './GlassCard';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'grid' | 'stat';
  count?: number;
}

export function SkeletonLoader({ type = 'card', count = 3 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <GlassCard className="p-4 animate-pulse">
            <div className="bg-white/10 h-40 rounded-2xl mb-3"></div>
            <div className="bg-white/10 h-4 rounded-full mb-2 w-3/4"></div>
            <div className="bg-white/10 h-3 rounded-full w-1/2"></div>
          </GlassCard>
        );
      
      case 'list':
        return (
          <GlassCard className="p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="bg-white/10 w-20 h-20 rounded-2xl flex-shrink-0"></div>
              <div className="flex-1">
                <div className="bg-white/10 h-4 rounded-full mb-2 w-3/4"></div>
                <div className="bg-white/10 h-3 rounded-full w-1/2"></div>
              </div>
            </div>
          </GlassCard>
        );
      
      case 'grid':
        return (
          <GlassCard className="p-4 animate-pulse aspect-square">
            <div className="bg-white/10 h-full rounded-2xl"></div>
          </GlassCard>
        );
      
      case 'stat':
        return (
          <GlassCard className="p-5 animate-pulse">
            <div className="bg-white/10 w-12 h-12 rounded-2xl mb-3"></div>
            <div className="bg-white/10 h-3 rounded-full mb-2 w-1/2"></div>
            <div className="bg-white/10 h-6 rounded-full w-3/4 mb-2"></div>
            <div className="bg-white/10 h-3 rounded-full w-2/3"></div>
          </GlassCard>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}
