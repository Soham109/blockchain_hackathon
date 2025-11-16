"use client";
import React from 'react';
import clsx from 'clsx';

export default function Input({ className, ...props }: any) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-gray-200 bg-white/5 px-3 py-2 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
        className
      )}
      {...props}
    />
  );
}
