/**
 * MeetingInitForm - 会议初始化表单
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Target, Crown, Shuffle, Loader2, CheckCircle2 } from 'lucide-react';
import type { AgentConfig } from '@/lib/agent-data-service';

interface MeetingInitFormProps {
  agents: AgentConfig[];
  onSubmit: (data: { topic: string; context: string; selectedAgents: string[] }) => void;
}

/**
 * 预设的会议模板
 */
const MEETING_TEMPLATES = [
  {
    topic: '是否应该采用微服务架构？',
    context: `当前系统是单体架构，团队规模约 20 人。
业务复杂度逐渐增加，部署周期变长，部分模块需要独立扩展。

技术栈：Java Spring Boot + PostgreSQL + Redis
考虑因素：
- 开发效率和运维成本
- 系统可扩展性和性能
- 团队技术能力和学习曲线
- 数据一致性和分布式事务处理`,
  },
  {
    topic: '产品是否应该引入 AI 助手功能？',
    context: `我们的产品是企业级协作工具，用户经常需要处理大量文档和信息。

考虑的方向：
- 智能文档摘要和问答
- 自动生成会议纪要
- 智能推荐和搜索

资源限制：
- 开发周期：3 个月
- 预算：需要考虑 API 调用成本
- 团队：有 2 名工程师熟悉 AI/ML

风险：
- 数据隐私和合规性
- AI 生成结果的准确性
- 用户接受度`,
  },
  {
    topic: '是否应该强制执行代码审查政策？',
    context: `当前团队代码审查情况：
- 部分团队成员积极进行 PR review
- 有些代码未经审查直接合并
- 平均 review 响应时间较长

考虑的方案：
A. 所有代码必须经过至少 1 人审查才能合并
B. 按照风险等级分类，核心模块强制审查
C. 保持自愿审查，鼓励文化而非强制

目标：
- 提高代码质量
- 知识共享和团队成长
- 平衡开发效率和代码质量`,
  },
  {
    topic: '是否应该从 REST API 迁移到 GraphQL？',
    context: `当前系统使用 REST API，遇到的问题：
- Over-fetching 和 under-fetching
- 多个 endpoint 导致前端集成复杂
- API 版本管理复杂

GraphQL 的优势：
- 按需获取数据
- 强类型 schema
- 更好的开发工具

顾虑：
- 团队学习成本
- 后端重构工作量
- 缓存和性能优化
- 错误处理和监控`,
  },
  {
    topic: '是否应该采用四天工作制？',
    context: `公司背景：创业公司，约 30 人

支持理由：
- 提高员工满意度和工作生活平衡
- 吸引和保留人才
- 可能提升工作效率

顾虑：
- 项目交付周期压力
- 客户响应时间
- 薪酬是否需要调整

可能的方案：
A. 每周工作 4 天，每天 10 小时
B. 保持每天 8 小时，但每周休 3 天
C. 试点运行 3 个月后再评估`,
  },
  {
    topic: '是否应该开源我们的核心 SDK？',
    context: `我们开发了一个通用的 SDK，用于简化与服务的集成。

优势：
- 社区贡献和反馈
- 品牌曝光和技术影响力
- 招募人才

风险：
- 竞争对手可能利用
- 需要投入资源维护社区
- 可能暴露内部实现细节

考虑条件：
- 文档完善程度
- 代码质量和可维护性
- 商业机密是否包含其中
- 团队支持能力`,
  },
];

export function MeetingInitForm({ agents, onSubmit }: MeetingInitFormProps) {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // 主持人 agent ID
  const masterAgentId = 'master';

  // 使用 useState 的惰性初始化，只会在首次渲染时执行一次
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() => {
    const defaultAgents = [masterAgentId];
    const suggestedAgents = ['technical-director', 'product-manager', 'team-lead'];
    suggestedAgents.forEach((id) => {
      if (agents.find((a) => a.id === id)) {
        defaultAgents.push(id);
      }
    });
    return defaultAgents;
  });

  // Warn before navigation with unsaved changes
  useEffect(() => {
    const hasChanges = topic.trim().length > 0 || context.trim().length > 0;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [topic, context]);

  const handleToggleAgent = React.useCallback(
    (agentId: string) => {
      // 主持人不能取消
      if (agentId === masterAgentId) return;

      setSelectedAgents((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]));
    },
    [masterAgentId],
  );

  const handleSelectAll = () => {
    const nonMasterAgents = agents.filter((a) => a.id !== masterAgentId);
    const allNonMasterSelected = nonMasterAgents.every((a) => selectedAgents.includes(a.id));

    if (allNonMasterSelected) {
      // 只保留主持人
      setSelectedAgents([masterAgentId]);
    } else {
      // 选择所有
      setSelectedAgents(agents.map((a) => a.id));
    }
  };

  const handleRandomTemplate = () => {
    const randomIndex = Math.floor(Math.random() * MEETING_TEMPLATES.length);
    const template = MEETING_TEMPLATES[randomIndex];
    setTopic(template.topic);
    setContext(template.context);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Show errors and validate
    setShowErrors(true);

    if (!topic.trim()) {
      // Focus first error
      const topicInput = document.getElementById('topic') as HTMLInputElement;
      topicInput?.focus();
      return;
    }

    if (selectedAgents.length === 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        topic: topic.trim(),
        context: context.trim(),
        selectedAgents: selectedAgents.filter((i) => i !== 'master'),
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold mb-2 text-wrap-balance">开始新的共识会议</h1>
          <p className="text-muted-foreground">设置会议主题，选择参会人员，让 AI Agents 达成共识</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 会议主题 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topic" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                会议主题 *
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handleRandomTemplate} className="gap-1">
                <Shuffle className="w-3 h-3" />
                随机示例
              </Button>
            </div>
            <Input
              id="topic"
              name="topic"
              type="text"
              autoComplete="off"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：是否应该采用微服务架构？"
              className="text-lg"
              aria-invalid={topic.trim().length === 0 && showErrors ? 'true' : 'false'}
              aria-describedby="topic-error"
            />
            {topic.trim().length === 0 && showErrors && (
              <p id="topic-error" className="text-sm text-red-500" role="alert">
                请输入会议主题
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              清晰描述需要讨论和达成共识的核心议题，或点击"随机示例"快速开始
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
              name="context"
              autoComplete="off"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="提供相关背景信息、约束条件、参考材料等…"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">详细的背景信息有助于 Agents 更好地理解问题</p>
          </div>

          {/* 参会人员 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                参会人员 * ({selectedAgents.length} 已选择)
              </Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
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
                      p-4 rounded-lg border-2 relative overflow-hidden
                      transition-all duration-200 ease-in
                      ${
                        isSelected
                          ? 'border-amber-500 shadow-md shadow-amber-100'
                          : 'border-gray-100 hover:border-gray-200'
                      }
                      ${isMaster ? 'border-amber-400 bg-amber-50/50' : ''}
                    `}
                  >
                    {/* 选中状态指示器 */}
                    {isSelected && !isMaster && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-500 animate-in fade-in zoom-in duration-200" />
                      </div>
                    )}
                    {/* 主持人标识 */}
                    {isMaster && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          主持人
                        </Badge>
                      </div>
                    )}

                    <label
                      htmlFor={`agent-${agent.id}`}
                      className={`flex items-start gap-3 ${!isMaster ? 'cursor-pointer' : ''}`}
                    >
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={isSelected}
                        disabled={isMaster}
                        onCheckedChange={() => handleToggleAgent(agent.id)}
                        className="mt-1"
                      />
                      {agent.avatar && (
                        <div className="relative">
                          <img
                            src={agent.avatar}
                            alt={agent.role.name}
                            className={`
                              w-10 h-10 rounded-full flex-shrink-0 bg-gray-100
                              transition-all duration-200
                              ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2' : ''}
                            `}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {isSelected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{agent.role.name}</span>
                          <Badge variant={isSelected ? 'default' : 'outline'} className="text-xs">
                            {agent.model.provider}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{agent.role.description}</p>
                        <p className="text-xs text-gray-500 mt-1">视角: {agent.role.perspective}</p>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">主持人是会议的必需参与者，其他人员可根据需要选择</p>
          </div>

          {/* 提交按钮 */}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                创建会议中…
              </>
            ) : (
              '开始会议'
            )}
          </Button>
        </form>

        {/* 提示信息 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>会议流程：</strong>
            主持人将协调所有选中的 Agents 进行讨论、投票，直到达成共识或达到最大轮次限制。 所有参与者必须 100%
            同意才能结束会议。
          </p>
        </div>
      </div>
    </div>
  );
}
