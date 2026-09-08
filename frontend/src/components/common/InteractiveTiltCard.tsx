import React, { useState, useRef, MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface InteractiveTiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltAmount?: number;
  onClick?: () => void;
}

export const InteractiveTiltCard: React.FC<InteractiveTiltCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.12)',
  tiltAmount = 8,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -tiltAmount;
    const rotY = ((x - centerX) / centerX) * tiltAmount;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
          isHovered ? 'scale3d(1.025, 1.025, 1.025) translateY(-4px)' : 'scale3d(1, 1, 1)'
        }`
      }}
      className={`relative overflow-hidden transition-all duration-200 ease-out cursor-pointer ${className}`}
    >
      {/* Interactive dynamic cursor glare reflection */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 320px at ${glarePosition.x}px ${glarePosition.y}px, ${glowColor}, transparent 75%)`
          }}
        />
      )}

      {/* Shimmer light border reflection */}
      {isHovered && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border border-blue-400/40 shadow-inner" />
      )}

      {children}
    </motion.div>
  );
};
