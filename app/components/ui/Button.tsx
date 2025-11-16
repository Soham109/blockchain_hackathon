"use client";
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  isLoading?: boolean;
}

export default function Button({ children, className, variant = 'primary', isLoading, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-700',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800',
    outline: 'bg-transparent border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white hover:bg-gray-800',
    danger: 'bg-red-600/10 text-red-400 border border-red-600/30 hover:bg-red-600/20 hover:text-red-300',
  };

  return (
    <button className={cn(base, variants[variant], className)} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}