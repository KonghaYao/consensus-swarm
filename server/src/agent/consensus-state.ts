/**
 * 共识流程状态定义
 */

import { BaseMessage } from '@langchain/core/messages';
import { createState, createDefaultAnnotation } from '@langgraph-js/pro';
import { MessagesAnnotation } from '@langchain/langgraph';
import { AgentConfig } from './types.js';

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
export const ConsensusAnnotation = createState(MessagesAnnotation).build({
    /** 会议主题 - 所有 Agent 讨论的核心话题 */
    topic: createDefaultAnnotation(() => ''),

    /** 额外上下文 - 提供给 Agent 的补充信息 */
    context: createDefaultAnnotation(() => ({})),

    /** Agent 配置列表 - 所有参与者的完整配置 */
    agentConfigs: createDefaultAnnotation(() => [] as AgentConfig[]),

    /**
     * 当前动作 - 主持人 Agent 根据此字段决定执行什么操作
     * INITIALIZE → DISCUSS → VOTE → CHECK_CONSENSUS → SUMMARIZE → FINISH
     */
    action: createDefaultAnnotation(() => MeetingAction.INITIALIZE),

    /**
     * 当前阶段 - 用于状态追踪和外部查询
     * INITIAL → DISCUSSION → VOTING → CONSENSUS/SUMMARY/FAILED
     */
    stage: createDefaultAnnotation(() => MeetingStage.INITIAL),

    /** 轮次历史 - 记录每一轮的讨论和投票结果 */
    rounds: createDefaultAnnotation(() => [] as RoundInfo[]),

    /** 当前轮次号 - 从 0 开始，讨论时递增 */
    currentRound: createDefaultAnnotation(() => 0),

    /** 最大轮次限制 - 防止无限讨论 */
    maxRounds: createDefaultAnnotation(() => 5),

    /** 共识阈值 - 达成共识所需的同意比例（1.0 = 绝对共识） */
    consensusThreshold: createDefaultAnnotation(() => 1.0),

    /** 会议总结 - 会议结束后生成的总结内容 */
    summary: createDefaultAnnotation(() => ''),

    /** 错误信息 - 记录流程中发生的错误 */
    error: createDefaultAnnotation(() => ''),
});

export type ConsensusStateType = typeof ConsensusAnnotation.State;
