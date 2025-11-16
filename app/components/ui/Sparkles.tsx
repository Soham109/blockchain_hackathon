"use client";
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SparklesProps {
  className?: string;
  count?: number;
  color?: string;
}

export function Sparkles({ className, count = 20, color = '#3b82f6' }: SparklesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sparkles: Array<{
      element: HTMLDivElement;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.position = 'absolute';
      sparkle.style.width = '4px';
      sparkle.style.height = '4px';
      sparkle.style.borderRadius = '50%';
      sparkle.style.backgroundColor = color;
      sparkle.style.boxShadow = `0 0 6px ${color}`;
      sparkle.style.pointerEvents = 'none';
      
      const x = Math.random() * container.offsetWidth;
      const y = Math.random() * container.offsetHeight;
      const vx = (Math.random() - 0.5) * 0.5;
      const vy = (Math.random() - 0.5) * 0.5;

      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;

      container.appendChild(sparkle);
      sparkles.push({ element: sparkle, x, y, vx, vy });
    }

    function animate() {
      sparkles.forEach((sparkle) => {
        sparkle.x += sparkle.vx;
        sparkle.y += sparkle.vy;

        if (sparkle.x < 0 || sparkle.x > container!.offsetWidth) sparkle.vx *= -1;
        if (sparkle.y < 0 || sparkle.y > container!.offsetHeight) sparkle.vy *= -1;

        sparkle.element.style.left = `${sparkle.x}px`;
        sparkle.element.style.top = `${sparkle.y}px`;
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      sparkles.forEach(({ element }) => element.remove());
    };
  }, [count, color]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    />
  );
}

