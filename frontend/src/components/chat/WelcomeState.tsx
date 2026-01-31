/**
 * WelcomeState - 欢迎状态组件
 */

import React from 'react';
import { Bot } from 'lucide-react';

export function WelcomeState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Zen Worker</h2>
          <p className="text-muted-foreground">我是你的 AI 助手，有什么可以帮你的吗？</p>
        </div>
      </div>
    </div>
  );
}
