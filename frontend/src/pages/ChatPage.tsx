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
} from '../components/chat';
import DefaultTools from '../tools';

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

  useEffect(() => {
    setTools(DefaultTools);
  }, [setTools]);

  const handleSend = useCallback(async () => {
    if (!userInput.trim() || loading) return;
    await sendMessage(
      [
        {
          type: 'human',
          content: userInput,
        },
      ],
      { extraParams },
    );
    setUserInput('');
    setAutoResize(false);
  }, [userInput, loading, sendMessage, extraParams, setUserInput]);



  const handleRegenerate = useCallback(async () => {
    if (loading || renderMessages.length === 0) return;

    // 获取最后一条消息
    const lastMessage = renderMessages[renderMessages.length - 1];
    if (lastMessage.type === 'human') {
      setUserInput(lastMessage.content as string);
    }
  }, [loading, renderMessages, setUserInput]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部操作栏 */}
      <ChatHeader
        hasMessages={renderMessages.length > 0}
        loading={loading}
        onRegenerate={handleRegenerate}
        onClear={createNewChat}
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
        disabled={loading}
        placeholder="输入消息..."
      />
    </div>
  );
}
