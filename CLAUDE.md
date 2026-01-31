# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Consensus is a multi-agent consensus system using LangGraph. Multiple AI agents participate in structured meetings to
discuss topics, vote, and reach consensus (100% agreement required). The system uses a "single agent function"
architecture where LangGraph has one node that routes to different handlers based on `state.action`.

## Tech Stack

-   **Backend**: Bun + Hono + LangGraph + Anthropic/OpenAI SDKs
-   **Frontend**: React 19 + Vite + Tailwind CSS + Radix UI (ShadCN-style components)
-   **State Management**: LangGraph State Annotation (backend), @nanostores (frontend)
-   **Testing**: Vitest

## Common Commands

```bash
# Development
pnpm dev:all              # Start both frontend and backend
pnpm dev:server           # Start backend only (Bun on port 8123)
pnpm dev:frontend         # Start frontend only (Vite on port 5173)

# Building
pnpm build                # Build both server and frontend
pnpm build:server         # Build server (TypeScript compilation)
pnpm build:frontend       # Build frontend (Vite build)

# Type checking
pnpm type-check           # Type check all packages
pnpm type-check:server    # Type check server only
pnpm type-check:frontend  # Type check frontend only

# Testing
pnpm test                 # Run Vitest tests
```

## Architecture

### Backend Structure

```
server/src/
├── agent/
│   ├── types.ts              # Core type definitions (AgentConfig, ModelConfig, etc.)
│   ├── standard-agent.ts     # Agent factory using langchain createAgent()
│   ├── consensus-state.ts    # LangGraph state annotation (ConsensusAnnotation)
│   ├── consensus-graph.ts    # Single-node LangGraph with action-based routing
│   └── tools/
│       ├── index.ts          # Tool registry for loading tools from config
│       └── registry.ts       # Tool definitions
├── config/
│   ├── master-agent.ts       # Config for the moderator/summarizer agent
│   └── agents/
│       └── *.ts              # Individual agent role configs (PM, Tech Lead, etc.)
├── utils/
│   ├── initChatModel.ts      # Factory for Anthropic/OpenAI chat models
│   └── ask-agents.ts         # Helper to create sub-agents as tools
└── index.ts                  # Hono server with LangGraph adapter
```

### Key Backend Concepts

**Single Agent Function Architecture**: The LangGraph has only one node (`consensusAgentFunction`) that switches
behavior based on `state.action`:

-   `DISCUSS`: Agents share perspectives on the topic
-   `VOTE`: All agents vote yes/no (requires 100% consensus)
-   `CHECK_CONSENSUS`: If not unanimous, dissenting agents speak
-   `SUMMARIZE`: Master agent creates final summary

**Agent Factory Pattern**: `createStandardAgent()` in `server/src/agent/standard-agent.ts` creates LangChain agents from
`AgentConfig` objects. The config includes:

-   `role`: Name, description, perspective, system prompt
-   `model`: Provider (anthropic/openai), model name, thinking mode toggle
-   `tools`: Object mapping tool names to boolean enables

**Tool System**: Tools are loaded dynamically from config via `toolRegistry.loadFromConfig()`. Custom tools can be added
to `server/src/agent/tools/registry.ts`.

**Sub-agents as Tools**: Participants are exposed as tools to the master agent via `ask_subagents()` helper from
`utils/ask-agents.ts`.

### Frontend Structure

```
frontend/src/
├── components/
│   ├── chat/                  # Chat interface components
│   │   ├── ChatPage.tsx       # Main chat page (refactored to use AppShell)
│   │   ├── ChatPageHeader.tsx # Chat page header component
│   │   ├── ChatInput.tsx      # Message input
│   │   ├── MessageList.tsx    # Message display
│   │   ├── HistorySidebar.tsx # Legacy fixed sidebar (deprecated)
│   │   └── [message types]
│   ├── agent-config/          # Agent configuration UI
│   ├── ai-elements/           # Markdown rendering (Streamdown)
│   └── ui/                    # Radix UI components
│       ├── sheet.tsx          # Drawer/Sheet component
│       └── ...
├── pages/
│   ├── ChatPage.tsx           # Chat route (uses AppShell + HistoryDrawer)
│   └── AgentConfigPage.tsx    # Agent config route (uses AppShell + AppShellHeader)
├── layouts/
│   ├── AppShell.tsx           # Unified application shell container
│   ├── AppShellHeader.tsx     # Reusable page header component
│   ├── HistoryDrawer.tsx      # Drawer-based history panel
│   ├── Header.tsx             # Global navigation header
│   ├── Main.tsx               # Main layout with header
│   └── index.tsx              # Layout exports
├── contexts/
│   └── DrawerContext.tsx      # Global drawer state management
└── main.tsx                   # App entry point
```

### Frontend Layout System

The application uses an **App Shell** architecture with a drawer-based navigation system:

**AppShell** (`layouts/AppShell.tsx`):
- Main container component for all pages
- Supports optional page header and drawer content
- Flex layout with full-height design

**AppShellHeader** (`layouts/AppShellHeader.tsx`):
- Reusable page header with title, description, and actions
- Consistent styling across all pages

**HistoryDrawer** (`layouts/HistoryDrawer.tsx`):
- Drawer-based history panel using Sheet component
- Slides in from left on desktop, right on mobile
- Triggered by history button in global Header

**DrawerContext** (`contexts/DrawerContext.tsx`):
- Global state for drawer open/close
- Provides `useDrawer()` hook for accessing drawer state

**Sheet** (`components/ui/sheet.tsx`):
- Radix UI Dialog-based drawer component
- Supports 4 directions (top/right/bottom/left)
- Smooth animations and backdrop

### Frontend Details

-   **Streaming**: Uses Vercel AI SDK (`ai` package) for streaming responses
-   **Markdown**: Streamdown with plugins for code, math, mermaid, CJK support
-   **State**: @nanostores for lightweight state management, Context API for drawer state
-   **Routing**: React Router v7
-   **Layout**: App Shell pattern with drawer-based navigation

## Configuration

### Environment Variables

Required in `.env`:

```
OPENAI_API_KEY=               # Required (even if using Anthropic)
OPENAI_BASE_URL=              # Optional custom base URL

# For PostgreSQL persistence (optional, defaults to SQLite):
# DATABASE_URL=postgresql://...
# DATABASE_NAME=langgraph_db
```

The project uses SQLite by default for state persistence (`.langgraph_api/langgraph.db`).

### Agent Configuration

Agent roles are defined in `server/src/config/agents/*.ts`. Each config exports an `AgentConfig` object:

```typescript
export const exampleAgentConfig: AgentConfig = {
    id: 'example-agent',
    role: {
        id: 'example',
        name: 'Example Agent',
        description: 'Brief description',
        perspective: 'How they view problems',
        systemPrompt: 'Additional context...', // optional
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        enableThinking: true,
    },
    tools: {
        search: true, // Enable search tool
        code: false, // Disable code execution
    },
};
```

## Important Implementation Notes

1. **LangGraph State**: All state changes must use `ConsensusAnnotation` from `server/src/agent/consensus-state.ts`. Do
   not modify state directly - return partial state updates from the agent function.

2. **Tool Creation**: When adding new tools, register them in `server/src/agent/tools/registry.ts` and expose a boolean
   flag in `AgentConfig.tools`.

3. **Model Initialization**: Use `initChatModel()` from `server/src/utils/initChatModel.ts` for consistent model
   initialization across the codebase.

4. **Message Filtering**: The system filters messages before passing to sub-agents to avoid exposing tool calls. This is
   done via `messageFilter` parameter in `ask_subagents()`.

5. **Consensus Check**: The consensus logic checks for `<vote>yes</vote>` tags in agent responses. All agents must vote
   yes to reach consensus.

6. **Frontend Streaming**: The backend LangGraph is exposed via `@langgraph-js/pure-graph` Hono adapter at
   `/api/langgraph`. Frontend uses `@langgraph-js/sdk` for streaming.

## Development Patterns

-   **Adding a New Agent**: Create a new config file in `server/src/config/agents/` and import it where needed.
-   **Modifying the Flow**: Edit `consensusAgentFunction` in `server/src/agent/consensus-graph.ts` and update
    `MeetingAction` enum in `consensus-state.ts`.
-   **Custom Voting Logic**: Modify the vote parsing logic in `ask_everyone_to_vote` tool within `consensus-graph.ts`.
-   **Frontend Components**: Use Radix UI primitives from `components/ui/` and compose them with Tailwind utility
    classes.
-   **Frontend Layout**: Use `AppShell` for new pages. Access drawer state via `useDrawer()` hook from `contexts/DrawerContext.tsx`.
