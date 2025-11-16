"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverGlowProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: number;
}

export function HoverGlow({
  children,
  className,
  color = '#3b82f6',
  intensity = 20,
}: HoverGlowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn("relative", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 rounded-lg blur-xl opacity-0 pointer-events-none"
        style={{ backgroundColor: color }}
        animate={{
          opacity: isHovered ? 0.3 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

