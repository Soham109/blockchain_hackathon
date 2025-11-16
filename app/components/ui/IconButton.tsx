"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  tooltip?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  className,
  size = 'md',
  variant = 'ghost',
  tooltip,
}: IconButtonProps) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={tooltip}
    >
      <Button
        variant={variant}
        size="icon"
        onClick={onClick}
        className={cn(sizeMap[size], className)}
      >
        <Icon className={cn(
          size === 'sm' && 'h-4 w-4',
          size === 'md' && 'h-5 w-5',
          size === 'lg' && 'h-6 w-6'
        )} />
      </Button>
    </motion.div>
  );
}

