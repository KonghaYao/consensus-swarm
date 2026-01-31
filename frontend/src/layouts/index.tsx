/**
 * Layout 组件
 * 统一的页面布局 - 左侧导航边栏
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Main } from './Main';

export interface LayoutProps {
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ className = '' }) => {
  return (
    <div className={`flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
      {/* 左侧导航边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Main>
          <Outlet />
        </Main>
      </div>
    </div>
  );
};

// Export other components
export { AppShell } from './AppShell';
export { AppShellHeader } from './AppShellHeader';
export { HistoryDrawer } from './HistoryDrawer';
export { Header } from './Header';
export { Main } from './Main';
export { Sidebar } from './Sidebar';
