/**
 * Graph Builder
 * 从 agents/code/graph.ts 迁移并重构
 */

import { createAgent, initChatModel, Runtime } from 'langchain';
import { CodeAnnotation as CodeState, CodeStateType } from './state.js';
import { START, StateGraph } from '@langchain/langgraph';


const agentFunction = async (state: CodeStateType, runtime: Runtime) => {
    const agent = createAgent({
        model: await initChatModel(state.main_model, {
            modelProvider: state.provider || 'openai',
            streamUsage: true,
            enableThinking: state.enable_thinking ?? true,
        }),
        tools: [],
        middleware: []
    })
    return await agent.invoke(state)
}

/**
 * 创建 Code Graph
 * 这是主要的导出函数，用于创建 LangGraph 实例
 */
export function createEntrypointGraph() {
    return new StateGraph(CodeState)
        .addNode('graph', agentFunction)
        .addEdge(START, 'graph')
        .compile();
}

// 导出单例实例
export const graph = createEntrypointGraph();
