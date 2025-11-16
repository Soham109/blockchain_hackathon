"use client";
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

export function FlipCard({ front, back, className }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn("perspective-1000", className)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-full preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Card className="absolute inset-0 backface-hidden border-2 cursor-pointer">
          <CardContent className="p-6 h-full flex items-center justify-center">
            <div className="w-full">{front}</div>
          </CardContent>
        </Card>
        <Card
          className="absolute inset-0 backface-hidden border-2 cursor-pointer"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <CardContent className="p-6 h-full flex items-center justify-center">
            <div className="w-full">{back}</div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

