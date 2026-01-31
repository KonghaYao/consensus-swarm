/**
 * Sidebar - 左侧导航边栏
 * 符合 Web Interface Guidelines - 现代配色
 */

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: '聊天', icon: MessageSquare },
    { path: '/agents', label: 'Agent 配置', icon: Settings },
  ];

  return (
    <aside className={cn("w-16 border-r bg-white flex flex-col items-center py-4 gap-2", className)} aria-label="主导航">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            )}
            title={link.label}
            aria-label={link.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </Link>
        );
      })}
    </aside>
  );
};
