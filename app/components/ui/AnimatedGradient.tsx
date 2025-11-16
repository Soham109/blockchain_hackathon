"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGradientProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}

export function AnimatedGradient({
  children,
  className,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899'],
}: AnimatedGradientProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, ${colors.join(', ')})`,
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

