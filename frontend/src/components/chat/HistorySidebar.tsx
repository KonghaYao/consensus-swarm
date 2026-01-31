/**
 * HistorySidebar - 历史记录侧边栏
 * 符合 Web Interface Guidelines - 现代配色
 */

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChat } from '@langgraph-js/sdk/react';
import { cn } from '@/lib/utils';

interface HistorySidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectThread?: (thread: any) => void;
}

/**
 * 格式化时间
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于 1 分钟
  if (diff < 60000) return '刚刚';
  // 小于 1 小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  // 小于 1 天
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  // 小于 7 天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function HistorySidebar({ collapsed = false, onToggleCollapse, onSelectThread }: HistorySidebarProps) {
  const {
    historyList,
    currentChatId,
    refreshHistoryList,
    toHistoryChat,
  } = useChat();

  const [isLoading, setIsLoading] = useState(false);

  // 刷新历史列表
  useEffect(() => {
    setIsLoading(true);
    refreshHistoryList().finally(() => {
      setIsLoading(false);
    });
  }, [refreshHistoryList]);

  // 切换到历史对话
  const handleSelectThread = async (thread: any) => {
    await toHistoryChat(thread);
    // 调用外部回调（如果有）
    if (onSelectThread) {
      onSelectThread(thread);
    }
  };

  if (collapsed) {
    // 折叠状态：只显示图标
    return (
      <aside className="w-12 border-r bg-white flex flex-col items-center py-4" aria-label="历史记录">
        <button
          type="button"
          className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          onClick={onToggleCollapse}
          title="展开历史记录"
          aria-label="展开历史记录"
          aria-expanded="false"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-r bg-white flex flex-col h-full" aria-label="历史记录">
      {/* 头部 */}
      <div className="flex flex-col border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
              aria-hidden="true"
            >
              <History className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">历史记录</span>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={onToggleCollapse}
            title="折叠"
            aria-label="折叠历史记录"
            aria-expanded="true"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8" aria-live="polite" aria-busy="true">
              <div className="text-sm text-gray-500">加载中…</div>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3" aria-hidden="true">
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">暂无历史记录</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {historyList.map((thread) => {
                const isCurrent = thread.thread_id === currentChatId;
                const shortId = thread.thread_id?.substring(0, 6) || '';
                const time = formatTime(thread.updated_at || '');

                return (
                  <li key={thread.thread_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectThread(thread)}
                      className={cn(
                        "group w-full flex items-center justify-between rounded-lg border p-3",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                        isCurrent
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      aria-current={isCurrent ? 'true' : undefined}
                      aria-label={`会话 ${shortId}，${time}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center",
                            isCurrent ? "bg-blue-600" : "bg-gray-200"
                          )}
                          aria-hidden="true"
                        >
                          <MessageSquare className={cn(
                            "w-3 h-3",
                            isCurrent ? "text-white" : "text-gray-500"
                          )} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">会话 {shortId}</span>
                      </div>
                      <span className="text-xs text-gray-500" aria-label={`时间：${time}`}>
                        {time}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      <div className="border-t p-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>共 {historyList.length} 条对话</span>
          <span className="font-mono" aria-label={`当前会话 ID：${(currentChatId as string)?.substring(0, 8) || '新对话'}`}>
            {(currentChatId as string)?.substring(0, 8) || '新对话'}
          </span>
        </div>
      </div>
    </aside>
  );
}
