"use client";
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BadgePillProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  pulse?: boolean;
}

export function BadgePill({
  children,
  variant = 'default',
  className,
  pulse = false,
}: BadgePillProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Badge
        variant={variant}
        className={cn(
          "px-3 py-1 rounded-full font-medium",
          pulse && "animate-pulse",
          className
        )}
      >
        {children}
      </Badge>
    </motion.div>
  );
}

