"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 2,
  colorFrom = '#3b82f6',
  colorTo = '#8b5cf6',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          '--size': size,
          '--duration': duration,
          '--anchor': anchor,
          '--border-width': borderWidth,
          '--color-from': colorFrom,
          '--color-to': colorTo,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        className
      )}
    >
      <motion.div
        className="absolute inset-[calc(var(--border-width)*-1px)] rounded-[inherit] [background:linear-gradient(transparent,transparent),conic-gradient(from_0deg_at_50%_50%,var(--color-from),var(--color-to),var(--color-from))] [background-clip:padding-box,border-box] [background-origin:border-box] [mask:linear-gradient(#000_0_0)_content-box_content-box,linear-gradient(#000_0_0)] [mask-composite:xor] [padding:var(--border-width)]"
        style={{
          offsetDistance: '0%',
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          offsetDistance: {
            duration,
            repeat: Infinity,
            ease: 'linear',
            delay,
          },
        }}
      />
    </div>
  );
}

