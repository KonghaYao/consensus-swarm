/**
 * MessageList - 消息列表组件
 */

import React from 'react';
import { HumanMessage } from './HumanMessage';
import { BotMessage } from './BotMessage';
import { ToolMessage } from './ToolMessage';
import { LoadingIndicator } from './LoadingIndicator';

interface MessageListProps {
  messages: any[];
  loading: boolean;
}

function getMessageContent(message: any): { type: string; content: string; toolName?: string; result?: any } {
  if (message.type === 'human') {
    return {
      type: 'human',
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    };
  }

  if (Array.isArray(message.content)) {
    for (const item of message.content) {
      if (item.type === 'tool-use') {
        return {
          type: 'tool-use',
          content: '',
          toolName: item.name,
          result: item.input,
        };
      }
      if (item.type === 'tool-result') {
        return {
          type: 'tool-result',
          content: '',
          toolName: item.tool_name,
          result: item.result,
        };
      }
      if (item.type === 'text') {
        return {
          type: 'bot',
          content: item.text,
        };
      }
    }
  }

  return {
    type: 'bot',
    content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
  };
}

export function MessageList({ messages, loading }: MessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="space-y-6">
      {messages.map((message, index) => {
        const { type, content, toolName, result } = getMessageContent(message);

        if (type === 'human') {
          return <HumanMessage key={`${message.id}-${index}`} content={content} />;
        }

        if (type === 'bot') {
          return <BotMessage key={`${message.id}-${index}`} content={content} />;
        }

        if (type === 'tool-use' || type === 'tool-result') {
          return (
            <ToolMessage
              key={`${message.id}-${index}`}
              toolName={toolName}
              type={type as 'tool-use' | 'tool-result'}
              result={result}
            />
          );
        }

        return null;
      })}

      {loading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
