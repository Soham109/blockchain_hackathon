"use client";
import React from 'react';
import clsx from 'clsx';

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
      className={clsx(
        'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6',
        hoverable && 'transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
