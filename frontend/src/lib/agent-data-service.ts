// Types shared with backend
export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  temperature?: number;
  maxTokens?: number;
  enableThinking?: boolean;
  thinkingTokens?: number;
}

export interface AgentRoleConfig {
  id: string;
  name: string;
  description: string;
  perspective: string;
  systemPrompt?: string;
}

export interface AgentConfig {
  id: string;
  role: AgentRoleConfig;
  model: ModelConfig;
  tools: Record<string, boolean>;
  contextTemplate?: string;
  avatar?: string;
}

/**
 * 生成 agent 的头像 URL（使用 DiceBear API）
 */
export function generateAvatarUrl(agentId: string, agentName?: string): string {
  // 使用 notionists 风格（简笔画风格，类似 Notion 插图）
  // seed 使用 agent id 确保每次生成的头像一致
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(agentId)}`;
}

// API base URL
// 使用相对路径，开发环境通过 Vite proxy 转发，生产环境直接访问同源后端
const API_BASE_URL = '';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/agents${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  const result: ApiResponse<T> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data;
}

// ============================================
// Async API-based CRUD operations (NEW)
// ============================================

/**
 * Get all agents from API
 */
export async function getAgentsAsync(): Promise<AgentConfig[]> {
  return fetchAPI<AgentConfig[]>('', { method: 'GET' });
}

/**
 * Get single agent by ID from API
 */
export async function getAgentByIdAsync(id: string): Promise<AgentConfig | null> {
  try {
    return await fetchAPI<AgentConfig>(`/${id}`, { method: 'GET' });
  } catch {
    return null;
  }
}

/**
 * Create new agent via API
 */
export async function createAgentAsync(agent: Omit<AgentConfig, 'id'>): Promise<AgentConfig> {
  return fetchAPI<AgentConfig>('', {
    method: 'POST',
    body: JSON.stringify(agent),
  });
}

/**
 * Update agent via API
 */
export async function updateAgentAsync(id: string, updates: Partial<AgentConfig>): Promise<AgentConfig | null> {
  try {
    return await fetchAPI<AgentConfig>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch {
    return null;
  }
}

/**
 * Delete agent via API
 */
export async function deleteAgentAsync(id: string): Promise<boolean> {
  try {
    await fetchAPI<{ id: string }>(`/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset agents to defaults via API
 */
export async function resetAgentsAsync(): Promise<AgentConfig[]> {
  return fetchAPI<AgentConfig[]>('/reset', { method: 'POST' });
}

// ============================================
// Legacy sync operations (DEPRECATED)
// These are kept for backward compatibility
// but will be removed in future versions
// ============================================

// Initial data from backend config files (mirrored)
const masterAgentConfig: AgentConfig = {
  id: 'master',
  role: {
    id: 'master',
    name: '主持人',
    description: '会议主持人，负责控制流程、分配任务、整合结果',
    perspective: '确保会议流程有序进行，让每位参与者充分表达意见，最终达成共识',
    systemPrompt: `你是此次会议的主持人，负责协调多智能体讨论并达成共识。`,
  },
  model: {
    provider: 'openai',
    model: 'mimo-v2-flash',
    temperature: 0.7,
    enableThinking: false,
  },
  tools: {},
  avatar: generateAvatarUrl('master', '主持人'),
};

const subAgentConfigs: AgentConfig[] = [
  {
    id: 'technical-director',
    role: {
      id: 'technical-director',
      name: '技术总监',
      description: '负责技术架构、技术选型和技术决策',
      perspective: '从技术可行性、性能、安全性和可维护性角度评估方案',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('technical-director', '技术总监'),
  },
  {
    id: 'product-manager',
    role: {
      id: 'product-manager',
      name: '产品经理',
      description: '负责产品需求、用户体验和产品规划',
      perspective: '从用户需求、产品价值和市场竞争力角度思考问题',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('product-manager', '产品经理'),
  },
  {
    id: 'team-lead',
    role: {
      id: 'team-lead',
      name: '团队负责人',
      description: '负责团队管理和项目协调',
      perspective: '平衡技术需求与团队资源，确保项目按时交付',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('team-lead', '团队负责人'),
  },
  {
    id: 'backend-engineer',
    role: {
      id: 'backend-engineer',
      name: '后端工程师',
      description: '负责后端开发和 API 设计',
      perspective: '关注后端架构、API 设计、数据库和服务端性能',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('backend-engineer', '后端工程师'),
  },
  {
    id: 'frontend-engineer',
    role: {
      id: 'frontend-engineer',
      name: '前端工程师',
      description: '负责前端开发和用户界面实现',
      perspective: '关注前端技术栈、用户体验和界面交互',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('frontend-engineer', '前端工程师'),
  },
  {
    id: 'ui-ux-designer',
    role: {
      id: 'ui-ux-designer',
      name: 'UI/UX 设计师',
      description: '负责界面设计和用户体验设计',
      perspective: '从视觉设计和用户体验角度评估产品',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('ui-ux-designer', 'UI/UX设计师'),
  },
  {
    id: 'operations-specialist',
    role: {
      id: 'operations-specialist',
      name: '运维专家',
      description: '负责系统运维和部署',
      perspective: '关注系统稳定性、可部署性和运维效率',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('operations-specialist', '运维专家'),
  },
  {
    id: 'data-analyst',
    role: {
      id: 'data-analyst',
      name: '数据分析师',
      description: '负责数据分析和数据洞察',
      perspective: '从数据角度分析问题，提供数据支持',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('data-analyst', '数据分析师'),
  },
  {
    id: 'marketing-manager',
    role: {
      id: 'marketing-manager',
      name: '市场经理',
      description: '负责市场营销和推广策略',
      perspective: '从市场需求和品牌角度思考问题',
    },
    model: {
      provider: 'openai',
      model: 'mimo-v2-flash',
      temperature: 0.7,
    },
    tools: {},
    avatar: generateAvatarUrl('marketing-manager', '市场经理'),
  },
];

// Initial data from backend config files
const initialAgents: AgentConfig[] = [masterAgentConfig, ...subAgentConfigs];

// In-memory state
let agents: AgentConfig[] = [...initialAgents];

// Deprecated: Use getAgentsAsync() instead
/** @deprecated Use getAgentsAsync() instead */
export function getAgents(): AgentConfig[] {
  return agents;
}

// Deprecated: Use getAgentByIdAsync() instead
/** @deprecated Use getAgentByIdAsync() instead */
export function getAgentById(id: string): AgentConfig | undefined {
  return agents.find((agent) => agent.id === id);
}

// Deprecated: Use getAgentByIdAsync() instead
/** @deprecated Use getAgentByIdAsync() instead */
export function getAgentByName(name: string): AgentConfig | undefined {
  return agents.find((agent) => agent.role.name === name);
}

// Deprecated: Use getAgentByIdAsync() instead
/** @deprecated Use getAgentByIdAsync() instead */
export function getAgentByRoleId(id: string): AgentConfig | undefined {
  return agents.find((agent) => agent.role.id === id);
}

// Deprecated: Use createAgentAsync() instead
/** @deprecated Use createAgentAsync() instead */
export function createAgent(agent: Omit<AgentConfig, 'id'>): AgentConfig {
  const newAgent: AgentConfig = {
    ...agent,
    id: `agent-${Date.now()}`,
  };
  agents.push(newAgent);
  return newAgent;
}

// Deprecated: Use updateAgentAsync() instead
/** @deprecated Use updateAgentAsync() instead */
export function updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | null {
  const index = agents.findIndex((agent) => agent.id === id);
  if (index === -1) return null;

  agents[index] = { ...agents[index], ...updates };
  return agents[index];
}

// Deprecated: Use deleteAgentAsync() instead
/** @deprecated Use deleteAgentAsync() instead */
export function deleteAgent(id: string): boolean {
  const initialLength = agents.length;
  agents = agents.filter((agent) => agent.id !== id);
  return agents.length < initialLength;
}

// Deprecated: Use resetAgentsAsync() instead
/** @deprecated Use resetAgentsAsync() instead */
export function resetAgents(): void {
  agents = [...initialAgents];
}
