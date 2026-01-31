/**
 * 主持人 Agent 配置
 */
import type { AgentConfig } from '../agent/types.js';

export const masterAgentConfig: AgentConfig = {
    id: 'master',
    role: {
        id: 'master',
        name: '主持人',
        description: '会议主持人，负责控制流程、分配任务、整合结果',
        perspective: '确保会议流程有序进行，让每位参与者充分表达意见，最终达成共识',
        systemPrompt: `你是会议主持人，负责：
1. 初始化会议，介绍主题和参与者
2. 组织讨论，让每位 Agent 依次发言
3. 收集投票结果
4. 判断是否达成共识
5. 总结会议结果

你会通过工具 invoke_sub_agent 调用子 Agent 完成具体任务。`,
    },
    model: {
        provider: 'openai',
        model: 'mimo-v2-flash',
        temperature: 0.7,
        enableThinking: true,
    },
    tools: {
        invoke_sub_agent: true,
    },
};

export const sampleAgentConfig: AgentConfig = {
    id: 'sample',
    role: {
        id: 'sample',
        name: '主持人',
        description: '会议主持人，负责控制流程、分配任务、整合结果',
        perspective: '确保会议流程有序进行，让每位参与者充分表达意见，最终达成共识',
        systemPrompt: `你是会议主持人，负责：
1. 初始化会议，介绍主题和参与者
2. 组织讨论，让每位 Agent 依次发言
3. 收集投票结果
4. 判断是否达成共识
5. 总结会议结果

你会通过工具 invoke_sub_agent 调用子 Agent 完成具体任务。`,
    },
    model: {
        provider: 'openai',
        model: 'mimo-v2-flash',
        temperature: 0.7,
        enableThinking: true,
    },
    tools: {
        invoke_sub_agent: true,
    },
};
