import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';

interface ToolMessageProps {
  toolName?: string;
  type: 'tool-use' | 'tool-result';
  result?: any;
}

export function ToolMessage({ toolName, type, result }: ToolMessageProps) {
  const title = type === 'tool-use' ? `使用工具: ${toolName}` : '工具结果';

  return (
    <div className="flex gap-4 group justify-start">
      <Avatar type="bot" />

      <div className="flex-1 max-w-[85%] space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-foreground">Zen Worker</div>
        </div>

        <div className="text-sm rounded-lg border border-border bg-muted/50 px-3 py-2">
          <div className="font-medium text-muted-foreground mb-1">{title}</div>
          {type === 'tool-result' && result && (
            <div className="text-xs text-muted-foreground font-mono overflow-x-auto">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
