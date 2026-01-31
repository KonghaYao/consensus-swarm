/**
 * ThinkingMessage - AI 思考过程展示组件
 */

import React from 'react';
import { Brain } from 'lucide-react';

interface ThinkingMessageProps {
  content: string;
}

export function ThinkingMessage({ content }: ThinkingMessageProps) {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          思考过程
        </span>
      </div>
      <div className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}
