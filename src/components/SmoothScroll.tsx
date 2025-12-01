import { useEffect } from 'react';

interface SmoothScrollProps {
  speed?: number;
  smoothness?: number;
}

export function SmoothScroll({ speed = 1.5, smoothness = 0.15 }: SmoothScrollProps) {
  useEffect(() => {
    // Detect if user is on desktop with mouse
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    
    // Only apply custom scroll on desktop for super responsive mouse
    if (!isDesktop) return;

    let isScrolling = false;
    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    let rafId: number;
    let velocity = 0;
    let lastTime = Date.now();

    // Ultra-responsive wheel event with momentum
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Take full control on desktop
      
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      // Calculate velocity for momentum
      const scrollDelta = e.deltaY * speed;
      velocity = scrollDelta / Math.max(deltaTime, 1);
      
      // Apply scroll with momentum
      targetScrollY += scrollDelta;
      targetScrollY = Math.max(0, Math.min(targetScrollY, document.documentElement.scrollHeight - window.innerHeight));
      
      if (!isScrolling) {
        isScrolling = true;
        animate();
      }
    };

    // Buttery smooth animation loop with easing
    const animate = () => {
      // Smooth interpolation
      const diff = targetScrollY - currentScrollY;
      currentScrollY += diff * smoothness;
      
      // Apply momentum decay
      velocity *= 0.95;
      
      // Stop when close enough and velocity is low
      if (Math.abs(diff) < 0.1 && Math.abs(velocity) < 0.1) {
        currentScrollY = targetScrollY;
        isScrolling = false;
        velocity = 0;
      } else {
        rafId = requestAnimationFrame(animate);
      }
      
      // Use smooth scrollTo
      window.scrollTo({
        top: currentScrollY,
        behavior: 'auto' // We handle smoothness ourselves
      });
    };

    // Keyboard support for arrow keys, page up/down, etc.
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollAmount = {
        'ArrowUp': -50,
        'ArrowDown': 50,
        'PageUp': -window.innerHeight * 0.8,
        'PageDown': window.innerHeight * 0.8,
        'Home': -window.scrollY,
        'End': document.documentElement.scrollHeight - window.innerHeight - window.scrollY,
        'Space': e.shiftKey ? -window.innerHeight * 0.8 : window.innerHeight * 0.8,
      }[e.key];

      if (scrollAmount !== undefined) {
        e.preventDefault();
        targetScrollY = window.scrollY + scrollAmount;
        targetScrollY = Math.max(0, Math.min(targetScrollY, document.documentElement.scrollHeight - window.innerHeight));
        
        if (!isScrolling) {
          isScrolling = true;
          animate();
        }
      }
    };

    // Add listeners - passive: false for full control
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    // Sync on manual scroll (e.g., scrollbar clicks)
    const handleScroll = () => {
      if (!isScrolling) {
        currentScrollY = window.scrollY;
        targetScrollY = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [speed, smoothness]);

  return null;
}
