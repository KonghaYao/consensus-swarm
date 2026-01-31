import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const DrawerContext = createContext<DrawerContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export interface DrawerProviderProps {
  children: ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);

  return <DrawerContext.Provider value={{ open, setOpen, toggle }}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}
