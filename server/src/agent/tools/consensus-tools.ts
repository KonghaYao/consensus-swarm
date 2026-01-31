/**
 * 共识工具集
 * 使用 HOC 模式创建投票和讨论工具
 */

import { tool } from 'langchain';
import { z } from 'zod';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { createStandardAgent } from '../standard-agent';
import type { ConsensusStateType } from '../consensus-state';
import type { AgentConfig } from '../types';

/**
 * 创建分歧讨论工具
 * 当投票未达成共识时，邀请反对的 Agent 发表详细意见
 */
export function createDissentingAgentsTool(state: ConsensusStateType) {
  const askDissentingAgentsToSpeakSchema = z.object({
    dissentingAgentIds: z.array(z.string()).describe('反对的 Agent ID 列表'),
    reason: z.string().describe('未达成共识的原因概述'),
  });

  const askDissentingAgentsTool = tool(
    async (input: z.infer<typeof askDissentingAgentsToSpeakSchema>) => {
      const { dissentingAgentIds, reason } = input;

      // 获取分歧者的配置
      const dissentingConfigs = state.agentConfigs.filter((config) =>
        dissentingAgentIds.includes(config.id)
      );

      if (dissentingConfigs.length === 0) {
        return { message: '没有发现分歧者', newMessages: [] };
      }

      // 过滤消息，只传递讨论内容给分歧者
      const discussionMessages = state.messages.filter(
        (msg) =>
          msg.constructor.name === 'HumanMessage' ||
          (msg.constructor.name === 'AIMessage' &&
            !('_tool_calls' in msg) &&
            !('tool_calls' in msg))
      );

      // 构建分歧讨论提示
      const discussPrompt = new HumanMessage(
        `由于未达成共识，现在进入分歧讨论阶段。
分歧原因：${reason}

请详细阐述你反对的理由，并说明需要满足什么条件才能支持该提案。

请围绕以下要点发言：
1. 反对的核心理由
2. 具体的担忧或风险
3. 需要的调整或补偿措施
4. 建议的改进方案`
      );

      // 让分歧者依次发言
      const dissentingMessages = await Promise.all(
        dissentingConfigs.map(async (agentConfig) => {
          const agent = await createStandardAgent(agentConfig);
          const result = await agent.invoke({
            ...state,
            messages: [...discussionMessages, discussPrompt],
          });
          const lastMessage = result.messages[result.messages.length - 1];
          return {
            agentId: agentConfig.id,
            agentName: agentConfig.role.name,
            message: lastMessage?.text || '',
          };
        })
      );

      // 构建汇总消息
      const summaryMessage = dissentingMessages
        .map((m) => `### ${m.agentName}:\n${m.message}`)
        .join('\n\n');

      const humanSummary = new HumanMessage(
        `## 分歧者发言汇总\n\n${summaryMessage}\n\n---\n\n现在请其他参与者（支持者）回应分歧者的观点，尝试寻求共识。`
      );

      return {
        message: `已邀请 ${dissentingConfigs.length} 位分歧者发言`,
        dissentingAgents: dissentingConfigs.map((c) => ({
          id: c.id,
          name: c.role.name,
        })),
        newMessages: [humanSummary],
      };
    },
    {
      name: 'ask_dissenting_agents_to_speak',
      description:
        '当投票未达成共识时，邀请反对的 Agent 发表详细意见，阐述反对理由和改进建议',
      schema: askDissentingAgentsToSpeakSchema,
    }
  );

  return askDissentingAgentsTool;
}

/**
 * 创建投票工具
 * 请求所有参会 Agent 进行投票
 */
export function createVotingTool(state: ConsensusStateType) {
  const askEveryoneToVoteSchema = z.object({}).describe('无需参数');

  const askEveryoneToVoteTool = tool(
    async () => {
      // 创建所有 Agent 实例
      const allAgents = await Promise.all(
        state.agentConfigs.map((agentConfig) => {
          return createStandardAgent(agentConfig);
        })
      );

      // 过滤消息，只传递讨论内容
      const discussionMessages = state.messages.filter(
        (msg) =>
          msg.constructor.name === 'HumanMessage' ||
          (msg.constructor.name === 'AIMessage' &&
            !('_tool_calls' in msg) &&
            !('tool_calls' in msg))
      );

      // 构建投票提示消息
      const votePrompt = new HumanMessage(
        `现在进入投票阶段。
请基于之前的讨论内容，决定你是否同意当前提案。

**重要：只有所有人都投赞成票（100%同意）才能结束会议。**

回复格式：
<vote>yes</vote> 或 <vote>no</vote>

投票后请简要说明理由。`
      );

      // 并发调用所有 Agent 进行投票
      const allMessages = await Promise.all(
        allAgents.map(async (agent, index) => {
          const result = await agent.invoke({
            ...state,
            messages: [...discussionMessages, votePrompt],
          });
          return {
            agentConfig: state.agentConfigs[index],
            messages: result.messages,
          };
        })
      );

      // 解析投票结果
      const voteRecords = allMessages.map(({ agentConfig, messages }) => {
        const lastMessage = messages[messages.length - 1];
        const text = lastMessage?.text || '';
        const hasYesVote = text.includes('<vote>yes</vote>');

        return {
          agentId: agentConfig.id,
          agentName: agentConfig.role.name,
          agree: hasYesVote,
          reason: text.replace(/<vote>yes<\/vote>|<vote>no<\/vote>/g, '').trim() || '',
          timestamp: Date.now(),
        };
      });

      // 统计投票结果
      const yesCount = voteRecords.filter((v) => v.agree).length;
      const totalCount = voteRecords.length;
      const agreementRatio = yesCount / totalCount;
      const consensusReached = yesCount === totalCount; // 100% 共识

      // 获取分歧者
      const dissentingAgents = voteRecords.filter((v) => !v.agree).map((v) => v.agentId);

      // 返回投票结果摘要
      return {
        totalVotes: totalCount,
        yesVotes: yesCount,
        noVotes: totalCount - yesCount,
        agreementRatio,
        consensusReached,
        voteRecords,
        dissentingAgents,
        needsFollowUp: dissentingAgents.length > 0,
      };
    },
    {
      name: 'ask_everyone_to_vote',
      description: '请求所有参会 Agent 进行投票，基于之前的讨论内容决定是否同意提案',
      schema: askEveryoneToVoteSchema,
    }
  );

  return askEveryoneToVoteTool;
}
