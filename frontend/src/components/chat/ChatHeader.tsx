import { cn } from '@/lib/utils';
import { Trash2, RefreshCw, Bot, Settings, ListTodo, Plus } from 'lucide-react';
import type { AgentConfig } from '@/lib/agent-data-service';

interface ChatHeaderProps {
  hasMessages: boolean;
  loading: boolean;
  onRegenerate: () => void;
  onClear: () => void;
  onOpenPlan?: () => void; // NEW: 打开任务计划面板的回调
  hasTasks?: boolean; // NEW: 是否有任务需要显示
  agents?: AgentConfig[];
  selectedAgentId?: string;
  onAgentChange?: (agentId: string) => void;
  showAgentSelector?: boolean;
}

export function ChatHeader({
  hasMessages,
  loading,
  onRegenerate,
  onClear,
  onOpenPlan,
  hasTasks = false,
  agents = [],
  selectedAgentId,
  onAgentChange,
  showAgentSelector = true,
}: ChatHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-gray-600" />
            <h1 className="text-lg font-semibold">Agent Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPlan && (
              <button
                onClick={onOpenPlan}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors relative",
                  "hover:bg-secondary",
                  hasTasks && "text-blue-600"
                )}
              >
                <ListTodo className="w-4 h-4" />
                任务计划
                {hasTasks && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            )}
            {showAgentSelector && agents.length > 0 && onAgentChange && (
              <select
                value={selectedAgentId}
                onChange={(e) => onAgentChange(e.target.value)}
                className="px-2 py-1 text-sm border rounded-md bg-background hover:bg-secondary transition-colors cursor-pointer"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.role.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onClear}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                "hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <Plus className="w-4 h-4" />
              新会议
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
