import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import type { RenderMessage } from '@langgraph-js/sdk';
import { generateAvatarUrl, getAgentByName, getAgentByRoleId } from '@/lib/agent-data-service';
import { MessageList } from './MessageList';
import { BotMessage } from './BotMessage';

interface ToolMessageProps {
  message: RenderMessage;
}

export function ToolMessage({ message }: ToolMessageProps) {
  const agentId = message.name?.replace('ask_', '').replace('_speak', '')! || 'master';

  // 获取 agent 信息用于显示头像
  const agent = agentId ? getAgentByRoleId(agentId) : undefined;
  console.log(message);
  const agentName = agent?.role.name || message.name || 'AI Agent';
  const avatarSrc = generateAvatarUrl(agentId);
  const lastMessage = message.sub_messages?.at(-1);
  return (
    <div className="flex gap-4 group justify-start">
      <Avatar type="bot" src={avatarSrc} alt={agentName} />
      <div className="flex-1 max-w-[85%] space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-foreground">{agentName}</div>
        </div>
        {lastMessage ? <BotMessage message={lastMessage} noHeader></BotMessage> : null}
        {/* <div className="text-sm rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <div className="font-medium text-muted-foreground mb-1">{title}</div>
                    {type === 'tool-result' && result != null && (
                        <div className="text-xs text-muted-foreground font-mono overflow-x-auto">
                            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                        </div>
                    )}
                </div> */}
      </div>
    </div>
  );
}
