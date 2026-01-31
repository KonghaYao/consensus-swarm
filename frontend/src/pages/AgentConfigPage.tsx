import { useState, useEffect, useCallback } from 'react';
import {
  getAgentsAsync,
  deleteAgentAsync,
  resetAgentsAsync,
  type AgentConfig,
} from '@/lib/agent-data-service';
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
import { AgentConfigDialog } from '@/components/agent-config';
import { Pencil, Trash2, Plus, RotateCcw } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { AppShellHeader } from '@/layouts/AppShellHeader';

export function AgentConfigPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgentsAsync();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleAdd = () => {
    setEditingAgent(null);
    setDialogOpen(true);
  };

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      setActionInProgress(true);
      try {
        const success = await deleteAgentAsync(id);
        if (success) {
          await loadAgents();
        } else {
          alert('Failed to delete agent. It may be a default agent that cannot be deleted.');
        }
      } catch (error: any) {
        alert(`Failed to delete agent: ${error.message}`);
      } finally {
        setActionInProgress(false);
      }
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all agents to default configurations? This will delete all custom agents.')) {
      setActionInProgress(true);
      try {
        await resetAgentsAsync();
        await loadAgents();
      } catch (error: any) {
        alert(`Failed to reset agents: ${error.message}`);
      } finally {
        setActionInProgress(false);
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAgent(null);
    // Reload agents after dialog closes (in case of changes)
    loadAgents();
  };

  return (
    <AppShell
      header={
        <AppShellHeader
          title="Agent 配置"
          description="管理 AI Agent 的角色和行为"
          actions={
            <>
              <Button variant="outline" onClick={handleReset} disabled={actionInProgress}>
                <RotateCcw className="w-4 h-4 mr-2" />
                重置为默认
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                添加 Agent
              </Button>
            </>
          }
        />
      }
    >
      <div className="container mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">加载 Agents 配置...</p>
          </div>
        ) : (
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
                      size="icon"
                      onClick={() => handleEdit(agent)}
                      title="Edit"
                      disabled={actionInProgress}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => handleDelete(agent.id)}
                      title="Delete"
                      disabled={actionInProgress}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <AgentConfigDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          agent={editingAgent}
        />
      </div>
    </AppShell>
  );
}
