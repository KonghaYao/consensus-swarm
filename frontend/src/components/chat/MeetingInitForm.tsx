/**
 * MeetingInitForm - 会议初始化表单
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Target, Crown } from 'lucide-react';
import type { AgentConfig } from '@/lib/agent-data-service';

interface MeetingInitFormProps {
  agents: AgentConfig[];
  onSubmit: (data: { topic: string; context: string; selectedAgents: string[] }) => void;
}

export function MeetingInitForm({ agents, onSubmit }: MeetingInitFormProps) {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');

  // 主持人 agent ID
  const masterAgentId = 'master';

  // 使用 useState 的惰性初始化，只会在首次渲染时执行一次
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() => {
    const defaultAgents = [masterAgentId];
    const suggestedAgents = ['technical-director', 'product-manager', 'team-lead'];
    suggestedAgents.forEach(id => {
      if (agents.find(a => a.id === id)) {
        defaultAgents.push(id);
      }
    });
    return defaultAgents;
  });

  const handleToggleAgent = (agentId: string) => {
    // 主持人不能取消
    if (agentId === masterAgentId) return;

    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    const nonMasterAgents = agents.filter(a => a.id !== masterAgentId);
    const allNonMasterSelected = nonMasterAgents.every(a =>
      selectedAgents.includes(a.id)
    );

    if (allNonMasterSelected) {
      // 只保留主持人
      setSelectedAgents([masterAgentId]);
    } else {
      // 选择所有
      setSelectedAgents(agents.map((a) => a.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    if (selectedAgents.length === 0) return;

    onSubmit({
      topic: topic.trim(),
      context: context.trim(),
      selectedAgents,
    });
  };

  const isValid = topic.trim() && selectedAgents.length > 0;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-2xl">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">开始新的共识会议</h1>
          <p className="text-muted-foreground">
            设置会议主题，选择参会人员，让 AI Agents 达成共识
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 会议主题 */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              会议主题 *
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：是否应该采用微服务架构？"
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground">
              清晰描述需要讨论和达成共识的核心议题
            </p>
          </div>

          {/* 背景信息 */}
          <div className="space-y-2">
            <Label htmlFor="context" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              背景信息（可选）
            </Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="提供相关背景信息、约束条件、参考材料等..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              详细的背景信息有助于 Agents 更好地理解问题
            </p>
          </div>

          {/* 参会人员 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                参会人员 * ({selectedAgents.length} 已选择)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                选择全部
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                const isMaster = agent.id === masterAgentId;

                return (
                  <div
                    key={agent.id}
                    className={`
                      p-4 rounded-lg border-2 transition-all relative
                      ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${isMaster ? 'border-amber-400 bg-amber-50/50' : ''}
                    `}
                  >
                    {/* 主持人标识 */}
                    {isMaster && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          主持人
                        </Badge>
                      </div>
                    )}

                    <div
                      className={`flex items-start gap-3 ${!isMaster ? 'cursor-pointer' : ''}`}
                      onClick={() => !isMaster && handleToggleAgent(agent.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isMaster}
                        onChange={() => handleToggleAgent(agent.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{agent.role.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.model.provider}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {agent.role.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          视角: {agent.role.perspective}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              主持人是会议的必需参与者，其他人员可根据需要选择
            </p>
          </div>

          {/* 提交按钮 */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isValid}
          >
            开始会议
          </Button>
        </form>

        {/* 提示信息 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>会议流程：</strong>
            主持人将协调所有选中的 Agents 进行讨论、投票，直到达成共识或达到最大轮次限制。
            所有参与者必须 100% 同意才能结束会议。
          </p>
        </div>
      </div>
    </div>
  );
}
