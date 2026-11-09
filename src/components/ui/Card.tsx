import React from 'react';
import { cn } from '@/shared/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-lg shadow-2xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn('p-5 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between', className)}>
      <div>
        <h3 className="text-base font-semibold text-[#172033] dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={cn('p-5', className)}>{children}</div>;
};
