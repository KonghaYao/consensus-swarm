/**
 * Avatar - 用户头像组件
 */

import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  type: 'human' | 'bot';
  className?: string;
  src?: string;
  alt?: string;
}

export function Avatar({ type, className, src, alt }: AvatarProps) {
  // 如果有图片地址，显示图片
  if (src) {
    return (
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-primary/10",
        className
      )}>
        <img
          src={src}
          alt={alt || (type === 'bot' ? 'AI Agent' : 'User')}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // 否则显示默认图标
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
