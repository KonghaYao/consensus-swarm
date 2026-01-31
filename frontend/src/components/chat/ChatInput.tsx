/**
 * ChatInput - 聊天输入框组件
 * 符合 Web Interface Guidelines - 现代配色
 */

import React, { useRef, useEffect } from 'react';
import { Send, X, Loader2, Paperclip } from 'lucide-react';
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
  placeholder = '输入消息…',
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
    <div className="border-t bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="relative">
          <div className={cn(
            "flex items-end gap-2 p-3 rounded-xl border",
            "transition-colors duration-200",
            "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20",
            "bg-white shadow-sm",
            isDisabled && "opacity-50"
          )}>
            {/* 附件按钮 */}
            <button
              type="button"
              disabled={isDisabled}
              className={cn(
                "p-2 rounded-lg",
                "transition-colors duration-150",
                "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isDisabled && "pointer-events-none"
              )}
              title="添加附件（即将推出）"
              aria-label="添加附件"
            >
              <Paperclip className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* 输入框 */}
            <label htmlFor="chat-input" className="sr-only">输入消息</label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder={loading ? 'AI 正在思考…' : placeholder}
              rows={1}
              className={cn(
                "flex-1 resize-none outline-none bg-transparent text-base text-gray-900",
                "placeholder:text-gray-400",
                "max-h-[200px] min-h-[24px] py-1",
                "focus-visible:outline-none",
                isDisabled && "pointer-events-none"
              )}
              aria-describedby="chat-input-hint"
            />

            {/* 清除按钮 */}
            {value && !loading && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isDisabled}
                className={cn(
                  "p-2 rounded-lg",
                  "transition-colors duration-150",
                  "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  isDisabled && "pointer-events-none"
                )}
                title="清除输入"
                aria-label="清除输入"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            {/* 发送按钮 */}
            <button
              type="submit"
              disabled={!value.trim() || isDisabled}
              className={cn(
                "p-2 rounded-lg flex items-center justify-center",
                "min-w-[40px] min-h-[40px]",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                value.trim() && !isDisabled
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
              title={loading ? '发送中…' : '按 Enter 发送，Shift + Enter 换行'}
              aria-label={loading ? '发送中…' : '发送消息'}
              aria-busy={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* 提示文本 */}
          <p id="chat-input-hint" className="text-xs text-gray-400 text-center mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                <span>AI 正在处理中…</span>
              </span>
            ) : (
              '按 Enter 发送，Shift + Enter 换行'
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
