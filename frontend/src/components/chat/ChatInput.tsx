/**
 * ChatInput - 聊天输入框组件
 */

import React, { useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = '输入消息...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
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

  return (
    <div className="border-t bg-background">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className={cn(
          "flex items-end gap-2 p-3 rounded-2xl border transition-colors",
          "focus-within:border-primary",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "flex-1 resize-none outline-none bg-transparent text-base",
              "max-h-[200px] min-h-[24px]",
              disabled && "pointer-events-none"
            )}
          />

          {value && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className={cn(
                "p-2 rounded-lg hover:bg-secondary transition-colors",
                "text-muted-foreground hover:text-foreground",
                disabled && "pointer-events-none"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "p-2 rounded-lg transition-colors",
              value.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-2">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
}
