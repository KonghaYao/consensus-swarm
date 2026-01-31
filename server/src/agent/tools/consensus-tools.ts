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
            const dissentingConfigs = state.agentConfigs.filter((config) => dissentingAgentIds.includes(config.id));

            if (dissentingConfigs.length === 0) {
                return { message: '没有发现分歧者', newMessages: [] };
            }

            // 过滤消息，只传递讨论内容给分歧者
            const discussionMessages = state.messages.filter(
                (msg) =>
                    msg.constructor.name === 'HumanMessage' ||
                    (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg) && !('tool_calls' in msg)),
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
4. 建议的改进方案`,
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
                }),
            );

            // 构建汇总消息
            const summaryMessage = dissentingMessages.map((m) => `### ${m.agentName}:\n${m.message}`).join('\n\n');

            const humanSummary = new HumanMessage(
                `## 分歧者发言汇总\n\n${summaryMessage}\n\n---\n\n现在请其他参与者（支持者）回应分歧者的观点，尝试寻求共识。`,
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
            description: `当投票未达成 100% 共识时使用此工具。

## 使用场景
在 ask_everyone_to_vote 工具返回 consensusReached=false 后调用。

## 功能说明
- 邀请所有投反对票的 Agent 发表详细意见
- 每位分歧者会阐述反对的核心理由、担忧风险、需要的调整措施
- 工具会汇总所有分歧者的发言，返回给主持人

## 输入参数
- dissentingAgentIds: 投反对票的 Agent ID 列表（从 ask_everyone_to_vote 返回的 dissentingAgents 字段获取）
- reason: 未达成共识的原因概述（简要描述为什么需要进入分歧讨论）

## 返回结果
- 分歧者发言汇总（HumanMessage 格式）
- 包含每位分歧者的详细反对理由和改进建议

## 注意事项
调用此工具后，应让支持者回应分歧者的观点，然后重新调用 ask_everyone_to_vote 进行新一轮投票。`,
            schema: askDissentingAgentsToSpeakSchema,
        },
    );

    return askDissentingAgentsTool;
}

/**
 * 创建投票工具
 * 请求所有参会 Agent 进行投票
 */
export function createVotingTool(state: ConsensusStateType) {
    const askEveryoneToVoteSchema = z
        .object({
            proposal: z
                .string()
                .optional()
                .describe('本次投票的提案内容或主题说明（可选，建议提供以让参与者更清楚投票目的）'),
        })
        .describe('投票参数');

    const askEveryoneToVoteTool = tool(
        async (input) => {
            const { proposal } = input;

            // 检查投票轮数上限
            const currentVoteCount = (state.voteCount || 0) + 1;
            const MAX_VOTING_ROUNDS = 5;

            if (currentVoteCount > MAX_VOTING_ROUNDS) {
                return {
                    voteLimitReached: true,
                    currentVoteCount,
                    maxRounds: MAX_VOTING_ROUNDS,
                    message: `已达到最大投票轮数限制（${MAX_VOTING_ROUNDS} 轮），会议无法达成共识。请输出分歧报告并结束会议。`,
                };
            }
            // 创建所有 Agent 实例
            const allAgents = await Promise.all(
                state.agentConfigs.map((agentConfig) => {
                    return createStandardAgent(agentConfig);
                }),
            );

            // 过滤消息，只传递讨论内容
            const discussionMessages = state.messages.filter(
                (msg) =>
                    msg.constructor.name === 'HumanMessage' ||
                    (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg) && !('tool_calls' in msg)),
            );

            // 构建投票提示消息
            const votePrompt = new HumanMessage(
                `现在进入投票阶段。
请基于之前的讨论内容，决定你是否同意当前提案。

**投票主题：**${proposal || '基于前述讨论内容'}

**重要：只有所有人都投赞成票（100%同意）才能结束会议。**

请直接回复下面格式进行投票：

<vote>yes</vote> 或 <vote>no</vote>

可以附加 20 字的理由`,
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
                }),
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

            // 生成投票明细（更易读的格式）
            const voteBreakdown = voteRecords.map((record) => ({
                agent: record.agentName,
                vote: record.agree ? '赞成' : '反对',
                reason: record.reason || '无理由',
            }));

            // 返回投票结果摘要
            return {
                voteRound: currentVoteCount,
                totalVotes: totalCount,
                yesVotes: yesCount,
                noVotes: totalCount - yesCount,
                agreementRatio,
                consensusReached,
                voteRecords,
                voteBreakdown,
                dissentingAgents,
                needsFollowUp: dissentingAgents.length > 0,
                voteLimitReached: false,
                maxRounds: MAX_VOTING_ROUNDS,
            };
        },
        {
            name: 'ask_everyone_to_vote',
            description: `请求所有参会 Agent 进行投票并统计结果。

## 使用场景
在完成一轮讨论后调用，用于判断是否达成共识。

## 功能说明
- 向所有参会 Agent 发送投票请求
- 基于之前的讨论内容，每位 Agent 投票表示是否同意当前提案
- 统计投票结果，判断是否达成 100% 共识

## 输入参数
- proposal（可选）: 本次投票的提案内容或主题说明
  - 建议提供清晰的提案描述，让参与者了解具体在投票什么
  - 例如："采用方案A作为最终方案"、"批准该功能开发"等
  - 如果不提供，将使用"基于前述讨论内容"作为默认主题

## 返回结果
返回一个包含以下字段的对象：
- voteRound: 当前投票轮数（从 1 开始）
- totalVotes: 总投票数
- yesVotes: 赞成票数
- noVotes: 反对票数
- agreementRatio: 同意比例 (0-1)
- consensusReached: 是否达成共识（布尔值，100% 同意时为 true）
- voteRecords: 每位 Agent 的详细投票记录（内部格式）
- **voteBreakdown**: 投票明细（易读格式），包含每个 Agent 的投票情况：
  - agent: Agent 名称
  - vote: 投票结果（"赞成" 或 "反对"）
  - reason: 投票理由
- dissentingAgents: 投反对票的 Agent ID 列表
- needsFollowUp: 是否需要后续处理（有反对票时为 true）
- voteLimitReached: 是否达到投票轮数上限（达到 5 轮时为 true）
- maxRounds: 最大投票轮数限制（默认为 5）

## 决策流程
根据返回结果：
1. 如果 voteLimitReached = true：已达到最大投票轮数（5 轮），无法达成共识。请输出分歧报告并结束会议。
2. 如果 consensusReached = true：直接进入总结阶段，会议结束
3. 如果 consensusReached = false：
   - 检查 voteRound，如果接近上限（比如已经是第 4 轮），提醒参与者需要尽快达成共识
   - 使用 ask_*_speak 工具邀请反对者依次发言（从 dissentingAgents 获取）
   - 让支持者回应分歧者的观点
   - 重新调用 ask_everyone_to_vote 进行新一轮投票

## 重要提示
- 只有当 consensusReached=true 时才能结束会议
- 任何一票反对都会导致 consensusReached=false
- 最多进行 5 轮投票，超过后必须输出分歧报告并结束会议
- 如果无法达成共识，在分歧报告中详细记录各方的观点和无法调和的分歧点
- 使用 voteBreakdown 字段向用户展示每个 Agent 的投票情况`,
            schema: askEveryoneToVoteSchema,
        },
    );

    return askEveryoneToVoteTool;
}
