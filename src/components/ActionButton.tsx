import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false
}: ActionButtonProps) {
  const baseClasses = 'rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white shadow-xl shadow-teal-500/40 hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-105 active:scale-95',
    secondary: 'bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/30',
    danger: 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white shadow-xl shadow-red-500/40 hover:shadow-2xl hover:shadow-red-500/50 hover:scale-105 active:scale-95',
    success: 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 active:scale-95',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-6 py-3 text-lg',
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      {Icon && <Icon size={iconSizes[size]} strokeWidth={2.5} />}
      <span>{label}</span>
    </button>
  );
}
