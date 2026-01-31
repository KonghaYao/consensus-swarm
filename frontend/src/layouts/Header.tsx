/**
 * Header 组件
 * 页面头部
 */

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageSquare, Settings } from 'lucide-react';

export interface HeaderProps {
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  className = '',
  title,
  actions,
}) => {
  const location = useLocation();

  // 默认标题根据路径生成
  const defaultTitle = React.useMemo(() => {
    const path = location.pathname;
    if (path === '/') return '聊天';
    if (path.startsWith('/config')) return '配置';
    if (path.startsWith('/skills')) return 'Skills 管理';
    if (path.startsWith('/plugins')) return '插件管理';
    if (path.startsWith('/history')) return '历史记录';
    if (path.startsWith('/agents')) return 'Agent 配置';
    return 'Zen Worker';
  }, [location.pathname]);

  const displayTitle = title || defaultTitle;

  const navLinks = [
    { path: '/', label: '聊天', icon: MessageSquare },
    { path: '/agents', label: 'Agent 配置', icon: Settings },
  ];

  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{displayTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {location.pathname === '/' && '与 AI 助手对话'}
            {location.pathname.startsWith('/config') && '管理系统配置'}
            {location.pathname.startsWith('/skills') && '管理 AI Skills'}
            {location.pathname.startsWith('/plugins') && '管理插件'}
            {location.pathname.startsWith('/history') && '查看对话历史'}
            {location.pathname.startsWith('/agents') && '管理 Agent 配置'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </header>
  );
};
