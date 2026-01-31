import type { AgentConfig } from '@/lib/agent-data-service';
import { generateAvatarUrl } from '@/lib/agent-data-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

interface AgentCardProps {
  agent: AgentConfig;
  onEdit: (agent: AgentConfig) => void;
  onDelete: (id: string) => void;
  actionInProgress: boolean;
}

export function AgentCard({
  agent,
  onEdit,
  onDelete,
  actionInProgress,
}: AgentCardProps) {
  const providerColors: Record<string, string> = {
    anthropic: 'bg-orange-50 text-orange-700 border-orange-200',
    openai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    google: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const enabledTools = Object.entries(agent.tools)
    .filter(([, enabled]) => enabled)
    .map(([tool]) => tool);

  const avatarUrl = generateAvatarUrl(agent.id, agent.role.name);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200 flex flex-col items-center relative aspect-[3/4]">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm"
          onClick={() => onEdit(agent)}
          disabled={actionInProgress}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete(agent.id)}
          disabled={actionInProgress}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <CardHeader className="pb-2 pt-4 px-3 text-center w-full">
        {/* Avatar */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 overflow-hidden border-2 border-white shadow-sm">
          <img
            src={avatarUrl}
            alt={agent.role.name}
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold leading-tight mb-1.5 px-1">
          {agent.role.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[90%] mx-auto">
          {agent.role.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 pb-3 px-3 w-full">
        {/* Model Info */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
            {agent.model.model}
          </Badge>
          {agent.model.enableThinking && (
            <Badge variant="default" className="text-xs whitespace-nowrap">
              Thinking
            </Badge>
          )}
          {agent.model.temperature !== undefined && (
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              T: {agent.model.temperature}
            </Badge>
          )}
        </div>

        {/* Tools */}
        {enabledTools.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {enabledTools.map((tool) => (
              <Badge key={tool} variant="secondary" className="text-xs whitespace-nowrap">
                {tool}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
