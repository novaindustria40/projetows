
import React, { useState, useEffect } from 'react';
import { Zap, Menu } from 'lucide-react';
import { AppView, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import Connection from './pages/Connection';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [categories, setCategories] = useState<string[]>(['Promocional', 'Informativo', 'Cobrança', 'Saudação', 'Aniversário']);
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'ZapScale User',
    email: 'user@zapscale.com',
    companyName: 'ZapScale Inc.'
  });

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    // In a real app, this would call an API
    setUser(null); 
    // Redirect or show login
    window.location.reload();
  };

  const renderContent = () => {
    if (!user) return <Connection />; // Default to connection page if no user
    
    switch (view) {
      case AppView.DASHBOARD: return <Dashboard user={user} />;
      case AppView.MESSAGES: 
        return <Messages categories={categories} />;
      case AppView.CAMPAIGNS: return <Campaigns />;
      case AppView.SETTINGS: 
        return <Settings user={user} theme={{ isDark, toggleTheme }} categories={categories} setCategories={setCategories} />;
      case AppView.CONNECTION: return <Connection />;
      default: return <Dashboard user={user} />;
    }
  };

  // If there's no user, we can assume we need to connect.
  // This simplifies the logic without a full auth system.
  if (!user) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="p-4 md:p-8">
                <Connection />
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar 
        currentView={view} 
        onChangeView={(v) => { setView(v); setIsMobileOpen(false); }} 
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden h-16 bg-white dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
            <Menu />
          </button>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Zap className="w-6 h-6 text-primary-500"/>
            ZapScale
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
