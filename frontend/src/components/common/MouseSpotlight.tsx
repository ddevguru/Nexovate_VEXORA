import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export const MouseSpotlight: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: -200, y: -200 });
  const [isHovering, setIsHovering] = useState(false);

  const springX = useSpring(mousePosition.x, { damping: 30, stiffness: 220 });
  const springY = useSpring(mousePosition.y, { damping: 30, stiffness: 220 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      springX.set(e.clientX);
      springY.set(e.clientY);
      if (!isHovering) setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [springX, springY, isHovering]);

  if (!isHovering) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Subtle, non-vibrant monochrome cursor ambient light */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-15 bg-slate-400/20"
        style={{
          left: springX,
          top: springY,
          width: 380,
          height: 380,
        }}
      />
    </div>
  );
};
