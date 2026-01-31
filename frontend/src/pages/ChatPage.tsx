/**
 * ChatPage - 聊天页面
 */

import { useEffect, useState, useCallback } from 'react';
import { useChat } from '@langgraph-js/sdk/react';
import { useSettings } from '@/provider/SettingsProvider';
import {
  WelcomeState,
  MessageList,
  ErrorMessage,
  ChatInput,
  ChatHeader,
  MeetingInitForm,
} from '../components/chat';
import DefaultTools from '../tools';
import { getAgents, type AgentConfig } from '@/lib/agent-data-service';

export function ChatPage() {
  const {
    renderMessages,
    userInput,
    loading,
    inChatError,
    setUserInput,
    sendMessage,
    setTools,
    createNewChat,
  } = useChat();
  const { extraParams } = useSettings();

  const [autoResize, setAutoResize] = useState(false);
  const [agents] = useState(getAgents());
  const [selectedAgentId, setSelectedAgentId] = useState('master');
  const [isInitialized, setIsInitialized] = useState(false);
  const [meetingConfig, setMeetingConfig] = useState<{
    topic: string;
    context: string;
    selectedAgents: AgentConfig[];
  } | null>(null);

  useEffect(() => {
    setTools(DefaultTools);
  }, [setTools]);

  const handleMeetingInit = useCallback(async (data: {
    topic: string;
    context: string;
    selectedAgents: string[];
  }) => {
    const selectedAgentConfigs = agents.filter((a) =>
      data.selectedAgents.includes(a.id)
    );

    // 构建初始化消息
    const initMessage = `会议开始！
主题：${data.topic}
参会人员：${selectedAgentConfigs.map((c) => c.role.name).join(', ')}

**重要规则：**
- 必须所有参与者达成共识（100%同意）才能结束会议
- 不限制投票次数，直到达成共识
- 投票未达成共识时，反对者需要详细说明理由，支持者回应后再次投票

${data.context ? `**背景信息：**\n${data.context}\n` : ''}请各位发表意见。`;

    // 发送初始化消息
    await sendMessage(
      [
        {
          type: 'human',
          content: initMessage,
        },
      ],
      {
        extraParams: {
          ...extraParams,
          agentId: selectedAgentId,
          topic: data.topic,
          context: data.context || {},
          agentConfigs: selectedAgentConfigs,
        },
      },
    );

    setMeetingConfig({
      topic: data.topic,
      context: data.context,
      selectedAgents: selectedAgentConfigs,
    });
    setIsInitialized(true);
  }, [agents, sendMessage, extraParams, selectedAgentId]);

  const handleSend = useCallback(async () => {
    if (!userInput.trim() || loading) return;
    await sendMessage(
      [
        {
          type: 'human',
          content: userInput,
        },
      ],
      {
        extraParams: {
          ...extraParams,
          agentId: selectedAgentId,
        },
      },
    );
    setUserInput('');
    setAutoResize(false);
  }, [userInput, loading, sendMessage, extraParams, setUserInput, selectedAgentId]);



  const handleRegenerate = useCallback(async () => {
    if (loading || renderMessages.length === 0) return;

    // 获取最后一条消息
    const lastMessage = renderMessages[renderMessages.length - 1];
    if (lastMessage.type === 'human') {
      setUserInput(lastMessage.content as string);
    }
  }, [loading, renderMessages, setUserInput]);

  const handleAgentChange = useCallback((agentId: string) => {
    // 只更新选中的 agent，不清空聊天
    setSelectedAgentId(agentId);
  }, []);

  const handleClear = useCallback(() => {
    createNewChat();
    setIsInitialized(false);
    setMeetingConfig(null);
  }, [createNewChat]);

  // 如果还没初始化，显示初始化表单
  if (!isInitialized) {
    return (
      <div className="h-full flex flex-col bg-background overflow-hidden">
        <ChatHeader
          hasMessages={false}
          loading={loading}
          onRegenerate={handleRegenerate}
          onClear={handleClear}
          showAgentSelector={false}
        />
        <div className="flex-1 overflow-y-auto">
          <MeetingInitForm agents={agents} onSubmit={handleMeetingInit} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部操作栏 */}
      <ChatHeader
        hasMessages={renderMessages.length > 0}
        loading={loading}
        onRegenerate={handleRegenerate}
        onClear={handleClear}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={handleAgentChange}
        showAgentSelector={true}
      />

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {renderMessages.length === 0 ? (
            <WelcomeState />
          ) : (
            <MessageList messages={renderMessages} loading={loading} />
          )}

          {inChatError && <ErrorMessage message={inChatError} />}
        </div>
      </div>

      {/* 输入区域 */}
      <ChatInput
        value={userInput}
        onChange={setUserInput}
        onSend={handleSend}
        disabled={false}
        loading={loading}
        placeholder="输入消息..."
      />
    </div>
  );
}
