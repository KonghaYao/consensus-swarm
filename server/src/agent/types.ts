/**
 * Standard Agent 类型定义
 * 统一的多智能体抽象接口
 */

import { BaseMessage } from '@langchain/core/messages';

/**
 * Agent 错误码
 */
export enum AgentErrorCode {
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    INIT_FAILED = 'INIT_FAILED',
    EXECUTE_FAILED = 'EXECUTE_FAILED',
    TIMEOUT = 'TIMEOUT',
    INVALID_STATE = 'INVALID_STATE',
}

/**
 * Agent 错误类
 */
export class AgentError extends Error {
    constructor(message: string, public code: AgentErrorCode, public details?: Record<string, unknown>) {
        super(message);
        this.name = 'AgentError';
    }
}

/**
 * Agent 配置模型参数
 */
export interface ModelConfig {
    provider: 'anthropic' | 'openai' | 'google';
    model: string;
    temperature?: number;
    maxTokens?: number;
    enableThinking?: boolean;
    thinkingTokens?: number;
}

/**
 * Agent 角色配置
 */
export interface AgentRoleConfig {
    id: string;
    name: string;
    description: string;
    perspective: string;
    systemPrompt?: string;
}

/**
 * Agent 配置（完全配置化）
 */
export interface AgentConfig {
    id: string;
    role: AgentRoleConfig;
    model: ModelConfig;
    tools: Record<string, boolean>; // 工具开关
    contextTemplate?: string;
}

/**
 * 工具定义
 */
export interface ToolDefinition {
    name: string;
    description: string;
    factory: () => Promise<UnionTool>;
}

/**
 * 工具注册表
 */
export interface ToolRegistry {
    [name: string]: ToolDefinition;
}

/**
 * 会议参与者
 */
export interface Participant {
    id: string;
    name: string;
    perspective: string;
}

/**
 * Agent 执行结果
 */
export interface AgentResult {
    agentId: string;
    message: BaseMessage;
    metadata?: Record<string, unknown>;
}

/**
 * 标准化 Agent 接口
 */
export interface StandardAgent {
    id: string;
    config: AgentConfig;
    execute(input: AgentInput): Promise<AgentResult>;
    updateConfig(config: Partial<AgentConfig>): void;
}

/**
 * Agent 执行输入
 */
export interface AgentInput {
    messages: BaseMessage[];
    context?: Record<string, unknown>;
}

/** langchain 的 Tool 定义非常混乱，暂时先屏蔽这个问题 */
export type UnionTool = any;
