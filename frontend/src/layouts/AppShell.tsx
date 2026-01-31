import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  drawerContent?: ReactNode;
  className?: string;
}

export function AppShell({ children, header, drawerContent, className }: AppShellProps) {
  return (
    <div className={cn('flex h-screen bg-background overflow-hidden', className)}>
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional page header */}
        {header && (
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {header}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>

      {/* Drawer content (if provided) */}
      {drawerContent}
    </div>
  );
}
