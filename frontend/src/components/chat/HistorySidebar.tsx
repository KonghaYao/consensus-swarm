/**
 * HistorySidebar - 历史记录侧边栏（固定式）
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Plus, Search, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChat } from '@langgraph-js/sdk/react';

interface HistorySidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export function HistorySidebar({ collapsed = false, onToggleCollapse }: HistorySidebarProps) {
  const {
    historyList,
    currentChatId,
    refreshHistoryList,
    toHistoryChat,
    createNewChat,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 刷新历史列表
  useEffect(() => {
    setIsLoading(true);
    refreshHistoryList().finally(() => {
      setIsLoading(false);
    });
  }, [refreshHistoryList]);

  // 过滤历史记录
  const filteredList = useMemo(() => {
    if (!searchQuery) return historyList;

    const query = searchQuery.toLowerCase();
    return historyList.filter((thread) => {
      // 搜索 thread_id
      const threadId = thread.thread_id || '';
      if (threadId.toLowerCase().includes(query)) return true;
      // 搜索 metadata 中的 topic
      const topic = thread.metadata?.topic as string | undefined;
      if (topic?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [historyList, searchQuery]);

  // 切换到历史对话
  const handleSelectThread = async (thread: any) => {
    await toHistoryChat(thread);
  };

  // 创建新对话
  const handleNewChat = async () => {
    await createNewChat();
  };

  if (collapsed) {
    // 折叠状态：只显示图标
    return (
      <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onToggleCollapse}
          title="展开历史记录"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      {/* 头部 */}
      <div className="flex flex-col border-b p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <span className="font-semibold">历史记录</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleCollapse}
            title="折叠"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1"
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4" />
          新建对话
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">加载中...</div>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? '没有找到匹配的对话' : '暂无历史记录'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredList.map((thread) => {
                const isCurrent = thread.thread_id === currentChatId;
                const shortId = thread.thread_id?.substring(0, 6) || '';
                const time = formatTime(thread.updated_at || '');

                return (
                  <div
                    key={thread.thread_id}
                    onClick={() => handleSelectThread(thread)}
                    className={`
                      group flex items-center justify-between rounded-lg border p-3 transition-all cursor-pointer
                      ${isCurrent
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">会话 {shortId}</span>
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {historyList.length} 条对话</span>
          <span>当前: {(currentChatId as string)?.substring(0, 8) || '新对话'}</span>
        </div>
      </div>
    </div>
  );
}
