/**
 * MessageActions - 消息操作组件
 */

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageActionsProps {
  content: string;
  isHuman?: boolean;
}

export function MessageActions({ content, isHuman }: MessageActionsProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100",
          "hover:bg-secondary",
          isHuman ? "text-muted-foreground" : "text-muted-foreground"
        )}
        title={copied ? "已复制" : "复制"}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
