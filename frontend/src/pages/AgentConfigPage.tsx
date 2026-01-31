import { useState, useEffect, useCallback } from 'react';
import {
  getAgentsAsync,
  deleteAgentAsync,
  resetAgentsAsync,
  type AgentConfig,
} from '@/lib/agent-data-service';
import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/agent-config/AgentCard';
import { AgentConfigForm } from '@/components/agent-config/AgentConfigForm';
import { Plus, RotateCcw, X } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { AppShellHeader } from '@/layouts/AppShellHeader';

export function AgentConfigPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(true);
  };

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingAgent(null);
    loadAgents();
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

  return (
    <AppShell
      header={
        <AppShellHeader
          title="Agent 配置"
          description="管理 AI Agent 的角色和行为"
          actions={
            !showForm ? (
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
            ) : (
              <Button variant="outline" onClick={handleFormCancel}>
                <X className="w-4 h-4 mr-2" />
                关闭
              </Button>
            )
          }
        />
      }
    >
      <div className="flex h-full">
        {/* 左侧内容区 */}
        <div className="flex-1 p-6 transition-all duration-300">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">加载 Agents 配置...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无 Agent 配置</h3>
              <p className="text-sm text-muted-foreground">点击右上角"添加 Agent"开始创建</p>
            </div>
          ) : (
            <div className={`grid gap-4 lg:gap-6 ${
              showForm
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
            }`}>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  actionInProgress={actionInProgress}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧配置栏 */}
        {showForm && (
          <div className="w-full sm:w-96 border-l bg-background p-6 overflow-y-auto">
            <AgentConfigForm
              agent={editingAgent}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
