import React from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'failure' | 'cyan' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className }) => {
  const styles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-amber-50 text-amber-800 border-amber-200',
    medium: 'bg-slate-100 text-slate-800 border-slate-200',
    low: 'bg-slate-50 text-slate-600 border-slate-200',
    info: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    failure: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border shadow-2xs transition-all',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
