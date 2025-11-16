"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface GridPatternProps {
  className?: string;
  size?: number;
  color?: string;
  opacity?: number;
}

export function GridPattern({
  className,
  size = 40,
  color = 'currentColor',
  opacity = 0.1,
}: GridPatternProps) {
  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{
        backgroundImage: `
          linear-gradient(${color} ${opacity} 1px, transparent 1px),
          linear-gradient(90deg, ${color} ${opacity} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

