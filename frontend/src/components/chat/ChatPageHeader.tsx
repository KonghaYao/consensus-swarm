import { cn } from '@/lib/utils';
import { Bot, Plus, MoreVertical } from 'lucide-react';
import type { AgentConfig } from '@/lib/agent-data-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatPageHeaderProps {
  hasMessages: boolean;
  loading: boolean;
  onRegenerate: () => void;
  onClear: () => void;
  agents?: AgentConfig[];
  selectedAgentId?: string;
  onAgentChange?: (agentId: string) => void;
  showAgentSelector?: boolean;
}

export function ChatPageHeader({
  hasMessages,
  loading,
  onRegenerate,
  onClear,
  agents = [],
  selectedAgentId,
  onAgentChange,
  showAgentSelector = true,
}: ChatPageHeaderProps) {
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <header className="h-14 border-b bg-white/80 backdrop-blur-sm">
      <div className="h-full px-4 flex items-center justify-between">
        {/* 左侧 - 当前 Agent */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center" aria-hidden="true">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{'Agent Chat'}</h1>
            <p className="text-xs text-gray-500">{'AI 助手对话'}</p>
          </div>
        </div>

        {/* 右侧 - 操作按钮 */}
        <nav className="flex items-center gap-2" aria-label="聊天操作">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            新会议
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-haspopup="true"
                aria-label="更多选项"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onRegenerate}
                disabled={!hasMessages || loading}
                aria-disabled={!hasMessages || loading}
              >
                重新生成
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
