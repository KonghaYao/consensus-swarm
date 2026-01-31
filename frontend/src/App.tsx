
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { AgentConfigPage } from './pages/AgentConfigPage';
import { Toaster } from './components/ui/sonner';
import { Layout } from './layouts/index';
import { DrawerProvider } from './contexts/DrawerContext';
import { SubmessagesDrawerProvider } from './contexts/SubmessagesDrawerContext';
import { SubmessagesDrawer } from './components/chat/SubmessagesDrawer';
function App() {
  return (
    <DrawerProvider>
      <SubmessagesDrawerProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ChatPage />} />
            <Route path="agents" element={<AgentConfigPage />} />
            {/* 404 重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster />
        <SubmessagesDrawer />
      </SubmessagesDrawerProvider>
    </DrawerProvider>
  );
}

export default App;
