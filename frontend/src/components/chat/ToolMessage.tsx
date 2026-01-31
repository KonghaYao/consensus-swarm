import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import type { RenderMessage } from '@langgraph-js/sdk';
import { getAgentByName } from '@/lib/agent-data-service';

interface ToolMessageProps {
  message: RenderMessage;
}

type MessageContent = string | { text?: string } | Array<{ type: string; name?: string; tool_name?: string; input?: any; result?: any;[key: string]: any }>;

interface ParsedToolMessage {
  type: 'tool-use' | 'tool-result';
  toolName?: string;
  result?: unknown;
}

/**
 * 解析工具消息
 */
function parseToolMessage(message: RenderMessage): ParsedToolMessage {
  const content = message.content as MessageContent;

  // 如果 content 是数组格式
  if (Array.isArray(content)) {
    // 查找 tool-use 类型
    const toolUseItem = content.find((item) => item.type === 'tool-use');
    if (toolUseItem) {
      return {
        type: 'tool-use',
        toolName: toolUseItem.name,
        result: toolUseItem.input,
      };
    }

    // 查找 tool-result 类型
    const toolResultItem = content.find((item) => item.type === 'tool-result');
    if (toolResultItem) {
      return {
        type: 'tool-result',
        toolName: toolResultItem.tool_name,
        result: toolResultItem.result,
      };
    }
  }

  // 兜底返回默认值
  return {
    type: 'tool-use',
    toolName: 'unknown',
    result: null,
  };
}

export function ToolMessage({ message }: ToolMessageProps) {
  const { type, toolName, result } = parseToolMessage(message);
  const title = type === 'tool-use' ? `使用工具: ${toolName}` : '工具结果';

  // 获取 agent 信息用于显示头像
  const agent = message.name ? getAgentByName(message.name) : undefined;
  const agentName = agent?.role.name || message.name || 'AI Agent';
  const avatarSrc = agent?.avatar;

  return (
    <div className="flex gap-4 group justify-start">
      <Avatar type="bot" src={avatarSrc} alt={agentName} />

      <div className="flex-1 max-w-[85%] space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-foreground">{agentName}</div>
        </div>

        <div className="text-sm rounded-lg border border-border bg-muted/50 px-3 py-2">
          <div className="font-medium text-muted-foreground mb-1">{title}</div>
          {type === 'tool-result' && result != null && (
            <div className="text-xs text-muted-foreground font-mono overflow-x-auto">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
