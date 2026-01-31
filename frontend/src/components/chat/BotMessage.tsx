import { Avatar } from './Avatar';
import { MessageActions } from './MessageActions';
import { ThinkingMessage } from './ThinkingMessage';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { cjk } from '@streamdown/cjk';
import { getTextContent, getThinkingContent, type RenderMessage } from '@langgraph-js/sdk';
import { getAgentById, getAgentByName } from '@/lib/agent-data-service';

interface BotMessageProps {
  message: RenderMessage;
  noHeader?: boolean;
}

export function BotMessage({ message, noHeader }: BotMessageProps) {
  const thinking = getThinkingContent(message);
  const text = getTextContent(message);

  // 确保 thinking 是字符串
  const thinkingStr = typeof thinking === 'string' ? thinking : '';
  const hasThinking = thinkingStr.trim().length > 0;
  // 获取 agent 信息用于显示头像
  const agent = getAgentById('master');
  const agentName = agent?.role.name || message.name || 'AI Agent';
  const avatarSrc = agent?.avatar;

  return (
    <div className="flex gap-4 group justify-start">
      {!noHeader && <Avatar type="bot" src={avatarSrc} alt={agentName} />}

      <div className="flex-1 max-w-[85%] space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-sm text-foreground">{agentName}</div>
          <MessageActions content={text} isHuman={false} />
        </div>

        {hasThinking && <ThinkingMessage content={thinkingStr} />}

        <div className="text-base leading-relaxed">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Streamdown plugins={{ code, math, cjk }}>{text}</Streamdown>
          </div>
        </div>
      </div>
    </div>
  );
}
