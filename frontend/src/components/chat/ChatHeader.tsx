import { cn } from '@/lib/utils';
import { Trash2, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  hasMessages: boolean;
  loading: boolean;
  onRegenerate: () => void;
  onClear: () => void;
}

export function ChatHeader({
  hasMessages,
  loading,
  onRegenerate,
  onClear,
}: ChatHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Chat Bot</h1>
        <div className="flex items-center gap-2">
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
  );
}
