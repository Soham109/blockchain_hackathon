"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function RevealText({
  text,
  className,
  delay = 0,
  duration = 0.5,
}: RevealTextProps) {
  const words = text.split(' ');

  return (
    <div className={cn("flex flex-wrap", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: delay + i * 0.05,
            ease: 'easeOut',
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

