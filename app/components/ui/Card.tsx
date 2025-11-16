"use client";
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Card({
  children,
  className,
  hoverable = false,
  variant = 'default',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  variant?: 'default' | 'gradient' | 'bordered';
  [key: string]: any;
}) {
  const variants = {
    default: 'glass-panel',
    gradient: 'glass-panel-enhanced',
    bordered: 'gradient-border'
  };

  return (
    <div
      className={cn(
        variants[variant],
        'rounded-lg p-6 transition-all duration-200',
        hoverable && 'hover-lift cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}