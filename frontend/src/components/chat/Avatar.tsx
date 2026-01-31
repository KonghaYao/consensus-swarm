/**
 * Avatar - 用户头像组件
 */

import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  type: 'human' | 'bot';
  className?: string;
}

export function Avatar({ type, className }: AvatarProps) {
  return (
    <div className={cn(
      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
      type === 'bot' ? "bg-primary/10" : "bg-secondary",
      className
    )}>
      {type === 'bot' ? (
        <Bot className="w-5 h-5 text-primary" />
      ) : (
        <User className="w-5 h-5 text-foreground" />
      )}
    </div>
  );
}
