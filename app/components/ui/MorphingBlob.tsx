"use client";
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MorphingBlobProps {
  className?: string;
  color?: string;
  size?: number;
}

export function MorphingBlob({ className, color = '#3b82f6', size = 400 }: MorphingBlobProps) {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;

    let animationFrame: number;
    let time = 0;

    function animate() {
      if (!blob) return;
      time += 0.01;
      const x = Math.sin(time) * 20;
      const y = Math.cos(time * 1.5) * 20;
      const scale = 1 + Math.sin(time * 2) * 0.1;

      blob.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={blobRef}
      className={cn(
        "absolute rounded-full blur-3xl opacity-20 pointer-events-none",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
      }}
    />
  );
}

