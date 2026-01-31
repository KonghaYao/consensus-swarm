/**
 * ChatInput - 聊天输入框组件
 */

import React, { useRef, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  loading = false,
  placeholder = '输入消息...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !loading) {
        onSend();
      }
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const isDisabled = disabled || loading;

  return (
    <div className="border-t bg-background">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className={cn(
          "flex items-end gap-2 p-3 rounded-2xl border transition-colors",
          "focus-within:border-primary",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={loading ? 'AI 正在思考...' : placeholder}
            rows={1}
            className={cn(
              "flex-1 resize-none outline-none bg-transparent text-base",
              "max-h-[200px] min-h-[24px]",
              isDisabled && "pointer-events-none"
            )}
          />

          {value && !loading && (
            <button
              onClick={handleClear}
              disabled={isDisabled}
              className={cn(
                "p-2 rounded-lg hover:bg-secondary transition-colors",
                "text-muted-foreground hover:text-foreground",
                isDisabled && "pointer-events-none"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onSend}
            disabled={!value.trim() || isDisabled}
            className={cn(
              "p-2 rounded-lg transition-colors flex items-center justify-center",
              value.trim() && !isDisabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI 正在处理中...
            </span>
          ) : (
            '按 Enter 发送，Shift + Enter 换行'
          )}
        </div>
      </div>
    </div>
  );
}
