"use client";
import React from 'react';
import clsx from 'clsx';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-slate-800 border border-white/10 p-6 shadow-xl">
        {title && <h2 className="text-lg font-bold text-white mb-4">{title}</h2>}
        <div className="text-slate-100 mb-6">{children}</div>
        {actions && <div className="flex gap-3 justify-end">{actions}</div>}
      </div>
    </div>
  );
}
