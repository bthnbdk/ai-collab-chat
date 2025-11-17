import React from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import ChatWindow from '@/components/ChatWindow';
import Login from '@/components/Login';
import { useStore } from '@/store';

const App: React.FC = () => {
  const { isLoggedIn, handleLogin } = useStore(state => ({
    isLoggedIn: state.isLoggedIn,
    handleLogin: state.handleLogin,
  }));

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-background text-foreground">
      <SettingsPanel />
      <main className="flex-1 flex flex-col h-full">
        <ChatWindow />
      </main>
    </div>
  );
};

export default App;
