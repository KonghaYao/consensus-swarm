/**
 * SubmessagesDrawer - Submessages 侧边栏
 * 在右侧展示 ToolMessage 的所有 submessages，固定占用空间
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubmessagesDrawer } from '@/contexts/SubmessagesDrawerContext';
import { Avatar } from './Avatar';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { cjk } from '@streamdown/cjk';
import { getTextContent, type RenderMessage } from '@langgraph-js/sdk';
import { getAgentByName } from '@/lib/agent-data-service';
import { cn } from '@/lib/utils';

interface SubmessageCardProps {
  submessage: RenderMessage;
  index: number;
  total: number;
}

function SubmessageCard({ submessage, index, total }: SubmessageCardProps) {
  const text = getTextContent(submessage);
  const agent = submessage.name ? getAgentByName(submessage.name) : undefined;
  const agentName = agent?.role.name || submessage.name || 'AI Agent';
  const avatarSrc = agent?.avatar;

  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Submessage header */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar type="bot" src={avatarSrc} alt={agentName} className="w-6 h-6" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{agentName}</span>
          <span className="text-xs text-muted-foreground">({index + 1}/{total})</span>
        </div>
      </div>

      {/* Submessage content */}
      <div className="text-sm leading-relaxed">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Streamdown plugins={{ code, math, cjk }}>{text}</Streamdown>
        </div>
      </div>
    </div>
  );
}

interface SubmessagesDrawerProps {
  className?: string;
}

export function SubmessagesDrawer({ className }: SubmessagesDrawerProps) {
  const { open, submessages, agentName, agentAvatar, closeDrawer } = useSubmessagesDrawer();

  if (!submessages || submessages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full bg-background border-l shadow-lg transition-transform duration-300 ease-in-out z-40',
        'w-full sm:w-80 md:w-96 lg:w-[450px]',
        open ? 'translate-x-0' : 'translate-x-full',
        className
      )}
    >
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar type="bot" src={agentAvatar ?? undefined} alt={agentName || 'Agent'} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{agentName || 'Agent'}</h3>
            <p className="text-xs text-muted-foreground">
              {submessages.length} submessage{submessages.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={closeDrawer} className="shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-3.5rem)]">
        <div className="p-4 space-y-4">
          {submessages.map((submessage, index) => (
            <SubmessageCard
              key={index}
              submessage={submessage}
              index={index}
              total={submessages.length}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
