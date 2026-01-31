import { useState, useEffect } from 'react';
import type { AgentConfig } from '@/lib/agent-data-service';
import { createAgentAsync, updateAgentAsync } from '@/lib/agent-data-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AgentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentConfig | null;
}

export function AgentConfigDialog({ open, onOpenChange, agent }: AgentConfigDialogProps) {
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
  }, [agent, open]);

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !perspective.trim()) {
      alert('Please fill in all required fields');
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

      onOpenChange(false);
    } catch (error: any) {
      alert(`Failed to save agent: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTool = (tool: string) => {
    setTools((prev) => ({ ...prev, [tool]: !prev[tool] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Role Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent role name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perspective">Perspective *</Label>
              <Textarea
                id="perspective"
                value={perspective}
                onChange={(e) => setPerspective(e.target.value)}
                placeholder="The perspective this agent takes in discussions"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="System prompt for this agent"
                rows={4}
              />
            </div>
          </div>

          {/* Model Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Model Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
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
              <Label htmlFor="model">Model *</Label>
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
                  Enable Thinking
                </Label>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Tools</h3>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
