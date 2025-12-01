import { Plus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  gradient?: string;
}

export function FloatingActionButton({ 
  onClick, 
  icon,
  gradient = 'from-teal-400 to-cyan-500'
}: FloatingActionButtonProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    // Trigger haptic
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }

    // Create particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 0,
      y: 0,
    }));
    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);

    onClick();
  };

  return (
    <>
      {/* Particles */}
      {particles.map((particle, index) => (
        <motion.div
          key={particle.id}
          className="fixed w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 pointer-events-none z-50"
          style={{
            bottom: 'calc(7rem + 2rem)',
            right: 'calc(1.5rem + 2rem)',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 0],
            x: Math.cos((index * 360) / 8 * Math.PI / 180) * 60,
            y: Math.sin((index * 360) / 8 * Math.PI / 180) * 60,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}

      {/* FAB */}
      <motion.button
        onClick={handleClick}
        className={`fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center z-50 border border-white/20`}
        style={{
          boxShadow: '0 10px 40px rgba(20, 184, 166, 0.4), 0 0 0 0 rgba(20, 184, 166, 0.4)',
        }}
        whileHover={{ 
          scale: 1.15,
          rotate: 90,
        }}
        whileTap={{ 
          scale: 0.9,
          rotate: 180,
        }}
        animate={{
          y: [0, -5, 0],
          boxShadow: [
            '0 10px 40px rgba(20, 184, 166, 0.4)',
            '0 15px 50px rgba(20, 184, 166, 0.6)',
            '0 10px 40px rgba(20, 184, 166, 0.4)',
          ],
        }}
        transition={{
          y: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient}`}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ filter: 'blur(15px)', zIndex: -1 }}
        />

        {/* Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {icon || <Plus size={28} className="text-white" strokeWidth={2.5} />}
        </motion.div>

        {/* Sparkle effect */}
        <motion.div
          className="absolute top-0 right-0"
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles size={12} className="text-white" />
        </motion.div>

        {/* Ripple on hover */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-white/50"
          initial={{ scale: 1, opacity: 0 }}
          whileHover={{ scale: 1.5, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
        />
      </motion.button>
    </>
  );
}
