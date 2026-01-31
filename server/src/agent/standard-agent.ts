/**
 * Standard Agent 创建器
 * 提供统一的 Agent 创建接口
 */
import { createAgent } from 'langchain';
import { AgentConfig, UnionTool } from './types.js';
import { ConsensusAnnotation } from './consensus-state.js';
import { toolRegistry } from './tools/index.js';
import { initChatModel } from '../utils/initChatModel.js';

/**
 * 创建标准化 Agent 实例
 */
export async function createStandardAgent(
    config: AgentConfig,
    extraConfig: {
        tools?: UnionTool[];
        taskId?: string;
        passThroughKeys?: string[];
    } = {},
) {
    // 初始化聊天模型
    const chatModel = await initChatModel(config.model.model, {
        modelProvider: config.model.provider,
        temperature: config.model.temperature,
        streamUsage: true,
        enableThinking: config.model.enableThinking ?? true,
        taskId: extraConfig.taskId,
    });

    const tools: UnionTool[] = [];

    // 从配置加载工具
    const configTools = await toolRegistry.loadFromConfig(config.tools);
    tools.push(...configTools);

    // 添加额外工具
    if (extraConfig?.tools) {
        tools.push(...extraConfig.tools);
    }

    // 构建 LangChain Agent
    const agent = createAgent({
        name: extraConfig.taskId ? 'subagent_' + extraConfig.taskId : undefined,
        model: chatModel,
        tools,
        systemPrompt: buildSystemPrompt(config),
        stateSchema: ConsensusAnnotation,
        middleware: [],
    });

    return agent;
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt(config: AgentConfig): string {
    const { role } = config;

    const sections = [`你是一个${role.name}`, role.description, `你的视角是：${role.perspective}`];

    if (role.systemPrompt) {
        sections.push(role.systemPrompt);
    }

    return sections.join('\n\n');
}
