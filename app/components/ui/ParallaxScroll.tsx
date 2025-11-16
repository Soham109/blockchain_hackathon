"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ParallaxScrollProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

export function ParallaxScroll({
  children,
  className,
  speed = 0.5,
}: ParallaxScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

