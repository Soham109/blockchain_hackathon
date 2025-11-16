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
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-6 transition-all duration-300',
        hoverable && 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}