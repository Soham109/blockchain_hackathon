"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NeonTextProps {
  children: React.ReactNode;
  className?: string;
  color?: 'blue' | 'pink' | 'purple' | 'green';
  glow?: boolean;
}

export function NeonText({
  children,
  className,
  color = 'blue',
  glow = true,
}: NeonTextProps) {
  const colorMap = {
    blue: 'text-blue-400',
    pink: 'text-pink-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  const glowMap = {
    blue: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]',
    pink: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]',
    purple: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    green: 'drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]',
  };

  return (
    <motion.span
      className={cn(
        "font-bold",
        colorMap[color],
        glow && glowMap[color],
        className
      )}
      animate={glow ? {
        textShadow: [
          `0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor`,
          `0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor`,
          `0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor`,
        ],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.span>
  );
}

