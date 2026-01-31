/**
 * 共识流程图定义
 * LangGraph 实现（单 agent function 架构）
 * 使用 HOC 模式模块化工具创建
 */

import { START, StateGraph } from '@langchain/langgraph';
import { ConsensusAnnotation, ConsensusStateType } from './consensus-state.js';
import { createStandardAgent } from './standard-agent.js';
import { createDissentingAgentsTool, createVotingTool } from './tools/consensus-tools.js';
import { ask_subagents } from '../utils/ask-agents.js';
import { masterAgentConfig } from '../config/master-agent.js';

/**
 * 统一的 Agent Function
 * 根据 state.action 执行不同的操作
 *
 * 使用 HOC 模式：
 * - withConsensusTools - 为 agent 添加讨论和投票工具
 * - 逻辑清晰，职责分离
 */
async function consensusAgentFunction(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    const globalTaskStore = state.task_store;
    // 创建参与者工具
    const agentsAsTools = state.agentConfigs
        .filter((i) => i.id !== 'master')
        .map((participantConfig) => {
            return ask_subagents(
                (taskId, args, parent_state: any) => {
                    return createStandardAgent(participantConfig, {
                        taskId: taskId,
                    });
                },
                {
                    name: `ask_${participantConfig.role.id}_speak`,
                    description: participantConfig.role.description,
                    passThroughKeys: [],
                    messageFilter: 'discussion',
                    submitInnerMessage(taskStore) {
                        return Object.assign(globalTaskStore, taskStore);
                    },
                },
            );
        });

    // 创建投票工具
    const askDissentingAgentsTool = createDissentingAgentsTool(state);
    const askEveryoneToVoteTool = createVotingTool(state);

    // 创建带完整工具集的 Agent
    const agent = await createStandardAgent(masterAgentConfig, {
        tools: [...agentsAsTools, askDissentingAgentsTool, askEveryoneToVoteTool],
    });

    // 调用 agent 处理当前状态
    const newState = await agent.invoke(state, { recursionLimit: 200 });

    return {
        ...newState,
        task_store: globalTaskStore,
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
