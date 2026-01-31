/**
 * Layout 组件
 * 统一的页面布局 - 支持双侧边栏
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Main } from './Main';

export interface LayoutProps {
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ className = '' }) => {


  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <Main>
          <Outlet />
        </Main>
      </div>
    </div>
  );
};

