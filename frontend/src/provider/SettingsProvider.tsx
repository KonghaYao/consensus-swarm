import { createContext, useContext, useState, type ReactNode } from 'react';

interface SettingsContextType {
  extraParams: Record<string, any>;
  setExtraParam: (key: string, value: any) => void;
  removeExtraParam: (key: string) => void;
  clearExtraParams: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [extraParams, setExtraParams] = useState<Record<string, any>>({});

  const setExtraParam = (key: string, value: any) => {
    setExtraParams(prev => ({ ...prev, [key]: value }));
  };

  const removeExtraParam = (key: string) => {
    setExtraParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  };

  const clearExtraParams = () => {
    setExtraParams({});
  };

  return (
    <SettingsContext.Provider value={{ extraParams, setExtraParam, removeExtraParam, clearExtraParams }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
