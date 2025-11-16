"use client";
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightProps {
  className?: string;
  size?: number;
  color?: string;
}

export function Spotlight({ className, size = 600, color = '#3b82f6' }: SpotlightProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}
    >
      <div
        className="absolute rounded-full blur-3xl opacity-20 transition-opacity duration-300"
        style={{
          width: size,
          height: size,
          left: mousePosition.x - size / 2,
          top: mousePosition.y - size / 2,
          background: `radial-gradient(circle, ${color}, transparent)`,
        }}
      />
    </div>
  );
}

