/**
 * 共识流程状态定义
 */

import { BaseMessage } from '@langchain/core/messages';
import { createState, createDefaultAnnotation } from '@langgraph-js/pro';
import { MessagesAnnotation } from '@langchain/langgraph';
import { AgentConfig } from './types.js';
import { SubAgentAnnotation } from '../utils/ask-agents.js';
import { agentsService, initializeAgentsDatabase } from '../services/agents.service.js';

/**
 * Load agent configs from database (with fallback to static configs)
 */
async function loadAgentConfigs(): Promise<AgentConfig[]> {
    try {
        await initializeAgentsDatabase();
        return agentsService.getAllAgents();
    } catch (error) {
        console.error('Failed to load agent configs from database, using fallback:', error);
        // Fallback to empty array - will be populated by frontend via extraParams
        return [];
    }
}

/**
 * Synchronously get initial agent configs
 * Note: Database is initialized asynchronously on first API call
 * This is just a fallback for when agentConfigs is not provided via extraParams
 */
function getInitialAgentConfigs(): AgentConfig[] {
    // Return empty array - actual configs will be provided by frontend via extraParams
    // or loaded from database on API calls
    return [];
}

/**
 * 会议动作（Agent 根据此字段决定执行什么操作）
 */
export enum MeetingAction {
    INITIALIZE = 'initialize',
    DISCUSS = 'discuss',
    VOTE = 'vote',
    CHECK_CONSENSUS = 'check_consensus',
    SUMMARIZE = 'summarize',
    FINISH = 'finish',
}

/**
 * 最大投票轮数限制
 * 超过此轮数仍未达成共识时，将强制结束会议并输出分歧报告
 */
export const MAX_VOTING_ROUNDS = 5;

/**
 * 会议阶段（用于状态追踪）
 */
export enum MeetingStage {
    INITIAL = 'initial',
    DISCUSSION = 'discussion',
    VOTING = 'voting',
    CONSENSUS = 'consensus',
    SUMMARY = 'summary',
    FAILED = 'failed',
}

/**
 * Agent 观点记录
 * - 保存每个 Agent 在讨论阶段发表的完整观点
 * - 包含 Agent 消息、立场描述和时间戳
 * - 用于后续投票和共识判断时回顾
 */
export interface AgentViewpoint {
    /** Agent 的唯一标识 */
    agentId: string;
    /** Agent 的显示名称 */
    agentName: string;
    /** Agent 发表的完整消息内容 */
    message: BaseMessage;
    /** Agent 的立场描述（从消息中提取或 Agent 提供） */
    position: string;
    /** 观点发表的时间戳 */
    timestamp: number;
}

/**
 * 投票记录
 * - 保存每个 Agent 的投票结果和理由
 * - 用于统计共识达成情况
 */
export interface VoteRecord {
    /** Agent 的唯一标识 */
    agentId: string;
    /** Agent 的显示名称 */
    agentName: string;
    /** 是否同意提案 */
    agree: boolean;
    /** 投票理由（可选） */
    reason?: string;
    /** 投票时间戳 */
    timestamp: number;
}

/**
 * 轮次信息
 * - 记录每一轮讨论和投票的完整信息
 * - 用于历史回顾和决策追踪
 */
export interface RoundInfo {
    /** 轮次编号（从 1 开始） */
    roundNumber: number;
    /** 本轮所有 Agent 的观点集合 */
    viewpoints: AgentViewpoint[];
    /** 本轮所有 Agent 的投票结果 */
    votes?: VoteRecord[];
    /** 本轮是否达成共识 */
    consensusReached: boolean;
}

/**
 * 共识流程状态定义
 * - 基于 LangGraph 的状态管理
 * - 主持人 Agent 通过 action 字段控制流程转换
 */
export const ConsensusAnnotation = createState(MessagesAnnotation, SubAgentAnnotation).build({
    /** Agent 配置列表 - 所有参与者的完整配置 */
    agentConfigs: createDefaultAnnotation(() => getInitialAgentConfigs() as AgentConfig[]),
    /**
     * 当前阶段 - 用于状态追踪和外部查询
     * INITIAL → DISCUSSION → VOTING → CONSENSUS/SUMMARY/FAILED
     */
    stage: createDefaultAnnotation(() => MeetingStage.INITIAL),
    /**
     * 当前投票轮数
     * 从 0 开始，每次调用 ask_everyone_to_vote 后递增
     * 达到 MAX_VOTING_ROUNDS 时强制结束会议
     */
    voteCount: createDefaultAnnotation(() => 0),
});

/**
 * Re-export load function for external use
 */
export { loadAgentConfigs, initializeAgentsDatabase };

export type ConsensusStateType = typeof ConsensusAnnotation.State;
