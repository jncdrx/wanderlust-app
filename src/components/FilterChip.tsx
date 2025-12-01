import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  count?: number;
}

export function FilterChip({ label, active = false, onClick, onRemove, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
        active
          ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/50'
          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`${
          active ? 'bg-white/30' : 'bg-white/20'
        } px-2 py-0.5 rounded-full text-xs`}>
          {count}
        </span>
      )}
      {active && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-white/20 rounded-full p-0.5 transition-all"
        >
          <X size={14} />
        </button>
      )}
    </button>
  );
}
