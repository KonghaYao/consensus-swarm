import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChatProvider } from '@langgraph-js/sdk/react';
import App from './App';
import './index.css';
import { SettingsProvider } from './provider/SettingsProvider';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ChatProvider
          defaultAgent="consensusGraph"
          apiUrl={import.meta.env.VITE_API_URL || new URL('/api/langgraph', location.href).toString()}
          defaultHeaders={{}}
          withCredentials={false}
          showHistory={true}
          showGraph={false}
          onInitError={(error, currentAgent) => {
            console.error(`Failed to initialize ${currentAgent}:`, error);
          }}
        >
          <App />
        </ChatProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
