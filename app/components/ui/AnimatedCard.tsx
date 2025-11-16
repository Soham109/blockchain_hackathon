"use client";
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  delay?: number;
}

export function AnimatedCard({ 
  children, 
  className, 
  hoverScale = 1.02,
  delay = 0 
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "transition-all duration-300 cursor-pointer group",
          isHovered && "shadow-2xl",
          className
        )}
      >
        <motion.div
          animate={{
            scale: isHovered ? hoverScale : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <CardContent className="p-6">
            {children}
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}

