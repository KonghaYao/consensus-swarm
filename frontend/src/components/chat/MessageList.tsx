/**
 * MessageList - 消息列表组件
 */

import React from 'react';
import { HumanMessage } from './HumanMessage';
import { BotMessage } from './BotMessage';
import { ToolMessage } from './ToolMessage';
import { LoadingIndicator } from './LoadingIndicator';
import type { RenderMessage } from '@langgraph-js/sdk';

interface MessageListProps {
  messages: RenderMessage[];
  loading: boolean;
}

type MessageContent = string | { text?: string } | Array<{ type: string; text?: string; [key: string]: any }>;

/**
 * 判断消息类型
 */
function getMessageType(message: RenderMessage): 'human' | 'bot' | 'tool' {
  if (message.type === 'human') {
    return 'human';
  }

  const content = message.content as MessageContent;

  // 检查 content 数组中是否包含工具相关内容
  if (Array.isArray(content)) {
    const hasToolContent = content.some(
      (item) => item.type === 'tool-use' || item.type === 'tool-result'
    );
    if (hasToolContent) {
      return 'tool';
    }
  }

  return 'bot';
}

export function MessageList({ messages, loading }: MessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="space-y-6">
      {messages.map((message, index) => {
        const messageType = getMessageType(message);

        if (messageType === 'human') {
          return <HumanMessage key={`${message.id}-${index}`} message={message} />;
        }

        if (messageType === 'bot') {
          return <BotMessage key={`${message.id}-${index}`} message={message} />;
        }

        if (messageType === 'tool') {
          return <ToolMessage key={`${message.id}-${index}`} message={message} />;
        }

        return null;
      })}

      {loading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
