/**
 * MessageBubble - 消息气泡组件
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import { MessageActions } from './MessageActions';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { cjk } from '@streamdown/cjk';

interface MessageBubbleProps {
  message: any;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isHuman = message.type === 'human';

  const getContent = () => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item: any) => {
          if (item.type === 'text') return item.text;
          if (item.type === 'tool-use') return `[使用工具: ${item.name}]`;
          if (item.type === 'tool-result') return `[工具结果]`;
          return '';
        })
        .join('\n');
    }
    return JSON.stringify(message.content);
  };

  const content = getContent();

  return (
    <div
      className={cn(
        'flex gap-4 group',
        isHuman ? 'justify-end' : 'justify-start',
      )}
    >
      {!isHuman && <Avatar type="bot" />}

      <div
        className={cn(
          'flex-1 max-w-[85%] space-y-2',
          isHuman && 'flex flex-col items-end',
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'text-sm',
              isHuman ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {isHuman ? 'You' : 'Chat Bot'}
          </div>
          <MessageActions content={content} isHuman={isHuman} />
        </div>

        <div
          className={cn(
            'text-base leading-relaxed',
            isHuman && 'bg-secondary rounded-3xl px-4 py-3',
          )}
        >
          {isHuman ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown plugins={{ code, math, cjk }}>{content}</Streamdown>
            </div>
          )}
        </div>
      </div>

      {isHuman && <Avatar type="human" />}
    </div>
  );
}
