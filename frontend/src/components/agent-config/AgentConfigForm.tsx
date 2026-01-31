import { useState, useEffect } from 'react';
import type { AgentConfig } from '@/lib/agent-data-service';
import { createAgentAsync, updateAgentAsync } from '@/lib/agent-data-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AgentConfigFormProps {
  agent: AgentConfig | null;
  onSave: () => void;
  onCancel: () => void;
}

export function AgentConfigForm({ agent, onSave, onCancel }: AgentConfigFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [perspective, setPerspective] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'google'>('openai');
  const [model, setModel] = useState('mimo-v2-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [enableThinking, setEnableThinking] = useState(false);
  const [tools, setTools] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const availableTools = ['invoke_sub_agent', 'web_search', 'code_execution'];
  const availableModels = {
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    openai: ['mimo-v2-flash', 'gpt-4', 'gpt-3.5-turbo'],
    google: ['gemini-pro', 'gemini-flash'],
  };

  useEffect(() => {
    if (agent) {
      setName(agent.role.name);
      setDescription(agent.role.description);
      setPerspective(agent.role.perspective);
      setSystemPrompt(agent.role.systemPrompt || '');
      setProvider(agent.model.provider);
      setModel(agent.model.model);
      setTemperature(agent.model.temperature || 0.7);
      setEnableThinking(agent.model.enableThinking || false);
      setTools(agent.tools);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setPerspective('');
      setSystemPrompt('');
      setProvider('openai');
      setModel('mimo-v2-flash');
      setTemperature(0.7);
      setEnableThinking(false);
      setTools({});
    }
  }, [agent]);

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !perspective.trim()) {
      alert('请填写所有必填字段');
      return;
    }

    setSaving(true);
    try {
      const agentConfig: Omit<AgentConfig, 'id'> = {
        role: {
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          description,
          perspective,
          systemPrompt,
        },
        model: {
          provider,
          model,
          temperature,
          enableThinking,
        },
        tools,
      };

      if (agent) {
        await updateAgentAsync(agent.id, agentConfig);
      } else {
        await createAgentAsync(agentConfig);
      }

      onSave();
    } catch (error: any) {
      alert(`保存 Agent 失败：${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTool = (tool: string) => {
    setTools((prev) => ({ ...prev, [tool]: !prev[tool] }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">{agent ? '编辑 Agent' : '创建 Agent'}</h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {/* 角色配置 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">角色配置</h3>

          <div className="space-y-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent 角色名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述 *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述此角色"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perspective">视角 *</Label>
            <Textarea
              id="perspective"
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              placeholder="该 Agent 在讨论中的立场和视角"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">系统提示词</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="该 Agent 的系统提示词"
              rows={4}
            />
          </div>
        </div>

        {/* 模型配置 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">模型配置</h3>

          <div className="space-y-2">
            <Label htmlFor="provider">服务商 *</Label>
            <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">模型 *</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels[provider].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="enableThinking"
                checked={enableThinking}
                onCheckedChange={(checked: any) => setEnableThinking(checked)}
              />
              <Label htmlFor="enableThinking" className="cursor-pointer">
                启用思考模式
              </Label>
            </div>
          </div>
        </div>

        {/* 工具配置 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">工具</h3>
          <div className="space-y-2">
            {availableTools.map((tool) => (
              <div key={tool} className="flex items-center space-x-2">
                <Checkbox
                  id={tool}
                  checked={tools[tool] || false}
                  onCheckedChange={() => handleToggleTool(tool)}
                />
                <Label htmlFor={tool} className="cursor-pointer">
                  {tool}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t mt-auto">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
          取消
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? '保存中…' : '保存'}
        </Button>
      </div>
    </div>
  );
}
