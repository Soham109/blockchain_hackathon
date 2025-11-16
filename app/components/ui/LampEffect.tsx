"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LampEffectProps {
  children: React.ReactNode;
  className?: string;
}

export function LampEffect({ children, className }: LampEffectProps) {
  return (
    <div className={cn("relative flex w-full flex-col items-center justify-center overflow-hidden rounded-md bg-background p-20", className)}>
      <div className="relative flex w-full flex-col items-center justify-center">
        <div className="absolute inset-auto z-0 h-2/3 w-[30rem] -translate-y-[6rem] rounded-full bg-primary/20 blur-[106px]"></div>
        <div className="relative z-40 flex -translate-y-80 flex-col items-center px-5">
          {children}
        </div>
      </div>
    </div>
  );
}

