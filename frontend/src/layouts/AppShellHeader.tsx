import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AppShellHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function AppShellHeader({ title, description, actions, className }: AppShellHeaderProps) {
  return (
    <div className={cn('px-6 py-4 bg-white', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
