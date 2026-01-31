import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { MessageActions } from './MessageActions';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { cjk } from '@streamdown/cjk';

interface BotMessageProps {
  content: string;
  onCopy?: () => void;
}

export function BotMessage({ content, onCopy }: BotMessageProps) {
  return (
    <div className="flex gap-4 group justify-start">
      <Avatar type="bot" />

      <div className="flex-1 max-w-[85%] space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-foreground">Zen Worker</div>
          <MessageActions content={content} isHuman={false} />
        </div>

        <div className="text-base leading-relaxed">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Streamdown plugins={{ code, math, cjk }}>{content}</Streamdown>
          </div>
        </div>
      </div>
    </div>
  );
}
