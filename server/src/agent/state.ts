/**
 * Agent 状态定义
 * 从 agents/code/state.ts 迁移
 */

import { createDefaultAnnotation, createState } from '@langgraph-js/pro';
import { MessagesAnnotation } from '@langchain/langgraph';


export const CodeAnnotation = createState(MessagesAnnotation).build({
    main_model: createDefaultAnnotation(() => 'mimo-v2-flash'),
    provider: createDefaultAnnotation(() => 'openai'),
    enable_thinking: createDefaultAnnotation(() => true),
    agent_name: createDefaultAnnotation(() => 'Agent'),
});

export type CodeStateType = typeof CodeAnnotation.State;
