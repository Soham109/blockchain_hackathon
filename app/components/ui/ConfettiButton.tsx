"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ConfettiButton({
  children,
  onClick,
  className,
  variant = 'default',
  size = 'default',
}: ConfettiButtonProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    const newConfetti = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(newConfetti);

    setTimeout(() => {
      setConfetti([]);
    }, 1000);

    onClick?.();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      <AnimatePresence>
        {confetti.map((item) => (
          <motion.div
            key={item.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: item.x,
              top: item.y,
              backgroundColor: item.color,
            }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              y: -100,
              x: (Math.random() - 0.5) * 100,
              scale: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </Button>
  );
}

