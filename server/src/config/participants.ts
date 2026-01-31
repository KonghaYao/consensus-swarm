/**
 * 参与者配置 - 多团队 Agent
 */
import type { Participant } from '../agent/types.js';

export const participants: Participant[] = [
    // 管理团队
    {
        id: 'participant-001',
        name: '技术总监',
        perspective: '从技术角度出发，关注工具和流程的优化，技术架构的可扩展性和可维护性',
    },
    {
        id: 'participant-002',
        name: '产品经理',
        perspective: '从产品角度出发，关注用户需求、产品定位、项目进度和市场竞争力',
    },
    {
        id: 'participant-003',
        name: '团队负责人',
        perspective: '从管理角度出发，关注团队氛围、人员发展、资源分配和协作效率',
    },

    // 研发团队
    {
        id: 'participant-004',
        name: '后端工程师',
        perspective: '从后端开发角度出发，关注系统性能、API 设计、数据库优化和代码质量',
    },
    {
        id: 'participant-005',
        name: '前端工程师',
        perspective: '从前端开发角度出发，关注用户体验、界面交互、响应式设计和前端工程化',
    },

    // 设计团队
    {
        id: 'participant-006',
        name: 'UI/UX 设计师',
        perspective: '从设计角度出发，关注用户界面美观度、交互流畅度、可用性和无障碍设计',
    },

    // 运营团队
    {
        id: 'participant-007',
        name: '运营专员',
        perspective: '从运营角度出发，关注用户增长、留存率、活动策划和数据反馈',
    },

    // 数据团队
    {
        id: 'participant-008',
        name: '数据分析师',
        perspective: '从数据角度出发，关注数据采集、分析报告、指标监控和数据驱动决策',
    },

    // 市场团队
    {
        id: 'participant-009',
        name: '市场经理',
        perspective: '从市场角度出发，关注品牌推广、营销策略、竞品分析和市场趋势',
    },
];
