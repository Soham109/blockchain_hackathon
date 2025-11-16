"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OrbitingCirclesProps {
  className?: string;
  radius?: number;
  duration?: number;
  children?: React.ReactNode;
}

export function OrbitingCircles({
  className,
  radius = 100,
  duration = 20,
  children,
}: OrbitingCirclesProps) {
  return (
    <div className={cn("relative", className)}>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {children}
        </div>
      )}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary/50"
          style={{
            x: -4,
            y: -4,
          }}
          animate={{
            rotate: 360,
            x: [
              Math.cos((i * Math.PI * 2) / 3) * radius - 4,
              Math.cos((i * Math.PI * 2) / 3 + Math.PI * 2) * radius - 4,
            ],
            y: [
              Math.sin((i * Math.PI * 2) / 3) * radius - 4,
              Math.sin((i * Math.PI * 2) / 3 + Math.PI * 2) * radius - 4,
            ],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

