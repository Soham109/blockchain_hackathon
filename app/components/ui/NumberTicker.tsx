"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  className?: string;
  delay?: number;
}

export function NumberTicker({
  value,
  direction = 'up',
  className,
  delay = 0,
}: NumberTickerProps) {
  const spring = useSpring(0, {
    damping: 60,
    stiffness: 100,
  });
  const display = useTransform(spring, (current) =>
    Math.max(0, Math.floor(current))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      spring.set(value);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [spring, value, delay]);

  return (
    <motion.span className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  );
}

