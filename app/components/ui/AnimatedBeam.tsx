"use client";
import React, { forwardRef, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  duration?: number;
  delay?: number;
}

export const AnimatedBeam = forwardRef<SVGSVGElement, AnimatedBeamProps>(
  ({ className, containerRef, fromRef, toRef, curvature = 75, duration = 3, delay = 0 }, ref) => {
    const id = React.useId();
    const pathRef = useRef<SVGPathElement>(null);
    const [pathD, setPathD] = React.useState('');
    const [svgDimensions, setSvgDimensions] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
      const updatePath = () => {
        if (containerRef.current && fromRef.current && toRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const fromRect = fromRef.current.getBoundingClientRect();
          const toRect = toRef.current.getBoundingClientRect();

          const startX = fromRect.left - containerRect.left + fromRect.width / 2;
          const startY = fromRect.top - containerRect.top + fromRect.height / 2;
          const endX = toRect.left - containerRect.left + toRect.width / 2;
          const endY = toRect.top - containerRect.top + toRect.height / 2;

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          const d = `M ${startX} ${startY} Q ${midX} ${midY - curvature} ${endX} ${endY}`;
          setPathD(d);
          setSvgDimensions({
            width: containerRect.width,
            height: containerRect.height,
          });
        }
      };

      updatePath();
      window.addEventListener('resize', updatePath);
      return () => window.removeEventListener('resize', updatePath);
    }, [containerRef, fromRef, toRef, curvature]);

    return (
      <svg
        ref={ref}
        width={svgDimensions.width}
        height={svgDimensions.height}
        className={cn('pointer-events-none absolute left-0 top-0', className)}
      >
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          className="motion-safe:animate-pulse"
        />
        <defs>
          <motion.linearGradient
            id={`gradient-${id}`}
            gradientUnits="userSpaceOnUse"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <stop stopColor="#3b82f6" stopOpacity="0" offset="0%" />
            <stop stopColor="#3b82f6" stopOpacity="1" offset="50%" />
            <stop stopColor="#8b5cf6" stopOpacity="1" offset="100%" />
          </motion.linearGradient>
        </defs>
      </svg>
    );
  }
);

AnimatedBeam.displayName = 'AnimatedBeam';

