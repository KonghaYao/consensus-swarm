/**
 * 子 Agent 配置统一导出
 */
export { technicalDirectorConfig } from './technical-director.js';
export { productManagerConfig } from './product-manager.js';
export { teamLeadConfig } from './team-lead.js';
export { backendEngineerConfig } from './backend-engineer.js';
export { frontendEngineerConfig } from './frontend-engineer.js';
export { uiUxDesignerConfig } from './ui-ux-designer.js';
export { operationsSpecialistConfig } from './operations-specialist.js';
export { dataAnalystConfig } from './data-analyst.js';
export { marketingManagerConfig } from './marketing-manager.js';

/**
 * 子 Agent 配置数组
 */
import { technicalDirectorConfig } from './technical-director.js';
import { productManagerConfig } from './product-manager.js';
import { teamLeadConfig } from './team-lead.js';
import { backendEngineerConfig } from './backend-engineer.js';
import { frontendEngineerConfig } from './frontend-engineer.js';
import { uiUxDesignerConfig } from './ui-ux-designer.js';
import { operationsSpecialistConfig } from './operations-specialist.js';
import { dataAnalystConfig } from './data-analyst.js';
import { marketingManagerConfig } from './marketing-manager.js';
import type { AgentConfig } from '../../agent/types.js';

export const subAgentConfigs: AgentConfig[] = [
    technicalDirectorConfig,
    productManagerConfig,
    teamLeadConfig,
    backendEngineerConfig,
    frontendEngineerConfig,
    uiUxDesignerConfig,
    operationsSpecialistConfig,
    dataAnalystConfig,
    marketingManagerConfig,
];

/**
 * 子 Agent 配置映射表
 */
export const subAgentConfigMap: Record<string, AgentConfig> = subAgentConfigs.reduce(
    (map, config) => ({ ...map, [config.id]: config }),
    {}
);

/**
 * 按团队分组的子 Agent 配置
 */
export const subAgentConfigsByTeam: Record<string, AgentConfig[]> = {
    management: [technicalDirectorConfig, productManagerConfig, teamLeadConfig],
    development: [backendEngineerConfig, frontendEngineerConfig],
    design: [uiUxDesignerConfig],
    operations: [operationsSpecialistConfig],
    data: [dataAnalystConfig],
    marketing: [marketingManagerConfig],
};
