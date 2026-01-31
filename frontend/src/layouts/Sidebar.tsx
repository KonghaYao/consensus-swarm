/**
 * Sidebar - 左侧导航边栏
 * 符合 Web Interface Guidelines - 现代玻璃态设计
 */

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageSquare, Settings, Home, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: '首页', icon: Home },
    { path: '/chat', label: '聊天', icon: MessageSquare },
    { path: '/agents', label: 'Agent 配置', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-20 border-r border-gray-200/60 bg-white/90 backdrop-blur-xl flex flex-col items-center py-3 gap-1 shadow-sm',
        className
      )}
      aria-label="主导航"
    >
      {/* Logo */}
      <Link
        to="/"
        className="mb-4 group relative"
        aria-label="Consensus 首页"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/10">
            <Users className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-3">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'group relative flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              )}
              title={link.label}
              aria-label={link.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
              <Icon className="w-5 h-5 relative z-10" strokeWidth={2} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom decorative element */}
      <div className="mt-auto">
        <div className="w-10 h-1 rounded-full bg-blue-600 mx-auto opacity-30" />
      </div>
    </aside>
  );
};
