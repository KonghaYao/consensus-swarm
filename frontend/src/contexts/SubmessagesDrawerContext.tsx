import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { RenderMessage } from '@langgraph-js/sdk';

interface SubmessagesDrawerContextValue {
  open: boolean;
  submessages: RenderMessage[] | null;
  agentName: string | null;
  agentAvatar: string | null;
  openDrawer: (submessages: RenderMessage[], agentName: string, agentAvatar: string) => void;
  closeDrawer: () => void;
}

const SubmessagesDrawerContext = createContext<SubmessagesDrawerContextValue>({
  open: false,
  submessages: null,
  agentName: null,
  agentAvatar: null,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export interface SubmessagesDrawerProviderProps {
  children: ReactNode;
}

export function SubmessagesDrawerProvider({ children }: SubmessagesDrawerProviderProps) {
  const [open, setOpen] = useState(false);
  const [submessages, setSubmessages] = useState<RenderMessage[] | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentAvatar, setAgentAvatar] = useState<string | null>(null);

  const openDrawer = (messages: RenderMessage[], name: string, avatar: string) => {
    setSubmessages(messages);
    setAgentName(name);
    setAgentAvatar(avatar);
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
  };

  return (
    <SubmessagesDrawerContext.Provider
      value={{ open, submessages, agentName, agentAvatar, openDrawer, closeDrawer }}
    >
      {children}
    </SubmessagesDrawerContext.Provider>
  );
}

export function useSubmessagesDrawer() {
  const context = useContext(SubmessagesDrawerContext);
  if (!context) {
    throw new Error('useSubmessagesDrawer must be used within a SubmessagesDrawerProvider');
  }
  return context;
}
