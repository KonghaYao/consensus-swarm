/**
 * ThinkingMessage - AI 思考过程展示组件
 */

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkingMessageProps {
  content: string;
}

export function ThinkingMessage({ content }: ThinkingMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取前两行作为预览
  const previewLines = content.split('\n').slice(0, 2).join('\n');
  const hasMoreContent = content.split('\n').length > 2;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
      {/* 可点击的标题栏 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            思考过程
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      {/* 内容区域 */}
      {isExpanded ? (
        <div className="px-4 pb-3 text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      ) : (
        <div className="px-4 pb-3 text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
          <div className="whitespace-pre-wrap opacity-70">{previewLines}</div>
          {hasMoreContent && (
            <div className="mt-1 text-xs opacity-50 italic">点击展开完整思考过程...</div>
          )}
        </div>
      )}
    </div>
  );
}
