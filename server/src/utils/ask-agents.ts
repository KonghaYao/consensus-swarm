import { Annotation, Command } from '@langchain/langgraph';
import { HumanMessage, AIMessage, tool } from 'langchain';
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
         * - 'discussion': 只传递讨论相关的消息（HumanMessage, AIMessage），过滤所有工具调用
         * - 'discussion_with_replies': 传递讨论内容 + ask_*_speak 工具的返回（其他 agent 的回复）
         * - 'user': 只传递用户的消息
         */
        messageFilter?: 'all' | 'discussion' | 'discussion_with_replies' | 'user';
        submitInnerMessage?: (task_store: Record<string, any>) => void;
    },
) =>
    tool(
        async (args, config: ToolRuntime<typeof SubAgentStateSchema, any>) => {
            const state = config.state;
            const taskId: string = config.toolCallId;

            // 从工具名称中提取当前 agent 的 id
            // 工具名称格式: ask_{agentId}_speak
            const currentAgentId = options?.name?.replace('ask_', '').replace('_speak', '') || '';

            // 根据过滤策略选择消息
            const sub_state = {
                /** @ts-ignore */
                messages: filterMessages(state.messages || [], options?.messageFilter || 'discussion', currentAgentId),
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
 * 注意：返回的消息会转换视角，让子 agent 能理解
 * @param messages - 原始消息列表
 * @param filter - 过滤策略
 * @param currentAgentId - 当前子 agent 的 id，用于判断是否是自己的话
 */
function filterMessages(
    messages: Message[],
    filter: 'all' | 'discussion' | 'discussion_with_replies' | 'user',
    currentAgentId: string,
): Message[] {
    const filtered: Message[] = [];

    messages.forEach((msg) => {
        const name = msg.constructor.name;

        switch (filter) {
            case 'all':
                filtered.push(msg);
                break;

            case 'discussion':
            case 'discussion_with_replies':
                // HumanMessage: 保留（用户输入）
                if (name === 'HumanMessage') {
                    filtered.push(msg);
                }
                // AIMessage 纯文本：转换视角（主持人/全局 AI 的发言 → 从用户角度）
                else if (name === 'AIMessage' && !('_tool_calls' in msg) && !('tool_calls' in msg)) {
                    // 将主持人的发言转换为 HumanMessage，因为对子 agent 来说这是"外部输入"
                    filtered.push(
                        new HumanMessage({
                            // @ts-ignore
                            content: msg.content,
                        }),
                    );
                }
                // tool 消息：仅在 discussion_with_replies 模式下保留 ask_*_speak 的返回
                else if (filter === 'discussion_with_replies') {
                    // @ts-ignore
                    if (msg.role === 'tool') {
                        // @ts-ignore
                        const toolName = msg.name || '';
                        // 检查是否是 ask_*_speak 工具的返回
                        if (toolName.startsWith('ask_') && toolName.endsWith('_speak')) {
                            // 从工具名称中提取 agent id: ask_{agentId}_speak
                            const msgAgentId = toolName.replace('ask_', '').replace('_speak', '');

                            // @ts-ignore
                            const content = msg.text || '';
                            // ask_*_speak 工具返回格式：task_id: xxx\n---\n回复内容
                            if (content.includes('task_id:') && content.includes('\n---\n')) {
                                // 提取实际的回复内容
                                const parts = content.split('\n---\n');
                                const replyContent = parts.length > 1 ? parts[1] : content;

                                // 判断是自己的话还是别人的话
                                if (msgAgentId === currentAgentId) {
                                    // 自己说的话，转换为 AIMessage
                                    filtered.push(
                                        // @ts-ignore
                                        new AIMessage({
                                            content: replyContent,
                                        }),
                                    );
                                } else {
                                    // 别人说的话，转换为 HumanMessage，并标记是谁说的
                                    filtered.push(
                                        new HumanMessage({
                                            content: `[${msgAgentId}]: ${replyContent}`,
                                        }),
                                    );
                                }
                            } else {
                                filtered.push(msg);
                            }
                        } else {
                            // 其他工具消息，保持不变
                            filtered.push(msg);
                        }
                    }
                }
                break;

            case 'user':
                // 只传递用户的消息
                if (name === 'HumanMessage') {
                    filtered.push(msg);
                }
                break;
        }
    });

    return filtered;
}
