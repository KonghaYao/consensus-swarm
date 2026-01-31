# Agent Config CRUD Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CRUD page for managing Agent configurations by directly sharing types and config data from backend, with role and model information embedded in AgentConfig objects.

**Architecture:** Create a new frontend page that imports types from `server/src/agent/types.ts` and config data from `server/src/config/`, using in-memory state management for CRUD operations. Use existing Radix UI components (Table, Dialog, Button, Input) following the shadcn/ui pattern.

**Tech Stack:** React 19, React Router v7, Radix UI (shadcn/ui), Tailwind CSS v4

---

## Task 1: Create data service that imports from backend

**Files:**
- Create: `frontend/src/lib/agent-data-service.ts`

**Step 1: Create service that shares backend types and config**

```typescript
// Import types and config directly from backend
import type { AgentConfig } from '../../../server/src/agent/types.js';
import { masterAgentConfig } from '../../../server/src/config/master-agent.js';
import { subAgentConfigs } from '../../../server/src/config/agents/index.js';

// Re-export types for frontend use
export type { AgentConfig };

// Initial data from backend config files
const initialAgents: AgentConfig[] = [
  masterAgentConfig,
  ...subAgentConfigs,
];

// In-memory state
let agents: AgentConfig[] = [...initialAgents];

// CRUD operations
export function getAgents(): AgentConfig[] {
  return agents;
}

export function getAgentById(id: string): AgentConfig | undefined {
  return agents.find((agent) => agent.id === id);
}

export function createAgent(agent: Omit<AgentConfig, 'id'>): AgentConfig {
  const newAgent: AgentConfig = {
    ...agent,
    id: `agent-${Date.now()}`,
  };
  agents.push(newAgent);
  return newAgent;
}

export function updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | null {
  const index = agents.findIndex((agent) => agent.id === id);
  if (index === -1) return null;

  agents[index] = { ...agents[index], ...updates };
  return agents[index];
}

export function deleteAgent(id: string): boolean {
  const initialLength = agents.length;
  agents = agents.filter((agent) => agent.id !== id);
  return agents.length < initialLength;
}

export function resetAgents(): void {
  agents = [...initialAgents];
}
```

**Step 2: Commit**

```bash
git add frontend/src/lib/agent-data-service.ts
git commit -m "feat: add agent data service sharing backend types and config"
```

---

## Task 2: Create Agent Config List page

**Files:**
- Create: `frontend/src/pages/AgentConfigPage.tsx`

**Step 1: Create the list page component with table**

```typescript
import { useState, useEffect } from 'react';
import { getAgents, deleteAgent, type AgentConfig } from '@/lib/agent-data-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentConfigDialog } from '@/components/agent-config/AgentConfigDialog';

export function AgentConfigPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);

  useEffect(() => {
    setAgents(getAgents());
  }, [dialogOpen]);

  const handleAdd = () => {
    setEditingAgent(null);
    setDialogOpen(true);
  };

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(id);
      setAgents(getAgents());
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agent Configurations</h1>
        <Button onClick={handleAdd}>Add Agent</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Role Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Tools</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-mono text-sm">{agent.id}</TableCell>
              <TableCell className="font-medium">{agent.role.name}</TableCell>
              <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                {agent.role.description}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {agent.model.provider}/{agent.model.model}
                </Badge>
              </TableCell>
              <TableCell>
                {Object.entries(agent.tools)
                  .filter(([, enabled]) => enabled)
                  .map(([tool]) => (
                    <Badge key={tool} variant="secondary" className="mr-1">
                      {tool}
                    </Badge>
                  ))}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(agent)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleDelete(agent.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AgentConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
      />
    </div>
  );
}
```

**Step 2: Add route to App.tsx**

```typescript
// Modify: frontend/src/App.tsx
import { AgentConfigPage } from './pages/AgentConfigPage';

// Add route inside Layout
<Route path="agents" element={<AgentConfigPage />} />
```

**Step 3: Commit**

```bash
git add frontend/src/pages/AgentConfigPage.tsx frontend/src/App.tsx
git commit -m "feat: add agent config list page with table view"
```

---

## Task 3: Create Agent Config Dialog for create/edit

**Files:**
- Create: `frontend/src/components/agent-config/AgentConfigDialog.tsx`

**Step 1: Create dialog form component**

```typescript
import { useState, useEffect } from 'react';
import type { AgentConfig } from '@/lib/agent-data-service';
import { createAgent, updateAgent } from '@/lib/agent-data-service';
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

  const handleSave = () => {
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
      updateAgent(agent.id, agentConfig);
    } else {
      createAgent(agentConfig);
    }

    onOpenChange(false);
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/agent-config/AgentConfigDialog.tsx
git commit -m "feat: add agent config dialog with comprehensive form"
```

---

## Task 4: Add navigation to agents page

**Files:**
- Check and modify: `frontend/src/layouts/index.tsx` or navigation component

**Step 1: Add navigation link**

```typescript
// Find the existing navigation component and add link
import { Link } from 'react-router-dom';

<Link to="/agents" className="...">
  Agent Configs
</Link>
```

**Step 2: Commit**

```bash
git add frontend/src/layouts/index.tsx
git commit -m "feat: add navigation link to agents page"
```

---

## Testing Checklist

1. **Shared Data**
   - [ ] Types imported from `server/src/agent/types.ts`
   - [ ] Config data imported from `server/src/config/`
   - [ ] Initial agents include master and all sub-agents

2. **List View**
   - [ ] All 10 agents display in table (1 master + 9 sub-agents)
   - [ ] Role name, description, model, and tools display correctly
   - [ ] Long descriptions truncate properly

3. **Create Agent**
   - [ ] Dialog opens with empty form
   - [ ] All required fields validate
   - [ ] Model options update when provider changes
   - [ ] Tools toggle correctly
   - [ ] New agent appears in list after save

4. **Edit Agent**
   - [ ] Dialog opens with pre-filled data from selected agent
   - [ ] Changes save correctly
   - [ ] List updates immediately after save

5. **Delete Agent**
   - [ ] Confirmation dialog shows
   - [ ] Agent removes from list after confirmation
   - [ ] Cancel keeps the agent

---

## Notes

- **Shared Types**: `AgentConfig`, `AgentRoleConfig`, `ModelConfig` imported directly from `server/src/agent/types.ts`
- **Shared Config Data**: `masterAgentConfig` and `subAgentConfigs` imported from `server/src/config/`
- Frontend uses in-memory array manipulation for state (not nanostores)
- Role and Model are embedded within AgentConfig structure
- Form validation can be enhanced later with Zod
- Toast notifications can be added using sonner for feedback
- Future: Connect CRUD operations to actual backend API endpoints
