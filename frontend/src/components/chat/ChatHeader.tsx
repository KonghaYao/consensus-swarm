import { cn } from '@/lib/utils';
import { Trash2, RefreshCw, Bot, Settings } from 'lucide-react';
import type { AgentConfig } from '@/lib/agent-data-service';

interface ChatHeaderProps {
  hasMessages: boolean;
  loading: boolean;
  onRegenerate: () => void;
  onClear: () => void;
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
            {hasMessages && (
              <button
                onClick={onRegenerate}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  "hover:bg-secondary",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                重新生成
              </button>
            )}
            <button
              onClick={onClear}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                "hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
