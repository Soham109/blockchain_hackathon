"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlowEffectProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'primary' | 'emerald' | 'purple' | 'pink';
}

export function GlowEffect({
  children,
  className,
  intensity = 'medium',
  color = 'primary',
}: GlowEffectProps) {
  const intensityMap = {
    low: 'opacity-30',
    medium: 'opacity-50',
    high: 'opacity-70',
  };

  const colorMap = {
    primary: 'bg-primary',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn(
          "absolute inset-0 rounded-lg blur-xl",
          colorMap[color],
          intensityMap[intensity]
        )}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

