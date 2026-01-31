/**
 * 会议配置
 */
export interface MeetingConfig {
    id: string;
    topic: string;
    maxRounds: number;
    consensusThreshold: number;
    context?: Record<string, unknown>;
}

export const meetingConfig: MeetingConfig = {
    id: 'meeting-001',
    topic: '如何提高团队协作效率',
    maxRounds: 5,
    consensusThreshold: 1.0,
    context: {
        teamSize: 10,
        currentIssues: ['沟通不及时', '任务分配不明确'],
    },
};
