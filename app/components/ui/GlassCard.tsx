"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
}

export function GlassCard({ children, className, blur = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border-2 border-white/10",
        blur && "backdrop-blur-xl",
        "bg-background/80",
        "shadow-2xl",
        "p-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

