"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface RetroGridProps {
  className?: string;
  angle?: number;
}

export function RetroGrid({ className, angle = 65 }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]",
        className
      )}
      style={{ '--grid-angle': `${angle}deg` } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_0),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_0)] [background-size:4rem_4rem] [transform:rotateX(var(--grid-angle))] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
      />
    </div>
  );
}

