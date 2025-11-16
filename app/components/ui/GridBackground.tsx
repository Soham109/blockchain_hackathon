"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface GridBackgroundProps {
  className?: string;
}

export function GridBackground({ className }: GridBackgroundProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none",
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  );
}

