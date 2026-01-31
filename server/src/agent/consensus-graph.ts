/**
 * 共识流程图定义
 * LangGraph 实现（单 agent function 架构）
 */

import { START, StateGraph } from '@langchain/langgraph';
import { ConsensusAnnotation, ConsensusStateType, MeetingStage } from './consensus-state.js';
import { createStandardAgent } from './standard-agent.js';
import { ask_subagents } from '../utils/ask-agents.js';
import { HumanMessage } from '@langchain/core/messages';
import { tool } from 'langchain';
import { masterAgentConfig } from '../config/master-agent.js';

/**
 * 统一的 Agent Function
 * 根据 state.action 执行不同的操作
 */
async function consensusAgentFunction(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    if (state.stage === MeetingStage.INITIAL) {
        // 添加初始化消息
        const initMessage = `会议开始！
主题：${state.topic}
参会人员：${state.agentConfigs.map((c) => c.role.name).join(', ')}
请各位发表意见。`;
        state.messages.push(new HumanMessage(initMessage));
    }

    const agentsAsTools = state.agentConfigs.map((agentConfig) => {
        return ask_subagents(
            (task_id, args, parent_state: any) => {
                return createStandardAgent(agentConfig, {
                    task_id,
                });
            },
            {
                name: `ask_${agentConfig.role.id}_speak`,
                description: agentConfig.role.description,
            },
        );
    });
    const ask_everyone_to_vote = tool(
        async () => {
            // 创建所有 Agent 实例
            const allAgents = await Promise.all(
                state.agentConfigs.map((agentConfig) => {
                    return createStandardAgent(agentConfig);
                }),
            );

            // 构建投票提示消息，包含之前的讨论历史
            const votePrompt = new HumanMessage(
                `现在进入投票阶段。
请基于之前的讨论内容，决定你是否同意当前提案。

回复格式：
<vote>yes</vote> 或 <vote>no</vote>`,
            );

            // 并发调用所有 Agent 进行投票
            const allMessages = await Promise.all(
                allAgents.map(async (agent, index) => {
                    const result = await agent.invoke({
                        ...state,
                        messages: [...state.messages, votePrompt],
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
                    timestamp: Date.now(),
                };
            });

            // 统计投票结果
            const yesCount = voteRecords.filter((v) => v.agree).length;
            const totalCount = voteRecords.length;
            const agreementRatio = yesCount / totalCount;

            // 返回投票结果摘要
            return {
                totalVotes: totalCount,
                yesVotes: yesCount,
                noVotes: totalCount - yesCount,
                agreementRatio,
                consensusReached: agreementRatio >= state.consensusThreshold,
                voteRecords,
            };
        },
        {
            name: 'ask_everyone_to_vote',
            description: '请求所有参会 Agent 进行投票，基于之前的讨论内容决定是否同意提案',
        },
    );
    const agent = await createStandardAgent(masterAgentConfig, {
        tools: [...agentsAsTools, ask_everyone_to_vote],
    });

    const newState = await agent.invoke(state);

    return {
        ...newState,
        stage: MeetingStage.DISCUSSION,
    };
}

/**
 * 创建共识流程图
 */
export function createConsensusGraph() {
    const graph = new StateGraph(ConsensusAnnotation).addNode('agent', consensusAgentFunction).addEdge(START, 'agent');
    return graph.compile();
}

// 导出单例实例
export const consensusGraph = createConsensusGraph();
