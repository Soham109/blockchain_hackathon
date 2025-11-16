"use client";
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500',
        'focus:border-violet-500/50 focus:bg-zinc-900/80 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all',
        className
      )}
      {...props}
    />
  );
}