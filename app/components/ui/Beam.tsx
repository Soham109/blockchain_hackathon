"use client";
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeamProps {
  className?: string;
  delay?: number;
  duration?: number;
  width?: number;
}

export const Beam = forwardRef<SVGSVGElement, BeamProps>(
  ({ className, delay = 0, duration = 3, width = 2 }, ref) => {
    return (
      <svg
        ref={ref}
        className={cn('pointer-events-none absolute left-0 top-0 transform-gpu stroke-primary/20', className)}
        width="100%"
        height="100%"
      >
        <motion.path
          d="M 0,0 Q 400,200 800,0"
          fill="none"
          strokeWidth={width}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration,
            delay,
            ease: 'easeInOut',
          }}
        />
      </svg>
    );
  }
);

Beam.displayName = 'Beam';

