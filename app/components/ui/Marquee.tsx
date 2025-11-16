"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right';
  speed?: number;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className,
  direction = 'left',
  speed = 50,
  pauseOnHover = false,
}: MarqueeProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className="flex"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
        whileHover={pauseOnHover ? { animationPlayState: 'paused' } : {}}
      >
        <div className="flex shrink-0 gap-4">
          {children}
        </div>
        <div className="flex shrink-0 gap-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

