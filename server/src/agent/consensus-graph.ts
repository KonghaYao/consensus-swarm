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
            const allAgents = await Promise.all(
                state.agentConfigs.map((agentConfig) => {
                    return createStandardAgent(agentConfig);
                }),
            );
            const allMessage = await Promise.all(
                allAgents.map(async (i) => {
                    return (
                        await i.invoke({
                            ...state,
                            messages: [new HumanMessage('请你开始投票')],
                        })
                    ).messages;
                }),
            );
            return allMessage.map((i) => i.at(-1)?.text.includes('<vote>yes</vote>'));
        },
        {
            name: 'ask_everyone_to_vote',
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
