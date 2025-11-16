"use client";
import React from 'react';
import clsx from 'clsx';

export default function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const variants: any = {
    default: 'bg-slate-700 text-slate-100',
    success: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-200 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  };

  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
