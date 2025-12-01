import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  darkMode?: boolean;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  darkMode = false 
}: EmptyStateProps) {
  return (
    <div className={`rounded-2xl border p-8 text-center ${
      darkMode
        ? 'bg-[#1a1a2e]/60 border-white/10'
        : 'bg-white border-black/5 shadow-sm'
    }`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className={`p-4 rounded-full mb-4 ${
          darkMode ? 'bg-white/10' : 'bg-black/5'
        }`}>
          <Icon className={darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'} size={48} />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
          {title}
        </h3>
        {description && (
          <p className={`text-sm mb-4 ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <motion.button
            onClick={onAction}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              darkMode
                ? 'bg-[#8be9fd] text-[#0f0f1a] hover:bg-[#8be9fd]/90'
                : 'bg-[#667eea] text-white hover:bg-[#667eea]/90'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {actionLabel}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
