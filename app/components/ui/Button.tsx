"use client";
import React from 'react';
import clsx from 'clsx';

export default function Button({ children, className, variant = 'primary', ...props }: any) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-transform transform';
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:scale-[1.02] hover:brightness-105 shadow-md',
    ghost: 'bg-white/5 text-white hover:bg-white/10',
    danger: 'bg-red-600 text-white hover:brightness-95',
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
