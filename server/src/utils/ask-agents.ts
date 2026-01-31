import { Annotation, Command } from '@langchain/langgraph';
import { HumanMessage, tool } from 'langchain';
import { z } from 'zod';
import { Message } from '@langchain/core/messages';
import { type ToolRuntime } from '@langchain/core/tools';
import { createState } from '@langgraph-js/pro';

export const SubAgentStateSchema = z.object({
    task_store: z.record(z.string(), z.any()).default({}),
});

export const SubAgentAnnotation = createState().build({
    task_store: Annotation({
        reducer: (a, b: any) => ({ ...a, ...b }),
        default: () => ({}),
    }),
});

const schema = z.object({
    task_id: z
        .string()
        .optional()
        .describe('The task id to ask the subagent, if not provided, will use the tool call id'),
    subagent_id: z.string().optional(),
    task_description: z.string().describe('Describe the user state and what you want the subagent to do.'),
    data_transfer: z.any().optional().describe('Data to transfer to the subagent.'),
});

export const ask_subagents = (
    agentCreator: (task_id: string, args: z.infer<typeof schema>, parent_state: any) => Promise<any>,
    options?: {
        name?: string;
        description?: string;
        passThroughKeys?: string[];
        /**
         * 消息过滤策略
         * - 'all': 传递所有消息
         * - 'discussion': 只传递讨论相关的消息（HumanMessage, AIMessage），过滤主持人的工具调用
         * - 'user': 只传递用户的消息
         */
        messageFilter?: 'all' | 'discussion' | 'user';
        submitInnerMessage?: (task_store: Record<string, any>) => void;
    },
) =>
    tool(
        async (args, config: ToolRuntime<typeof SubAgentStateSchema, any>) => {
            const state = config.state;
            const taskId: string = config.toolCallId;

            // 根据过滤策略选择消息
            const sub_state = {
                /** @ts-ignore */
                messages: filterMessages(state.messages || [], options?.messageFilter || 'discussion'),
            };

            // 传递其他重要状态字段（如果有配置的话）
            if (options?.passThroughKeys) {
                options.passThroughKeys.forEach((key) => {
                    if (key in state) {
                        sub_state[key] = state[key];
                    }
                });
            }

            const agent = await agentCreator(taskId, args, state);
            sub_state.messages.push(
                new HumanMessage({
                    content: args.task_description,
                }),
            );

            const new_state = await agent.invoke(sub_state);
            const last_message = new_state['messages'].at(-1);

            const update: any = {
                task_store: {
                    ...(state?.['task_store'] || {}),
                    [taskId]: new_state,
                },
                messages: [
                    {
                        role: 'tool',
                        content: `task_id: ${taskId}\n---\n` + (last_message?.text || ''),
                        tool_call_id: config.toolCallId!,
                    },
                ],
            };

            // 如果配置了 pass_through_keys，将子 agent 的某些状态更新传回父状态
            options?.passThroughKeys?.forEach((key) => {
                if (key in new_state) {
                    update[key] = new_state[key];
                }
            });
            options?.submitInnerMessage({
                [taskId]: new_state,
            });
            return new Command({
                update,
            });
        },
        {
            name: options?.name || 'ask_subagents',
            description: options?.description || 'ask subagents to help you',
            schema,
        },
    );

/**
 * 根据过滤策略筛选消息
 */
function filterMessages(messages: Message[], filter: 'all' | 'discussion' | 'user'): Message[] {
    switch (filter) {
        case 'all':
            return messages;

        case 'discussion':
            // 只传递讨论相关的消息：HumanMessage 和 AIMessage
            // 过滤掉主持人的工具调用消息（role: 'tool'）
            return messages.filter(
                (msg) =>
                    msg.constructor.name === 'HumanMessage' ||
                    (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg) && !('tool_calls' in msg)),
            );

        case 'user':
            // 只传递用户的消息
            return messages.filter((msg) => msg.constructor.name === 'HumanMessage');

        default:
            return messages;
    }
}
