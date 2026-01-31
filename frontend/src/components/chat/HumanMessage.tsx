import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { MessageActions } from './MessageActions';
import { getTextContent, type RenderMessage } from '@langgraph-js/sdk';

interface HumanMessageProps {
  message: RenderMessage;
}

export function HumanMessage({ message }: HumanMessageProps) {
  const content = getTextContent(message);

  return (
    <div className="flex gap-4 group justify-end">
      <div className="flex-1 max-w-[85%] flex flex-col items-end space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">你</div>
          <MessageActions content={content} isHuman={true} />
        </div>

        <div className="text-base leading-relaxed bg-secondary rounded-3xl px-4 py-3">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </div>

      <Avatar type="human" />
    </div>
  );
}
