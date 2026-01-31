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
import { AgentConfigDialog } from '@/components/agent-config';
import { Pencil, Trash2, Plus } from 'lucide-react';

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
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
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
                  size="icon"
                  onClick={() => handleEdit(agent)}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={() => handleDelete(agent.id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
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
