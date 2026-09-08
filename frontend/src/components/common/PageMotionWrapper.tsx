import React from 'react';
import { motion } from 'framer-motion';

interface PageMotionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageMotionWrapper: React.FC<PageMotionWrapperProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.995 }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1], // Custom snappy cubic bezier
      }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
