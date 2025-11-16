"use client";
import React from 'react';
import clsx from 'clsx';

export default function Loading({
  fullscreen = false,
  message = 'Loading...',
}: {
  fullscreen?: boolean;
  message?: string;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-300">{message}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        {content}
      </div>
    );
  }

  return content;
}
